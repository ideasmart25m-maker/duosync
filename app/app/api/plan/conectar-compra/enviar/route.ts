import { NextResponse, type NextRequest } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/server';
import { crearClienteAdmin } from '@/lib/supabase/admin';
import { crearClienteResend, REMITENTE } from '@/lib/email/resend';
import { generarCodigoVinculo, hashCodigoVinculo, normalizarCorreo } from '@/lib/hotmart/vinculo-compra';

// "Ya pagué, conectar mi compra" — paso 1: manda un código al correo de la compra. La respuesta es IGUAL exista o
// no una compra con ese correo (no revela quién es cliente) y el límite de envíos se cuenta siempre.
export async function POST(request: NextRequest) {
  const entrada = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = normalizarCorreo(entrada?.email);
  if (!email) return NextResponse.json({ error: 'Escribe un correo válido.' }, { status: 400 });

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sin sesión activa.' }, { status: 401 });

  const admin = crearClienteAdmin();
  const codigo = generarCodigoVinculo();
  const registro = await admin.rpc('crear_codigo_vinculo_compra', {
    p_user: user.id,
    p_email: email,
    p_code_hash: hashCodigoVinculo(user.id, email, codigo),
  });
  if (registro.error) return NextResponse.json({ error: 'No pudimos enviar el código. Intenta de nuevo.' }, { status: 500 });
  if (registro.data === 'demasiados_envios') {
    return NextResponse.json({ error: 'DEMASIADOS_ENVIOS' }, { status: 429 });
  }

  // Solo se manda correo si de verdad hay una compra vigente con ese correo (así no usamos el envío para
  // escribirle a cualquiera), pero al usuario le respondemos lo mismo en los dos casos.
  const { data: sub } = await admin.from('subscriptions').select('status, access_until').eq('email', email).maybeSingle();
  const vigente = !!sub && !['expired', 'refunded', 'chargeback'].includes(sub.status as string) && new Date(sub.access_until as string) > new Date();
  if (vigente) {
    let fallo = false;
    try {
      const { error } = await crearClienteResend().emails.send({
        from: REMITENTE,
        to: email,
        subject: 'Tu código para conectar tu compra en Fairsy',
        html: `<p>Alguien pidió conectar esta compra de Fairsy a su cuenta. Si fuiste tú, escribe este código en la app:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px">${codigo}</p>
<p>Vence en 10 minutos. Si no fuiste tú, ignora este correo: no pasa nada y nadie recibe acceso.</p>
<p>¿Dudas? Escribe a soporte@fairsy.lat.</p>`,
      });
      fallo = !!error;
    } catch {
      fallo = true;
    }
    if (fallo) return NextResponse.json({ error: 'No pudimos enviar el código. Intenta de nuevo en un momento.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
