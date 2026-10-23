// Prueba contra la base real: abonos parciales al saldo. Crea usuarios temporales (@example.com) y los borra al terminar.
// Se corre copiándolo a app/ (usa app/node_modules) con la ruta del .env.local ajustada.
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
  const r = await c.auth.signInWithPassword({ email: `tmp-abono-${k}@example.com`, password: pw });
  if (r.error) throw r.error;
  return c;
};
const saldoDe = async (cli, cid, moneda = null) => {
  const r = await cli.rpc('calcular_saldo_pareja', { p_couple_id: cid });
  if (r.error) throw r.error;
  return Number(r.data.find((f) => f.moneda === moneda)?.saldo ?? 0);
};

try {
  for (const k of ['a', 'b']) {
    const r = await admin.auth.admin.createUser({ email: `tmp-abono-${k}@example.com`, password: pw, email_confirm: true });
    if (r.error) throw r.error;
    ids[k] = r.data.user.id;
  }
  const a = await entrar('a');
  const b = await entrar('b');
  // La pareja la crea el integrante de UUID MAYOR: era el caso en que el saldo salía invertido (ver migración 20261023140000).
  const [, _M] = [ids.a, ids.b].sort();
  const creador = _M === ids.a ? a : b;
  const otro = _M === ids.a ? b : a;
  const pareja = (await creador.rpc('crear_pareja')).data;
  const un = await otro.rpc('unirse_con_token', { p_token: pareja.token_invitacion });
  ok('B se une a la pareja de A', !un.error);
  const cat = (await a.from('categories').select('id').eq('couple_id', pareja.id).limit(1).single()).data.id;

  const [menor, mayor] = [ids.a, ids.b].sort();
  const cliMenor = menor === ids.a ? a : b;
  const cliMayor = menor === ids.a ? b : a;

  // el menor paga 100.000 al 50 %: el mayor le debe 50.000
  await admin.from('expenses').insert({ couple_id: pareja.id, category_id: cat, monto: 100000, registrado_por: menor, split_percent: 50 });
  ok('saldo inicial: el mayor debe 50.000', (await saldoDe(cliMenor, pareja.id)) === 50000);

  const abono1 = await cliMayor.rpc('registrar_abono', { p_monto: 20000, p_moneda: null });
  ok('abono de 20.000 se registra', !abono1.error);
  ok('el que paga el abono es el que debe (el mayor)', abono1.data?.pagado_por === mayor);
  ok('el saldo baja a 30.000 (visto por cualquiera de los dos)', (await saldoDe(cliMenor, pareja.id)) === 30000 && (await saldoDe(cliMayor, pareja.id)) === 30000);

  // también puede anotarlo quien recibe
  const abono2 = await cliMenor.rpc('registrar_abono', { p_monto: 10000, p_moneda: null });
  ok('quien recibe también puede anotar un abono (10.000)', !abono2.error && abono2.data?.pagado_por === mayor);
  ok('el saldo queda en 20.000', (await saldoDe(cliMayor, pareja.id)) === 20000);

  const demas = await cliMayor.rpc('registrar_abono', { p_monto: 20001, p_moneda: null });
  ok('no deja abonar más de lo que se debe', !!demas.error && demas.error.message.includes('MAYOR_AL_SALDO'));
  const neg = await cliMayor.rpc('registrar_abono', { p_monto: -5, p_moneda: null });
  ok('no deja abonar un monto negativo', !!neg.error);

  // decimales
  const dec = await cliMayor.rpc('registrar_abono', { p_monto: 0.5, p_moneda: null });
  ok('acepta decimales (0,50)', !dec.error && (await saldoDe(cliMayor, pareja.id)) === 19999.5);

  // saldo contrario: si el mayor paga más, el menor pasa a deber y el abono lo hace el menor
  await admin.from('expenses').insert({ couple_id: pareja.id, category_id: cat, monto: 100000, registrado_por: mayor, split_percent: 50 });
  // saldo = 19999.5 - 50000 = -30000.5 (el menor le debe al mayor)
  const s2 = await saldoDe(cliMenor, pareja.id);
  ok('después de otro gasto del mayor el saldo cambia de signo', s2 === -30000.5);
  const abono3 = await cliMenor.rpc('registrar_abono', { p_monto: 30000, p_moneda: null });
  ok('con saldo negativo el que paga el abono es el menor', !abono3.error && abono3.data?.pagado_por === menor);
  ok('el saldo queda en -0,50', (await saldoDe(cliMenor, pareja.id)) === -0.5);

  // un viaje en USD no se mezcla con los pesos
  await admin.from('expenses').insert({ couple_id: pareja.id, category_id: cat, monto: 200, registrado_por: mayor, split_percent: 50, moneda: 'USD' });
  const abUsd = await cliMenor.rpc('registrar_abono', { p_monto: 40, p_moneda: 'USD' });
  ok('abono en USD no toca los pesos', !abUsd.error && (await saldoDe(cliMenor, pareja.id, 'USD')) === -60 && (await saldoDe(cliMenor, pareja.id)) === -0.5);

  // liquidar cierra todo: abonos anteriores no cuentan después
  const liq = await cliMenor.rpc('liquidar_saldo', { p_moneda: null });
  ok('liquidar los pesos funciona', !liq.error);
  ok('después de liquidar, los pesos quedan en 0 (los abonos anteriores no cuentan)', (await saldoDe(cliMenor, pareja.id)) === 0);
  const sinSaldo = await cliMenor.rpc('registrar_abono', { p_monto: 1, p_moneda: null });
  ok('con saldo 0 no se puede abonar', !!sinSaldo.error && sinSaldo.error.message.includes('SIN_SALDO'));
  ok('los dólares siguen pendientes tras liquidar pesos', (await saldoDe(cliMenor, pareja.id, 'USD')) === -60);

  // un tercero no ve ni toca los abonos de esta pareja
  const t = await admin.auth.admin.createUser({ email: 'tmp-abono-c@example.com', password: pw, email_confirm: true });
  ids.c = t.data.user.id;
  const c = await entrar('c');
  const ajeno = await c.from('abonos').select('id').eq('couple_id', pareja.id);
  ok('un usuario ajeno no ve los abonos de otra pareja (RLS)', (ajeno.data ?? []).length === 0);
  const insDirecto = await a.from('abonos').insert({ couple_id: pareja.id, monto: 1, pagado_por: ids.a, registrado_por: ids.a });
  ok('no se puede insertar un abono directo (solo por la función)', !!insDirecto.error);
} catch (e) {
  console.log('ERROR de la prueba:', e.message ?? JSON.stringify(e));
  fallos++;
} finally {
  const todas = await admin.from('couple_members').select('couple_id').in('user_id', Object.values(ids));
  for (const cp of new Set((todas.data ?? []).map((x) => x.couple_id))) await admin.from('couples').delete().eq('id', cp);
  for (const id of Object.values(ids)) await admin.auth.admin.deleteUser(id);
  const u = await admin.auth.admin.listUsers();
  console.log('usuarios tmp-abono que quedan:', u.data.users.filter((x) => x.email?.startsWith('tmp-abono')).length);
}
console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
