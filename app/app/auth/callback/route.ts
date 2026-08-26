import { NextResponse, type NextRequest } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/server';

// Recibe el enlace mágico de Supabase Auth, confirma la sesión real, y recién
// entonces crea o une la pareja (RPC `crear_pareja`/`unirse_con_codigo`) — antes
// de esto, todo el flujo de vinculación era estado local que se perdía al
// recargar (hallazgo crítico de la auditoría de Sesión 6).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app/hoy';
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

  if (modo === 'unirse' && codigo) {
    const { error: errorRpc } = await supabase.rpc('unirse_con_codigo', { p_codigo: codigo });
    if (errorRpc) {
      return NextResponse.redirect(`${origin}${next}?vinculacion=error`);
    }
  } else {
    // Solo crea una pareja nueva si todavía no tiene una — si alguien vuelve a
    // tocar el mismo enlace, no debe generarle una segunda pareja duplicada.
    const { data: yaTienePareja } = await supabase.from('couple_members').select('couple_id').limit(1).maybeSingle();
    if (!yaTienePareja) {
      await supabase.rpc('crear_pareja');
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
