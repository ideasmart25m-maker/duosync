import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { crearClienteAdmin } from '@/lib/supabase/admin';
import { hottokValido, procesarEvento, redactar, type ResultadoWebhook } from '@/lib/hotmart/procesar';

// Webhook de Hotmart. Pipeline: cuerpo crudo → autenticidad (hottok, tiempo constante) → parseo →
// frescura → dedupe por id de evento → catálogo/estado → bitácora. Un fallo propio responde 500 para
// que Hotmart reintente; lo que no es nuestro (oferta ajena, evento desconocido) responde 200.
export const runtime = 'nodejs';

const MAX_BYTES = 200_000;
const VENTANA_MS = 72 * 60 * 60 * 1000; // Hotmart reintenta durante días: una ventana de minutos rechazaría reintentos legítimos.

type Admin = ReturnType<typeof crearClienteAdmin>;

async function bitacora(admin: Admin, fila: { event_id?: string | null; type?: string | null; result: ResultadoWebhook; detail?: string; payload?: unknown }) {
  const { error } = await admin.from('webhook_log').insert({
    event_id: fila.event_id ?? null,
    type: fila.type ?? null,
    result: fila.result,
    detail: fila.detail?.slice(0, 500) ?? null,
    payload: fila.payload ?? null,
  });
  if (error) console.error('[webhook/hotmart] no se pudo escribir la bitácora:', error.message);
}

export async function POST(request: NextRequest) {
  if (!process.env.HOTMART_HOTTOK || !process.env.SUPABASE_SECRET_KEY) {
    // Fail-secure: sin el secreto no se procesa NADA (nunca un valor por defecto).
    console.error('[webhook/hotmart] falta HOTMART_HOTTOK o SUPABASE_SECRET_KEY');
    return NextResponse.json({ error: 'No configurado' }, { status: 503 });
  }

  const admin = crearClienteAdmin();
  const crudo = await request.text();
  if (crudo.length > MAX_BYTES) return NextResponse.json({ error: 'Cuerpo demasiado grande' }, { status: 413 });

  let body: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(crudo);
    body = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    body = null;
  }

  const hottok = request.headers.get('x-hotmart-hottok') ?? (typeof body?.hottok === 'string' ? body.hottok : null);
  if (!hottokValido(hottok)) {
    await bitacora(admin, { result: 'unauthorized', detail: 'hottok ausente o incorrecto' });
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  if (!body) {
    await bitacora(admin, { result: 'error', detail: 'cuerpo no es JSON válido' });
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const tipo = String(body.event ?? '');
  const hash = crypto.createHash('sha256').update(crudo).digest('hex');
  const eventId = typeof body.id === 'string' && body.id ? body.id : hash.slice(0, 32);
  const payload = redactar(body);

  const creado = typeof body.creation_date === 'number' ? body.creation_date : null;
  if (creado !== null && Date.now() - creado > VENTANA_MS) {
    await bitacora(admin, { event_id: eventId, type: tipo, result: 'illegal', detail: 'evento demasiado viejo (replay)', payload });
    return NextResponse.json({ ok: true, ignorado: 'viejo' });
  }

  try {
    // Dedupe: se reserva el id; si ya estaba COMPLETADO es un reintento de Hotmart.
    const { error: errorReserva } = await admin.from('processed_events').insert({ event_id: eventId, event_type: tipo, payload_hash: hash, status: 'processing' });
    if (errorReserva) {
      const { data: previo } = await admin.from('processed_events').select('status').eq('event_id', eventId).maybeSingle();
      if (previo?.status === 'completed') {
        await bitacora(admin, { event_id: eventId, type: tipo, result: 'duplicate', detail: 'reintento de un evento ya procesado' });
        return NextResponse.json({ ok: true, duplicado: true });
      }
      // Quedó a medias en un intento anterior: se reprocesa (todas las operaciones son idempotentes).
    }

    const { resultado, detalle } = await procesarEvento(admin, body);
    await admin.from('processed_events').update({ status: 'completed', processed_at: new Date().toISOString() }).eq('event_id', eventId);
    await bitacora(admin, { event_id: eventId, type: tipo, result: resultado, detail: detalle, payload });
    return NextResponse.json({ ok: true, resultado });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : JSON.stringify(e);
    console.error('[webhook/hotmart] error procesando', eventId, mensaje);
    await bitacora(admin, { event_id: eventId, type: tipo, result: 'error', detail: mensaje, payload });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 }); // Hotmart reintenta
  }
}

// Cualquier otro método no existe para este endpoint.
export function GET() {
  return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
}
