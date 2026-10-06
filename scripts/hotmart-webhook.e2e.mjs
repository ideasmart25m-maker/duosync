// Prueba de punta a punta del webhook contra el servidor LOCAL y la base real (con un correo de prueba
// de Resend que no le llega a nadie). Uso: node scripts/hotmart-webhook.e2e.mjs <hottok-local>
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const HOTTOK = process.argv[2];
const URL_WEBHOOK = 'http://localhost:3000/api/webhooks/hotmart';
const EMAIL = 'delivered@resend.dev';
for (const l of fs.readFileSync('app/.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

let fallos = 0;
const ok = (n, c) => {
  console.log(`${c ? 'OK   ' : 'FALLA'} ${n}`);
  if (!c) fallos++;
};
const ahora = Date.now();
const evento = (event, id, extra = {}) => ({
  id,
  event,
  creation_date: ahora,
  version: '2.0.0',
  data: {
    product: { id: 1, name: 'Fairsy' },
    buyer: { email: EMAIL.toUpperCase(), name: 'Prueba', phone: '3000000000', document: '123' },
    purchase: { transaction: 'HPE2E1', approved_date: ahora, offer: { code: '0kq05mk6' }, price: { value: 20494, currency_value: 'COP' } },
    subscription: { subscriber: { code: 'SUBE2E' } },
    ...extra,
  },
});
const enviar = async (body, hottok = HOTTOK) => {
  const r = await fetch(URL_WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json', ...(hottok ? { 'x-hotmart-hottok': hottok } : {}) }, body: JSON.stringify(body) });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};
const fila = async () => (await admin.from('subscriptions').select('*').eq('email', EMAIL).maybeSingle()).data;

await admin.from('subscriptions').delete().eq('email', EMAIL);

let r = await enviar(evento('PURCHASE_APPROVED', 'e2e-1'), 'incorrecto');
ok('hottok incorrecto → 401', r.status === 401);
r = await enviar(evento('PURCHASE_APPROVED', 'e2e-1'), '');
ok('sin hottok → 401', r.status === 401);
ok('rechazado no crea suscripción', (await fila()) === null);

r = await enviar(evento('PURCHASE_APPROVED', 'e2e-1'));
ok('compra válida → 200 y aplicada', r.status === 200 && r.json.resultado === 'applied');
let f = await fila();
ok('queda en trialing, mensual, correo en minúsculas', f?.status === 'trialing' && f?.plan_interval === 'mensual' && f?.email === EMAIL);
ok('guardó código de suscriptor y fin de prueba', f?.subscriber_code === 'SUBE2E' && !!f?.trial_ends_at);
console.log('   correo de bienvenida registrado:', !!f?.welcome_sent_at);

r = await enviar(evento('PURCHASE_APPROVED', 'e2e-1'));
ok('mismo id de evento → duplicado, sin reprocesar', r.status === 200 && r.json.duplicado === true);

r = await enviar(evento('PURCHASE_APPROVED', 'e2e-2', { purchase: { transaction: 'HPE2E1', approved_date: ahora, offer: { code: 'OFERTA-AJENA' }, price: { value: 1, currency_value: 'COP' } } }));
ok('oferta que no es de Fairsy → rechazada', r.json.resultado === 'illegal');

r = await enviar(evento('CLUB_FIRST_ACCESS', 'e2e-3'));
ok('evento fuera del catálogo → ignorado con 200', r.status === 200 && r.json.resultado === 'ignored');

r = await enviar({ id: 'e2e-4', event: 'SUBSCRIPTION_CANCELLATION', creation_date: ahora, data: { subscription: { subscriber: { code: 'SUBE2E' } } } });
ok('cancelación identificada solo por código de suscriptor', r.json.resultado === 'applied');
f = await fila();
ok('queda cancelled y el acceso se acota al fin de la prueba', f?.status === 'cancelled' && f?.access_until === f?.trial_ends_at);

r = await enviar(evento('PURCHASE_REFUNDED', 'e2e-5'));
f = await fila();
ok('reembolso → refunded', r.json.resultado === 'applied' && f?.status === 'refunded');

r = await fetch(URL_WEBHOOK, { method: 'POST', headers: { 'x-hotmart-hottok': HOTTOK }, body: '{no es json' });
ok('JSON inválido con hottok correcto → 400', r.status === 400);
r = await fetch(URL_WEBHOOK);
ok('GET → 404', r.status === 404);

const { data: log } = await admin.from('webhook_log').select('result, payload').order('id', { ascending: false }).limit(12);
const resultados = new Set(log.map((x) => x.result));
ok('la bitácora registró aplicados, duplicados, ignorados, ilegales y no autorizados', ['applied', 'duplicate', 'ignored', 'illegal', 'unauthorized'].every((x) => resultados.has(x)));
ok('la bitácora NO guarda teléfono ni documento del comprador', !JSON.stringify(log.map((x) => x.payload)).includes('3000000000'));

// Limpieza
await admin.from('subscriptions').delete().eq('email', EMAIL);
await admin.from('processed_events').delete().like('event_id', 'e2e-%');
await admin.from('webhook_log').delete().like('event_id', 'e2e-%');
await admin.from('webhook_log').delete().is('event_id', null).in('result', ['unauthorized', 'error']);
console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
