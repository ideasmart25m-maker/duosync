import { NextResponse, type NextRequest } from 'next/server';
import { crearClienteAdmin } from '@/lib/supabase/admin';
import { crearClienteResend, REMITENTE } from '@/lib/email/resend';

// Corre UNA VEZ AL DÍA (vercel.json → Vercel Cron). Revisa qué categorías recurrentes vencen
// MAÑANA y le avisa por correo a los dos integrantes de esa pareja. Usa la clave secreta
// (crearClienteAdmin) porque necesita leer categorías/parejas de TODOS los usuarios, no solo
// las del que llama — un cron no tiene "sesión de usuario".
export async function GET(request: NextRequest) {
  const secreto = request.headers.get('authorization');
  if (secreto !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const admin = crearClienteAdmin();
  const resend = crearClienteResend();

  // Mantenimiento diario de suscripciones: baja a gratis las parejas cuyo acceso ya venció (sin depender
  // de que llegue un aviso de Hotmart) y purga la bitácora del webhook de más de 90 días.
  const { error: errorPlanes } = await admin.rpc('recalcular_planes_vencidos');
  if (errorPlanes) console.error('[cron] no se pudieron recalcular los planes:', errorPlanes.message);
  // Cuentas de invitado que nunca llegaron a una pareja (más de 7 días sin entrar): se borran.
  const { data: invitadosBorrados, error: errorInvitados } = await admin.rpc('limpiar_invitados_huerfanos');
  if (errorInvitados) console.error('[cron] no se pudieron limpiar invitados huérfanos:', errorInvitados.message);
  else if (invitadosBorrados) console.log(`[cron] invitados huérfanos borrados: ${invitadosBorrados}`);
  const hace90 = new Date(Date.now() - 90 * 86_400_000).toISOString();
  await admin.from('webhook_log').delete().lt('received_at', hace90);
  await admin.from('processed_events').delete().lt('processed_at', hace90);

  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const diaVence = manana.getDate();
  const anio = manana.getFullYear();
  const mes = manana.getMonth() + 1;

  const { data: categorias, error } = await admin
    .from('categories')
    .select('id, nombre, couple_id')
    .eq('es_recurrente', true)
    .contains('dias_vencimiento', [diaVence]);
  if (error) {
    console.error('[cron/recordatorios] error leyendo categorías:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }

  let enviados = 0;
  for (const cat of categorias ?? []) {
    // Idempotencia: si ya se avisó esta categoría (y este día concreto, para categorías con
    // varias facturas como Servicios públicos) este mes, no se manda dos veces — el índice
    // único de la tabla lo garantiza.
    const { error: errorMarca } = await admin
      .from('recordatorios_enviados')
      .insert({ category_id: cat.id, anio, mes, dia: diaVence });
    if (errorMarca) continue; // ya existía → ya se envió, seguir con la siguiente

    const { data: miembros } = await admin.from('couple_members').select('user_id').eq('couple_id', cat.couple_id);
    for (const m of miembros ?? []) {
      const { data: usuario } = await admin.auth.admin.getUserById(m.user_id);
      const email = usuario?.user?.email;
      if (!email) continue;
      try {
        await resend.emails.send({
          from: REMITENTE,
          to: email,
          subject: `Mañana vence: ${cat.nombre}`,
          html: `<p>Hola,</p><p>Mañana (día ${diaVence}) vence el pago de <strong>${cat.nombre}</strong>. Entren a Fairsy para registrarlo apenas lo paguen.</p>`,
        });
        enviados++;
      } catch (e) {
        console.error('[cron/recordatorios] error enviando correo:', e);
      }
    }
  }

  return NextResponse.json({ ok: true, categoriasVencen: categorias?.length ?? 0, correosEnviados: enviados });
}
