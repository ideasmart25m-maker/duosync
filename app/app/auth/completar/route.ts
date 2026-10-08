import { NextResponse, type NextRequest } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/server';
import { completarVinculacion, destinoSeguro } from '@/lib/auth/completar-sesion';

// Destino después de entrar con el CÓDIGO de 6 dígitos (el navegador ya confirmó la sesión con
// verifyOtp). Hace lo mismo que /auth/callback, pero sin intercambiar un código de enlace.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = destinoSeguro(searchParams.get('next'));

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?error=enlace_invalido`);

  const { vinculacionFallo } = await completarVinculacion(supabase, searchParams.get('modo'), searchParams.get('codigo'), searchParams.get('tk'));
  if (vinculacionFallo) return NextResponse.redirect(`${origin}${next}?vinculacion=${vinculacionFallo}`);

  return NextResponse.redirect(`${origin}${next}`);
}
