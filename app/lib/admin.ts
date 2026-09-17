import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Segunda capa de verificación de admin (la primera es el middleware en proxy.ts) — nunca basta
// con ocultar el enlace o confiar en una sola capa (09-SEGURIDAD.md, 21-BACKOFFICE.md).
// Para Server Components/layouts: corta con un 404 real (no revela que /admin existe).
export async function requireAdmin(): Promise<{ supabase: SupabaseClient; userId: string }> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: perfil } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (perfil?.role !== 'admin') notFound();

  return { supabase, userId: user.id };
}

// Para Route Handlers de /api/admin/* — `notFound()` no funciona dentro de una ruta de API
// (solo en Server Components), así que esta variante devuelve una respuesta 404 en vez de
// lanzar, para que la ruta corte temprano con `if (!ok) return response;`.
export async function requireAdminApi(): Promise<
  { ok: true; supabase: SupabaseClient; userId: string } | { ok: false; response: NextResponse }
> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'No encontrado.' }, { status: 404 }) };
  }

  const { data: perfil } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (perfil?.role !== 'admin') {
    return { ok: false, response: NextResponse.json({ error: 'No encontrado.' }, { status: 404 }) };
  }

  return { ok: true, supabase, userId: user.id };
}
