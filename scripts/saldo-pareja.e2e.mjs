// Prueba contra la base real: el saldo "quién le debe a quién" con una pareja de DOS personas (el caso que
// fallaba con "column reference moneda is ambiguous"). Crea usuarios temporales (@example.com) y los borra
// al terminar. Se corre copiándolo a app/ (usa app/node_modules) con la ruta del .env.local ajustada.
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
let fallos = 0;
const ok = (n, c) => {
  console.log(`${c ? 'OK   ' : 'FALLA'} ${n}`);
  if (!c) fallos++;
};
const entrar = async (k) => {
  const c = createClient(SB, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const r = await c.auth.signInWithPassword({ email: `tmp-saldo-${k}@example.com`, password: pw });
  if (r.error) throw r.error;
  return c;
};

try {
  for (const k of ['a', 'b']) {
    const r = await admin.auth.admin.createUser({ email: `tmp-saldo-${k}@example.com`, password: pw, email_confirm: true });
    if (r.error) throw r.error;
    ids[k] = r.data.user.id;
  }
  const a = await entrar('a');
  const b = await entrar('b');
  const pareja = (await a.rpc('crear_pareja')).data;
  const unir = await b.rpc('unirse_con_token', { p_token: pareja.token_invitacion });
  ok('B se une a la pareja de A', !unir.error);

  const cat = (await a.from('categories').select('id').eq('couple_id', pareja.id).limit(1).single()).data.id;
  const gasto = async (cli, uid, monto, split, moneda = null) =>
    cli.from('expenses').insert({ couple_id: pareja.id, category_id: cat, monto, registrado_por: uid, split_percent: split, moneda });

  // El cálculo se ve desde el integrante de menor UUID (A* = member_a): positivo = el otro le debe a A*
  const [menor] = [ids.a, ids.b].sort();
  const cliMenor = menor === ids.a ? a : b;
  const cliMayor = menor === ids.a ? b : a;
  const uidMenor = menor;
  const uidMayor = menor === ids.a ? ids.b : ids.a;

  const s0 = await cliMenor.rpc('calcular_saldo_pareja', { p_couple_id: pareja.id });
  ok('sin gastos: el saldo se calcula sin error y es 0 (antes fallaba)', !s0.error && Number(s0.data.find((f) => f.moneda === null)?.saldo) === 0);

  // el de menor UUID paga 100.000 y su parte es el 50 %: el otro le debe 50.000
  await gasto(cliMenor, uidMenor, 100000, 50);
  const s1 = await cliMenor.rpc('calcular_saldo_pareja', { p_couple_id: pareja.id });
  ok('uno paga 100.000 al 50 %: el otro le debe 50.000', Number(s1.data.find((f) => f.moneda === null).saldo) === 50000);

  // el otro paga 40.000 con su parte al 50 %: le descuenta 20.000 → neto 30.000
  await gasto(cliMayor, uidMayor, 40000, 50);
  const s2 = await cliMayor.rpc('calcular_saldo_pareja', { p_couple_id: pareja.id });
  ok('el otro paga 40.000 al 50 %: el neto queda en 30.000', Number(s2.data.find((f) => f.moneda === null).saldo) === 30000);

  // reparto por persona 60/40: quien paga se queda con el 40 % → el otro debe el 60 %
  await gasto(cliMenor, uidMenor, 10000, 40);
  const s3 = await cliMenor.rpc('calcular_saldo_pareja', { p_couple_id: pareja.id });
  ok('pago de 10.000 donde quien paga solo debe el 40 %: suma 6.000 (30.000 → 36.000)', Number(s3.data.find((f) => f.moneda === null).saldo) === 36000);

  // un viaje en dólares va aparte, sin mezclar con pesos
  await gasto(cliMayor, uidMayor, 200, 50, 'USD');
  const s4 = await cliMenor.rpc('calcular_saldo_pareja', { p_couple_id: pareja.id });
  ok('el viaje en USD tiene su propio saldo (menor le debe 100 al otro) y no toca los pesos', Number(s4.data.find((f) => f.moneda === 'USD').saldo) === -100 && Number(s4.data.find((f) => f.moneda === null).saldo) === 36000);

  // liquidar solo los pesos
  const liq = await cliMenor.rpc('liquidar_saldo', { p_moneda: null });
  ok('liquidar los pesos funciona', !liq.error);
  const s5 = await cliMenor.rpc('calcular_saldo_pareja', { p_couple_id: pareja.id });
  ok('después de liquidar, los pesos quedan en 0 y los dólares siguen pendientes', Number(s5.data.find((f) => f.moneda === null).saldo) === 0 && Number(s5.data.find((f) => f.moneda === 'USD').saldo) === -100);
} catch (e) {
  console.log('ERROR de la prueba:', e.message ?? JSON.stringify(e));
  fallos++;
} finally {
  const todas = await admin.from('couple_members').select('couple_id').in('user_id', Object.values(ids));
  for (const cp of new Set((todas.data ?? []).map((x) => x.couple_id))) await admin.from('couples').delete().eq('id', cp);
  for (const id of Object.values(ids)) await admin.auth.admin.deleteUser(id);
  const u = await admin.auth.admin.listUsers();
  console.log('usuarios que quedan:', u.data.users.map((x) => x.email).join(', '));
  console.log('parejas que quedan:', (await admin.from('couples').select('id')).data.length);
}
console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
