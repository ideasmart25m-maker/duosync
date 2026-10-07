import { NextResponse, type NextRequest } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/server';
import { completarVinculacion, destinoSeguro } from '@/lib/auth/completar-sesion';

// Recibe el enlace mágico de Supabase Auth, confirma la sesión real, y recién
// entonces crea o une la pareja (RPC `crear_pareja`/`unirse_con_codigo`) — antes
// de esto, todo el flujo de vinculación era estado local que se perdía al
// recargar (hallazgo crítico de la auditoría de Sesión 6).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = destinoSeguro(searchParams.get('next'));
  const modo = searchParams.get('modo');
  const codigo = searchParams.get('codigo');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=enlace_invalido`);
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=enlace_invalido`);
  }

  const { vinculacionFallo } = await completarVinculacion(supabase, modo, codigo);
  if (vinculacionFallo) return NextResponse.redirect(`${origin}${next}?vinculacion=error`);

  return NextResponse.redirect(`${origin}${next}`);
}
