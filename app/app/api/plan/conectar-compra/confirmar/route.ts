import { NextResponse, type NextRequest } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/server';
import { crearClienteAdmin } from '@/lib/supabase/admin';
import { hashCodigoVinculo, normalizarCorreo } from '@/lib/hotmart/vinculo-compra';

// "Ya pagué, conectar mi compra" — paso 2: comprueba el código. Toda la regla (intentos, vencimiento, máximo de
// personas por compra, recálculo del plan) vive en la base de datos, en una sola función atómica.
export async function POST(request: NextRequest) {
  const entrada = (await request.json().catch(() => null)) as { email?: unknown; codigo?: unknown } | null;
  const email = normalizarCorreo(entrada?.email);
  const codigo = typeof entrada?.codigo === 'string' ? entrada.codigo.replace(/\D/g, '') : '';
  if (!email || codigo.length !== 6) return NextResponse.json({ error: 'Revisa el correo y el código de 6 números.' }, { status: 400 });

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sin sesión activa.' }, { status: 401 });

  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc('confirmar_vinculo_compra', {
    p_user: user.id,
    p_email: email,
    p_code_hash: hashCodigoVinculo(user.id, email, codigo),
  });
  if (error) return NextResponse.json({ error: 'No pudimos comprobar el código. Intenta de nuevo.' }, { status: 500 });

  const resultado = data as 'ok' | 'codigo_incorrecto' | 'vencido' | 'demasiados_intentos' | 'ya_conectada';
  return NextResponse.json({ resultado }, { status: resultado === 'ok' ? 200 : 422 });
}
