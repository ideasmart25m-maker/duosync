import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Refresca la sesión de Supabase en cada request — sin esto, el token expira
// mientras el usuario navega y queda "deslogueado" sin razón aparente. Patrón
// oficial de @supabase/ssr para Next.js App Router.
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // La app interna (Hoy/Gastos/Metas/Nosotros) exige sesión real — antes cualquiera
  // podía entrar sin haberse registrado (hallazgo crítico de la auditoría: no había
  // ninguna puerta real antes de estas pantallas). RLS ya protege los DATOS; esto
  // protege la RUTA, para no mostrar ni un layout vacío a quien no inició sesión.
  if (!user && request.nextUrl.pathname.startsWith('/app/')) {
    const loginUrl = new URL('/login?plan=free', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Panel de administración: primera capa de defensa (21-BACKOFFICE.md — "verificado en el
  // servidor, no solo ocultando la ruta"). Esto NO basta solo: el layout de /admin vuelve a
  // verificar el rol server-side, y RLS bloquea las tablas aunque alguien se saltara las dos
  // capas de arriba. A quien no es admin se le devuelve 404 (no login/403) — no se le confirma
  // ni que la ruta existe.
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.rewrite(new URL('/404', request.url), { status: 404 });
    }
    const { data: perfil } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (perfil?.role !== 'admin') {
      return NextResponse.rewrite(new URL('/404', request.url), { status: 404 });
    }
  }

  return respuesta;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
