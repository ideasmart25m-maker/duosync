// Prueba contra la base real de "conectar mi compra": códigos, intentos, vencimiento, límites y el recálculo del
// plan de la pareja. Crea usuarios y suscripciones temporales (@example.com) y los borra al terminar.
// Se corre copiándolo a app/ con la ruta del .env.local ajustada a '.env.local'.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const l of fs.readFileSync('app/.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(SB, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const pw = 'Prueba-' + Math.random().toString(36).slice(2) + '-Xx9';
const ids = {};
const correosCompra = ['tmp-compra-x@example.com', 'tmp-compra-vencida@example.com', 'tmp-compra-nuevo@example.com'];
let fallos = 0;
const ok = (n, c, extra = '') => {
  console.log(`${c ? 'OK   ' : 'FALLA'} ${n}${!c && extra ? ' → ' + extra : ''}`);
  if (!c) fallos++;
};
const en = (dias) => new Date(Date.now() + dias * 86400000).toISOString();
const crear = async (k) => {
  const r = await admin.auth.admin.createUser({ email: `tmp-vinculo-${k}@example.com`, password: pw, email_confirm: true });
  if (r.error) throw r.error;
  ids[k] = r.data.user.id;
  const c = createClient(SB, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email: `tmp-vinculo-${k}@example.com`, password: pw });
  return c;
};
const plan = async (coupleId) => (await admin.from('couples').select('plan, trial_termina_en').eq('id', coupleId).single()).data;
const enviar = (u, e, h) => admin.rpc('crear_codigo_vinculo_compra', { p_user: u, p_email: e, p_code_hash: h });
const confirmar = (u, e, h) => admin.rpc('confirmar_vinculo_compra', { p_user: u, p_email: e, p_code_hash: h });

try {
  const a = await crear('a');
  const b = await crear('b');
  const c = await crear('c');
  const d = await crear('d');
  const parejaA = (await a.rpc('crear_pareja')).data;
  const parejaC = (await c.rpc('crear_pareja')).data;
  const parejaD = (await d.rpc('crear_pareja')).data;

  // Suscripciones de compra con correos distintos a los de las cuentas
  const base = { provider: 'hotmart', last_event_at: new Date().toISOString() };
  await admin.from('subscriptions').insert([
    { ...base, email: correosCompra[0], status: 'trialing', plan_interval: 'anual', trial_ends_at: en(7), access_until: en(7) },
    { ...base, email: correosCompra[1], status: 'expired', plan_interval: 'mensual', access_until: en(-3) },
    { ...base, email: correosCompra[2], status: 'trialing', plan_interval: 'mensual', trial_ends_at: en(7), access_until: en(7) },
  ]);

  ok('antes de conectar, la pareja de A está en plan gratis', (await plan(parejaA.id)).plan === 'gratis');

  // --- código incorrecto / correcto
  ok('se crea el código', (await enviar(ids.a, correosCompra[0], 'hash-bueno')).data === 'ok');
  ok('un código incorrecto se rechaza', (await confirmar(ids.a, correosCompra[0], 'hash-malo')).data === 'codigo_incorrecto');
  ok('tras un intento fallido sigue en gratis', (await plan(parejaA.id)).plan === 'gratis');
  ok('el código correcto conecta la compra', (await confirmar(ids.a, correosCompra[0], 'hash-bueno')).data === 'ok');
  const p1 = await plan(parejaA.id);
  ok('la pareja de A pasa a premium con la fecha de fin de prueba', p1.plan === 'premium' && !!p1.trial_termina_en);
  ok('el mismo código no sirve dos veces', (await confirmar(ids.a, correosCompra[0], 'hash-bueno')).data === 'vencido');

  // --- ajena no puede usar el código de otro
  await enviar(ids.a, correosCompra[2], 'hash-de-a');
  ok('otra cuenta NO puede confirmar con el código de A', (await confirmar(ids.c, correosCompra[2], 'hash-de-a')).data === 'vencido');
  ok('la pareja ajena sigue en gratis', (await plan(parejaC.id)).plan === 'gratis');

  // --- la pareja completa recibe el plan al unirse
  const unir = await b.rpc('unirse_con_token', { p_token: parejaA.token_invitacion });
  ok('B se une a la pareja de A', !unir.error);
  ok('al unirse B, la pareja sigue premium', (await plan(parejaA.id)).plan === 'premium');

  // --- intentos: 5 fallos bloquean aunque luego llegue el código correcto
  await enviar(ids.c, correosCompra[0], 'hash-c');
  let ultimo = '';
  for (let i = 0; i < 5; i++) ultimo = (await confirmar(ids.c, correosCompra[0], 'x' + i)).data;
  ok('al 5.º intento fallido se bloquea el código', ultimo === 'demasiados_intentos', ultimo);
  ok('con el código correcto después de bloquearse, igual rechaza', (await confirmar(ids.c, correosCompra[0], 'hash-c')).data === 'demasiados_intentos');

  // --- límite de envíos: 3 por hora por persona
  const r1 = (await enviar(ids.d, correosCompra[2], 'h1')).data;
  const r2 = (await enviar(ids.d, correosCompra[2], 'h2')).data;
  const r3 = (await enviar(ids.d, correosCompra[2], 'h3')).data;
  const r4 = (await enviar(ids.d, correosCompra[2], 'h4')).data;
  ok('3 envíos por hora pasan y el 4.º se limita', r1 === 'ok' && r2 === 'ok' && r3 === 'ok' && r4 === 'demasiados_envios', [r1, r2, r3, r4].join(','));
  ok('un envío nuevo invalida los códigos anteriores', (await confirmar(ids.d, correosCompra[2], 'h1')).data === 'codigo_incorrecto');

  // --- un correo de compra se conecta a lo sumo a 2 personas
  const e = await crear('e');
  await enviar(ids.b, correosCompra[0], 'hash-b');
  ok('B (pareja de A) conecta el mismo correo: es la 2.ª persona', (await confirmar(ids.b, correosCompra[0], 'hash-b')).data === 'ok');
  await enviar(ids.e, correosCompra[0], 'hash-e');
  ok('una 3.ª persona no puede conectar ese correo', (await confirmar(ids.e, correosCompra[0], 'hash-e')).data === 'ya_conectada');

  // --- compra vencida no da acceso aunque se conecte
  await enviar(ids.d, correosCompra[1], 'hash-venc');
  // (límite de envíos de D ya agotado: usar a E)
  await enviar(ids.e, correosCompra[1], 'hash-venc-e');
  await confirmar(ids.e, correosCompra[1], 'hash-venc-e');
  const parejaE = (await e.rpc('crear_pareja')).data;
  ok('una compra vencida conectada NO da premium', (await plan(parejaE.id)).plan === 'gratis');

  // --- cambiar el correo de la cuenta recalcula el plan al instante
  ok('D empieza en gratis', (await plan(parejaD.id)).plan === 'gratis');
  const cambio = await admin.auth.admin.updateUserById(ids.d, { email: correosCompra[2], email_confirm: true });
  ok('se cambia el correo de la cuenta de D al de la compra', !cambio.error, cambio.error?.message);
  ok('el plan de D se recalcula solo (premium)', (await plan(parejaD.id)).plan === 'premium');
} catch (err) {
  console.log('ERROR de la prueba:', err.message ?? JSON.stringify(err));
  fallos++;
} finally {
  const todas = await admin.from('couple_members').select('couple_id').in('user_id', Object.values(ids));
  for (const cp of new Set((todas.data ?? []).map((x) => x.couple_id))) await admin.from('couples').delete().eq('id', cp);
  await admin.from('subscriptions').delete().in('email', correosCompra);
  for (const id of Object.values(ids)) await admin.auth.admin.deleteUser(id);
  const u = await admin.auth.admin.listUsers();
  console.log('usuarios que quedan:', u.data.users.map((x) => x.email).join(', '));
  console.log('parejas que quedan:', (await admin.from('couples').select('id')).data.length);
  console.log('suscripciones temporales que quedan:', (await admin.from('subscriptions').select('email').like('email', 'tmp-%')).data.length);
  console.log('códigos/vínculos que quedan:', (await admin.from('purchase_link_codes').select('id')).data.length, (await admin.from('linked_purchase_emails').select('email')).data.length);
}
console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
