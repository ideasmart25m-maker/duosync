import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente de Supabase para Server Components/Actions/Route Handlers. Lee/escribe
// la sesión vía cookies — el patrón oficial de @supabase/ssr para Next.js App
// Router. Sigue usando solo las claves PÚBLICAS: RLS decide qué ve cada usuario,
// no la clave. La clave secreta (service_role) solo se usaría en un contexto
// server-only aparte cuando haga falta saltarse RLS a propósito (webhooks, jobs).
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Se llama desde un Server Component sin permiso de escritura de cookies —
          // se ignora porque el middleware ya se encarga de refrescar la sesión.
        }
      },
    },
  });
}
