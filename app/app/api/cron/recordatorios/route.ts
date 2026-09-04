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

  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const diaVence = manana.getDate();
  const anio = manana.getFullYear();
  const mes = manana.getMonth() + 1;

  const { data: categorias, error } = await admin
    .from('categories')
    .select('id, nombre, couple_id')
    .eq('es_recurrente', true)
    .eq('dia_vencimiento', diaVence);
  if (error) {
    console.error('[cron/recordatorios] error leyendo categorías:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }

  let enviados = 0;
  for (const cat of categorias ?? []) {
    // Idempotencia: si ya se avisó esta categoría este mes (reintento del cron, doble
    // deploy), no se manda dos veces — el índice único de la tabla lo garantiza.
    const { error: errorMarca } = await admin
      .from('recordatorios_enviados')
      .insert({ category_id: cat.id, anio, mes });
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
          html: `<p>Hola,</p><p>Mañana (día ${diaVence}) vence el pago de <strong>${cat.nombre}</strong>. Entren a DuoSync Wallet para registrarlo apenas lo paguen.</p>`,
        });
        enviados++;
      } catch (e) {
        console.error('[cron/recordatorios] error enviando correo:', e);
      }
    }
  }

  return NextResponse.json({ ok: true, categoriasVencen: categorias?.length ?? 0, correosEnviados: enviados });
}
