// Prueba contra la base real: unirse con la clave larga del enlace (sin correo). Crea usuarios temporales
// (@example.com) y los borra al terminar. Se corre copiándolo a app/ (usa app/node_modules) con la ruta del
// .env.local ajustada a '.env.local'.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const l of fs.readFileSync('app/.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(SB, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const pw = 'Prueba-' + Math.random().toString(36).slice(2) + '-Xx9';
const nombres = ['a', 'b', 'c', 'd'];
const ids = {};
let fallos = 0;
const ok = (n, c) => {
  console.log(`${c ? 'OK   ' : 'FALLA'} ${n}`);
  if (!c) fallos++;
};
const entrar = async (k) => {
  const c = createClient(SB, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const r = await c.auth.signInWithPassword({ email: `tmp-enlace-${k}@example.com`, password: pw });
  if (r.error) throw r.error;
  return c;
};
const parejasDe = async (uid) => (await admin.from('couple_members').select('couple_id').eq('user_id', uid)).data.map((x) => x.couple_id);

try {
  for (const k of nombres) {
    const r = await admin.auth.admin.createUser({ email: `tmp-enlace-${k}@example.com`, password: pw, email_confirm: true });
    if (r.error) throw r.error;
    ids[k] = r.data.user.id;
  }
  const [a, b, c, d] = await Promise.all(nombres.map(entrar));
  const TOKEN = 'abcdef0123456789abcdef0123456789';

  const pa = (await a.rpc('crear_pareja', { p_codigo: '6644', p_token: TOKEN })).data;
  ok('la pareja de A guarda la clave del enlace que ya se había compartido', pa.token_invitacion === TOKEN && pa.codigo_invitacion === '6644');

  const pb0 = (await b.rpc('crear_pareja')).data; // B ya tenía su pareja vacía
  const rb = await b.rpc('unirse_con_token', { p_token: TOKEN });
  ok('B se une con la clave larga, sin código ni intentos', !rb.error && rb.data.id === pa.id);
  const parejasB = await parejasDe(ids.b);
  ok('B queda en UNA pareja y su pareja vacía anterior se eliminó', parejasB.length === 1 && parejasB[0] === pa.id && (await admin.from('couples').select('id').eq('id', pb0.id)).data.length === 0);

  const rc = await c.rpc('unirse_con_token', { p_token: TOKEN });
  ok('una tercera persona NO puede entrar: PAREJA_COMPLETA (máximo 2)', !!rc.error && rc.error.message.includes('PAREJA_COMPLETA'));
  const rc2 = await c.rpc('unirse_con_codigo', { p_codigo: '6644' });
  ok('tampoco con el código de 4 dígitos: PAREJA_COMPLETA', !!rc2.error && rc2.error.message.includes('PAREJA_COMPLETA'));

  const rmal = await c.rpc('unirse_con_token', { p_token: 'ffffffffffffffffffffffffffffffff' });
  ok('una clave inventada da TOKEN_INVALIDO', !!rmal.error && rmal.error.message.includes('TOKEN_INVALIDO'));

  const rsin = await createClient(SB, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } }).rpc('unirse_con_token', { p_token: TOKEN });
  ok('sin sesión no se puede usar la clave', !!rsin.error);

  // D tiene datos propios: no se le borra nada
  const pd = (await d.rpc('crear_pareja')).data;
  const cat = (await admin.from('categories').select('id').eq('couple_id', pd.id).limit(1).single()).data.id;
  await admin.from('expenses').insert({ couple_id: pd.id, category_id: cat, monto: 5000, registrado_por: ids.d });
  const pa2 = (await a.rpc('crear_pareja')).error; // A ya tiene pareja: crear otra no es el flujo normal, se ignora
  const rd = await d.rpc('unirse_con_token', { p_token: TOKEN });
  ok('D (con datos propios) no se une y conserva todo', !!rd.error && (rd.error.message.includes('YA_TIENES_PAREJA') || rd.error.message.includes('PAREJA_COMPLETA')));
  ok('el gasto de D sigue ahí', (await admin.from('expenses').select('id').eq('couple_id', pd.id)).data.length === 1);
  void pa2;

  // El plan premium de la pareja se aplica a quien se une (el plan se deriva por correo de cualquier integrante)
  await admin.from('subscriptions').upsert({ email: 'tmp-enlace-a@example.com', status: 'active', plan_interval: 'mensual', access_until: new Date(Date.now() + 30 * 864e5).toISOString(), last_event_at: new Date().toISOString() });
  await admin.rpc('recalcular_plan_por_email', { p_email: 'tmp-enlace-a@example.com' });
  ok('la pareja es premium porque A tiene suscripción (B, que se unió, queda cubierto)', (await admin.from('couples').select('plan').eq('id', pa.id).single()).data.plan === 'premium');
} catch (e) {
  console.log('ERROR de la prueba:', e.message ?? JSON.stringify(e));
  fallos++;
} finally {
  await admin.from('subscriptions').delete().eq('email', 'tmp-enlace-a@example.com');
  const todas = await admin.from('couple_members').select('couple_id').in('user_id', Object.values(ids));
  for (const cp of new Set((todas.data ?? []).map((x) => x.couple_id))) await admin.from('couples').delete().eq('id', cp);
  for (const id of Object.values(ids)) await admin.auth.admin.deleteUser(id);
  const u = await admin.auth.admin.listUsers();
  console.log('usuarios que quedan:', u.data.users.map((x) => x.email).join(', '));
  console.log('parejas que quedan:', (await admin.from('couples').select('id')).data.length);
}
console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
