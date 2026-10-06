import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { crearClienteResend, REMITENTE } from '@/lib/email/resend';
import { decidir, EVENTOS_CONOCIDOS, OFERTAS, type EventoNormalizado, type Intervalo, type Suscripcion } from './fsm';

// Producto Fairsy en Hotmart (el ID que muestra la configuración del webhook).
const PRODUCTO_FAIRSY = '8666599';

export type ResultadoWebhook = 'applied' | 'duplicate' | 'ignored' | 'illegal' | 'unauthorized' | 'error';

// Comparación en tiempo constante: se hashea cada lado para igualar longitudes sin filtrar nada.
export function hottokValido(recibido: string | null | undefined): boolean {
  const esperado = process.env.HOTMART_HOTTOK;
  if (!esperado || !recibido) return false;
  const a = crypto.createHash('sha256').update(recibido).digest();
  const b = crypto.createHash('sha256').update(esperado).digest();
  return crypto.timingSafeEqual(a, b);
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === 'object' ? (v as Json) : {});
const texto = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

// Quita datos personales que no hacen falta para operar antes de guardar el aviso en la bitácora.
export function redactar(payload: unknown): unknown {
  const copia = JSON.parse(JSON.stringify(payload ?? {})) as Json;
  delete copia.hottok;
  const data = obj(copia.data);
  for (const clave of ['buyer', 'subscriber', 'user']) {
    const persona = obj(data[clave]);
    for (const dato of ['phone', 'checkout_phone', 'document', 'document_type', 'address', 'zip_code', 'ip']) delete persona[dato];
  }
  return copia;
}

export function normalizar(body: Json): { evento: EventoNormalizado; email: string | null; subscriberCode: string | null; ofertaCodigo: string | null; productoId: string | null; precio: { minor: number; moneda: string } | null } {
  const data = obj(body.data);
  const compra = obj(data.purchase);
  const suscripcion = obj(data.subscription);
  const oferta = obj(compra.offer);
  const precio = obj(compra.price);

  const email = (texto(obj(data.buyer).email) ?? texto(obj(data.subscriber).email) ?? texto(obj(suscripcion.subscriber).email) ?? texto(obj(data.user).email))?.toLowerCase() ?? null;
  const subscriberCode = texto(obj(suscripcion.subscriber).code) ?? texto(obj(data.subscriber).code);
  const ofertaCodigo = texto(oferta.code);

  const aprobada = typeof compra.approved_date === 'number' ? compra.approved_date : null;
  const creada = typeof body.creation_date === 'number' ? body.creation_date : null;
  const ocurridoEn = new Date(aprobada ?? creada ?? Date.now());

  const valor = typeof precio.value === 'number' ? precio.value : null;
  const moneda = texto(precio.currency_value) ?? texto(precio.currency_code);
  const planes = Array.isArray(data.plans) ? (data.plans as Json[]) : [];
  const planNuevo = planes.find((p) => p.current === true) ?? null;
  const ofertaNueva = texto(obj(obj(planNuevo).offer).key) ?? texto(obj(planNuevo).offer_key);
  const intervalo: Intervalo | null = OFERTAS[ofertaCodigo ?? ''] ?? OFERTAS[ofertaNueva ?? ''] ?? null;

  return {
    evento: {
      tipo: String(body.event ?? ''),
      transaccion: texto(compra.transaction),
      intervalo,
      ocurridoEn,
      precioPositivo: valor !== null && valor > 0,
    },
    email,
    subscriberCode,
    ofertaCodigo,
    productoId: texto(obj(data.product).id) ?? (typeof obj(data.product).id === 'number' ? String(obj(data.product).id) : null),
    precio: valor !== null && moneda && /^[A-Z]{3}$/.test(moneda) ? { minor: Math.round(valor * 100), moneda } : null,
  };
}

interface Fila {
  email: string;
  subscriber_code: string | null;
  status: Suscripcion['status'];
  plan_interval: Intervalo | null;
  offer_code: string | null;
  last_transaction: string | null;
  trial_ends_at: string | null;
  first_paid_at: string | null;
  access_until: string;
  welcome_sent_at: string | null;
}

function aSuscripcion(f: Fila): Suscripcion {
  return {
    status: f.status,
    planInterval: f.plan_interval,
    trialEndsAt: f.trial_ends_at ? new Date(f.trial_ends_at) : null,
    firstPaidAt: f.first_paid_at ? new Date(f.first_paid_at) : null,
    accessUntil: new Date(f.access_until),
    lastTransaction: f.last_transaction,
  };
}

async function enviarBienvenida(email: string): Promise<void> {
  const resend = crearClienteResend();
  const { error } = await resend.emails.send({
    from: REMITENTE,
    to: email,
    subject: 'Tu acceso a Fairsy ya está listo',
    html: `<p>¡Gracias por empezar con Fairsy!</p>
<p>Para entrar: abre <a href="https://www.fairsy.lat/login">www.fairsy.lat/login</a> y escribe <strong>este mismo correo</strong> (${email}). Te llegará un enlace o un código de 6 dígitos para ingresar.</p>
<p>Tu prueba gratis de 7 días ya está activa. Si algo no funciona, responde a este correo o escribe a soporte@fairsy.lat.</p>`,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

export async function procesarEvento(admin: SupabaseClient, body: Json): Promise<{ resultado: ResultadoWebhook; detalle: string }> {
  const tipo = String(body.event ?? '');
  if (!EVENTOS_CONOCIDOS.has(tipo)) return { resultado: 'ignored', detalle: `evento fuera del catálogo: ${tipo || '(vacío)'}` };

  const n = normalizar(body);

  // Catálogo: solo se acepta lo que pertenece a las ofertas de Fairsy (si el aviso trae oferta).
  if (n.productoId && n.productoId !== PRODUCTO_FAIRSY) return { resultado: 'illegal', detalle: `producto desconocido: ${n.productoId}` };
  if (n.ofertaCodigo && !OFERTAS[n.ofertaCodigo]) return { resultado: 'illegal', detalle: `oferta desconocida: ${n.ofertaCodigo}` };

  // Quién es: por correo; si el aviso no lo trae (p. ej. cancelaciones), por código de suscriptor.
  let fila: Fila | null = null;
  if (n.email) {
    const { data, error } = await admin.from('subscriptions').select('*').eq('email', n.email).maybeSingle();
    if (error) throw error;
    fila = data as Fila | null;
  } else if (n.subscriberCode) {
    const { data, error } = await admin.from('subscriptions').select('*').eq('subscriber_code', n.subscriberCode).maybeSingle();
    if (error) throw error;
    fila = data as Fila | null;
  }
  const email = n.email ?? fila?.email ?? null;
  if (!email) return { resultado: 'illegal', detalle: 'el aviso no trae correo ni código de suscriptor identificable' };

  const decision = decidir(fila ? aSuscripcion(fila) : null, n.evento);
  if (decision.accion === 'ignorar') return { resultado: 'ignored', detalle: decision.motivo };

  const s = decision.siguiente;
  const { error: errorUpsert } = await admin.from('subscriptions').upsert(
    {
      email,
      subscriber_code: n.subscriberCode ?? fila?.subscriber_code ?? null,
      status: s.status,
      plan_interval: s.planInterval,
      offer_code: n.ofertaCodigo ?? fila?.offer_code ?? null,
      last_transaction: s.lastTransaction,
      trial_ends_at: s.trialEndsAt?.toISOString() ?? null,
      first_paid_at: s.firstPaidAt?.toISOString() ?? null,
      access_until: s.accessUntil.toISOString(),
      last_event_at: n.evento.ocurridoEn.toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );
  if (errorUpsert) throw errorUpsert;

  // Ledger económico: un ingreso (o reversa) se cuenta una sola vez por transacción.
  const clave = decision.registrarVenta ? 'sale' : decision.registrarReversa;
  if (clave && n.evento.transaccion && n.precio) {
    const { error } = await admin.from('payment_transactions').upsert(
      {
        provider: 'hotmart',
        transaction_id: n.evento.transaccion,
        economic_kind: clave,
        product_id: n.productoId,
        offer_id: n.ofertaCodigo,
        amount_minor: n.precio.minor,
        currency: n.precio.moneda,
        occurred_at: n.evento.ocurridoEn.toISOString(),
        raw_event_id: String(body.id ?? ''),
      },
      { onConflict: 'provider,transaction_id,economic_kind', ignoreDuplicates: true }
    );
    if (error) throw error;
  }

  // El plan de la pareja se deriva de las suscripciones (si aún no tiene cuenta, se aplica al crearla).
  const { error: errorPlan } = await admin.rpc('recalcular_plan_por_email', { p_email: email });
  if (errorPlan) throw errorPlan;

  let detalle = `${tipo} → ${s.status}${s.planInterval ? ` (${s.planInterval})` : ''}, acceso hasta ${s.accessUntil.toISOString().slice(0, 10)}`;
  if (decision.inicioDePrueba && !fila?.welcome_sent_at) {
    try {
      await enviarBienvenida(email);
      await admin.from('subscriptions').update({ welcome_sent_at: new Date().toISOString() }).eq('email', email);
    } catch (e) {
      // El acceso ya quedó aplicado: un fallo del correo no debe hacer que Hotmart reintente el evento.
      detalle += ` — correo de bienvenida NO enviado: ${e instanceof Error ? e.message : 'error'}`;
    }
  }
  return { resultado: 'applied', detalle };
}
