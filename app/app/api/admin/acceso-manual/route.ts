import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminApi } from '@/lib/admin';
import { crearClienteAdmin } from '@/lib/supabase/admin';

// Deja un espacio activo "a mano" (o le quita ese acceso): para el espacio del dueño y los de prueba, que no pasan por
// Hotmart. Solo el admin llega aquí (requireAdminApi verifica sesión + rol en el servidor). Después de cambiar la marca
// se recalcula el plan del espacio con la misma función que usa el webhook de pagos.
export async function POST(request: NextRequest) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const { coupleId, activo } = (await request.json().catch(() => ({}))) as { coupleId?: string; activo?: boolean };
  if (!coupleId || typeof coupleId !== 'string' || typeof activo !== 'boolean') {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  }

  const admin = crearClienteAdmin();
  const { error } = await admin.from('couples').update({ acceso_manual: activo }).eq('id', coupleId);
  if (error) return NextResponse.json({ error: 'No pudimos guardar el cambio.' }, { status: 500 });
  const { error: errorPlan } = await admin.rpc('recalcular_plan_pareja', { p_couple_id: coupleId });
  if (errorPlan) return NextResponse.json({ error: 'Se guardó la marca, pero no se pudo recalcular el plan.' }, { status: 500 });

  const { data } = await admin.from('couples').select('plan, acceso_manual').eq('id', coupleId).maybeSingle();
  return NextResponse.json({ ok: true, plan: data?.plan ?? null, accesoManual: data?.acceso_manual ?? activo });
}
