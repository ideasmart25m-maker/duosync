import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminApi } from '@/lib/admin';

// El dueño anota a mano cuánto gastó en cada canal de adquisición (Hotmart no lo sabe —
// 21-BACKOFFICE.md) para poder calcular CAC/LTV por canal más adelante.
export async function POST(request: NextRequest) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const { channel, amount, currency, periodStart, periodEnd } = (await request.json()) as {
    channel?: string;
    amount?: number;
    currency?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!channel || typeof channel !== 'string' || channel.trim().length === 0) {
    return NextResponse.json({ error: 'Falta el canal.' }, { status: 400 });
  }
  if (!amount || typeof amount !== 'number' || amount < 0) {
    return NextResponse.json({ error: 'Monto inválido.' }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: 'Faltan las fechas del período.' }, { status: 400 });
  }

  const { error } = await gate.supabase.from('acquisition_spend').insert({
    channel: channel.trim(),
    amount,
    currency: currency || 'USD',
    period_start: periodStart,
    period_end: periodEnd,
  });
  if (error) return NextResponse.json({ error: 'No pudimos guardar el gasto.' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
