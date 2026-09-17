import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminApi } from '@/lib/admin';
import { crearClienteAdmin } from '@/lib/supabase/admin';

// Solo el admin puede llegar aquí (requireAdminApi verifica sesión + rol en el servidor, nunca
// se confía en la pantalla). Crea la cuenta con la API de administración de Supabase y le manda
// un correo real de acceso (mismo sistema de siempre — Resend) — para cuando alguien no se pudo
// registrar solo o el enlace no le llegó.
export async function POST(request: NextRequest) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const { email, nombre } = (await request.json()) as { email?: string; nombre?: string };
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Correo inválido.' }, { status: 400 });
  }
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
    return NextResponse.json({ error: 'Falta el nombre.' }, { status: 400 });
  }

  const admin = crearClienteAdmin();
  const { error } = await admin.auth.admin.inviteUserByEmail(email.trim(), { data: { nombre: nombre.trim() } });

  if (error) {
    // "Ya existe" no es un error real para el dueño — solo significa que esa persona ya tiene
    // cuenta y puede entrar con el login normal (Supabase reenvía el correo de acceso igual ahí).
    if (error.message.toLowerCase().includes('already been registered') || error.message.toLowerCase().includes('already registered')) {
      return NextResponse.json({ ok: true, yaExistia: true });
    }
    return NextResponse.json({ error: 'No pudimos crear la cuenta. Intenta de nuevo.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, yaExistia: false });
}
