// Recorrido de punta a punta con DOS cuentas de la misma pareja (+ una tercera ajena) contra la base real:
// categorías/pagos fijos, gastos, viajes, metas y aportes, pregunta del día (revelado), presupuesto y aislamiento.
// Crea usuarios temporales (@example.com) y los borra al terminar. Se corre copiándolo a app/ con la ruta del
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
const ids = {};
let fallos = 0;
const ok = (n, c, extra = '') => {
  console.log(`${c ? 'OK   ' : 'FALLA'} ${n}${!c && extra ? ' → ' + extra : ''}`);
  if (!c) fallos++;
};
const entrar = async (k) => {
  const c = createClient(SB, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const r = await c.auth.signInWithPassword({ email: `tmp-dos-${k}@example.com`, password: pw });
  if (r.error) throw r.error;
  return c;
};
const msg = (e) => (e ? e.message ?? JSON.stringify(e) : '');

try {
  for (const k of ['a', 'b', 'c']) {
    const r = await admin.auth.admin.createUser({ email: `tmp-dos-${k}@example.com`, password: pw, email_confirm: true });
    if (r.error) throw r.error;
    ids[k] = r.data.user.id;
  }
  const a = await entrar('a');
  const b = await entrar('b');
  const c = await entrar('c');

  const pareja = (await a.rpc('crear_pareja')).data;
  ok('A crea la pareja', !!pareja?.id);
  const unir = await b.rpc('unirse_con_token', { p_token: pareja.token_invitacion });
  ok('B se une con el enlace', !unir.error, msg(unir.error));
  await c.rpc('crear_pareja'); // la ajena tiene SU pareja

  const miembros = await a.from('couple_members').select('user_id').eq('couple_id', pareja.id);
  ok('la pareja tiene exactamente 2 integrantes', miembros.data?.length === 2);

  // ---- Categorías y pagos fijos
  const catA = await a.from('categories').select('id, nombre').eq('couple_id', pareja.id);
  ok('hay categorías base visibles para A y para B', (catA.data?.length ?? 0) > 0 && ((await b.from('categories').select('id').eq('couple_id', pareja.id)).data?.length ?? 0) === catA.data.length);
  const nueva = await b.from('categories').insert({ couple_id: pareja.id, nombre: 'Arriendo', icono: 'home', color: 'teal', es_recurrente: true, dias_vencimiento: [5], montos_mensuales: [1200000], paga_user_id: ids.b, reparto_user_id: ids.a }).select().single();
  ok('B crea un pago fijo (paga B, reparto A)', !nueva.error, msg(nueva.error));
  const veA = await a.from('categories').select('id, paga_user_id').eq('id', nueva.data?.id).maybeSingle();
  ok('A ve el pago fijo que creó B', veA.data?.id === nueva.data?.id);
  const ajena = await a.from('categories').update({ paga_user_id: ids.c }).eq('id', nueva.data?.id);
  ok('no se puede asignar el pago a alguien que no es de la pareja', !!ajena.error);
  const editA = await a.from('categories').update({ nombre: 'Arriendo casa' }).eq('id', nueva.data?.id).select().single();
  ok('A puede editar el pago fijo que creó B', !editA.error && editA.data?.nombre === 'Arriendo casa', msg(editA.error));

  // ---- Gastos
  const catId = nueva.data.id;
  const g1 = await a.from('expenses').insert({ couple_id: pareja.id, category_id: catId, monto: 80000, registrado_por: ids.a, split_percent: 50, nota: 'mercado' }).select().single();
  ok('A registra un gasto', !g1.error, msg(g1.error));
  const g2 = await b.from('expenses').insert({ couple_id: pareja.id, category_id: catId, monto: 30000, registrado_por: ids.b, split_percent: 50 }).select().single();
  ok('B registra un gasto', !g2.error, msg(g2.error));
  const suplanta = await b.from('expenses').insert({ couple_id: pareja.id, category_id: catId, monto: 1000, registrado_por: ids.a, split_percent: 50 });
  ok('B no puede registrar un gasto a nombre de A', !!suplanta.error);
  const lista = await b.from('expenses').select('id').eq('couple_id', pareja.id);
  ok('B ve los 2 gastos de la pareja', lista.data?.length === 2);
  const borra = await b.from('expenses').delete().eq('id', g1.data?.id).select();
  ok('B puede borrar un gasto registrado por A (es de los dos)', !borra.error && borra.data?.length === 1, msg(borra.error));

  // ---- Saldo y liquidación
  const sa = await a.rpc('calcular_saldo_pareja', { p_couple_id: pareja.id });
  const sb = await b.rpc('calcular_saldo_pareja', { p_couple_id: pareja.id });
  const va = Number(sa.data?.find((f) => f.moneda === null)?.saldo ?? NaN);
  const vb = Number(sb.data?.find((f) => f.moneda === null)?.saldo ?? NaN);
  ok('el saldo se calcula para los dos sin error', !sa.error && !sb.error, msg(sa.error ?? sb.error));
  ok('los dos ven la misma magnitud de deuda', Math.abs(va) === Math.abs(vb) && Math.abs(va) === 15000, `A=${va} B=${vb}`);
  const ajenaSaldo = await c.rpc('calcular_saldo_pareja', { p_couple_id: pareja.id });
  ok('la cuenta ajena NO puede ver el saldo de esta pareja', !!ajenaSaldo.error || (ajenaSaldo.data ?? []).length === 0);

  // ---- Viajes
  const viaje = await a.from('viajes').insert({ couple_id: pareja.id, nombre: 'Cartagena', moneda: 'USD', presupuesto: 500 }).select().single();
  ok('A crea un viaje en USD', !viaje.error, msg(viaje.error));
  const gv = await b.from('expenses').insert({ couple_id: pareja.id, category_id: catId, monto: 120, registrado_por: ids.b, split_percent: 50, moneda: 'USD', viaje_id: viaje.data?.id });
  ok('B agrega un gasto al viaje de A', !gv.error, msg(gv.error));
  const ve = await b.from('viajes').select('id').eq('id', viaje.data?.id).maybeSingle();
  ok('B ve el viaje de A', ve.data?.id === viaje.data?.id);

  // ---- Metas y aportes
  const meta = await a.from('savings_goals').insert({ couple_id: pareja.id, nombre: 'Casa', monto_objetivo: 1000000 }).select().single();
  ok('A crea una meta', !meta.error, msg(meta.error));
  const ap1 = await a.rpc('aportar_a_meta', { p_meta_id: meta.data?.id, p_monto: 100000 });
  const ap2 = await b.rpc('aportar_a_meta', { p_meta_id: meta.data?.id, p_monto: 50000 });
  ok('los dos aportan a la misma meta', !ap1.error && !ap2.error, msg(ap1.error ?? ap2.error));
  const metaFinal = await a.from('savings_goals').select('monto_actual').eq('id', meta.data?.id).single();
  ok('el total de la meta suma los dos aportes (150.000)', Number(metaFinal.data?.monto_actual) === 150000, String(metaFinal.data?.monto_actual));
  const aportesB = await b.from('goal_contributions').select('monto, created_by').eq('meta_id', meta.data?.id);
  ok('B ve los 2 aportes con su autor', aportesB.data?.length === 2 && new Set(aportesB.data.map((x) => x.created_by)).size === 2);
  const ajenoAporte = await c.rpc('aportar_a_meta', { p_meta_id: meta.data?.id, p_monto: 1000 });
  ok('la cuenta ajena NO puede aportar a la meta de otra pareja', !!ajenoAporte.error);
  const editMetaB = await b.from('savings_goals').update({ nombre: 'Casa propia' }).eq('id', meta.data?.id).select().single();
  ok('B puede renombrar la meta', !editMetaB.error && editMetaB.data?.nombre === 'Casa propia', msg(editMetaB.error));

  // ---- Pregunta del día
  const q = (await a.rpc('pregunta_de_hoy')).data;
  const qB = (await b.rpc('pregunta_de_hoy')).data;
  ok('los dos reciben la MISMA pregunta de hoy', q?.id && q.id === qB?.id);
  const r1 = await a.rpc('responder_pregunta_hoy', { p_question_id: q.id, p_respuesta: 'respuesta de A' });
  ok('A responde', !r1.error, msg(r1.error));
  ok('con solo A respondido, no hay "ambos respondieron"', r1.data?.[0]?.ambos_respondieron === false);
  const verB1 = await b.rpc('respuestas_de_hoy', { p_question_id: q.id });
  ok('B NO ve la respuesta de A antes de responder', !(verB1.data ?? []).some((x) => x.respuesta === 'respuesta de A'), JSON.stringify(verB1.data));
  const r2 = await b.rpc('responder_pregunta_hoy', { p_question_id: q.id, p_respuesta: 'respuesta de B' });
  ok('B responde y se marca "ambos respondieron"', !r2.error && r2.data?.[0]?.ambos_respondieron === true, msg(r2.error));
  ok('la racha pasa a 1', Number(r2.data?.[0]?.racha_dias) === 1, String(r2.data?.[0]?.racha_dias));
  const verA = await a.rpc('respuestas_de_hoy', { p_question_id: q.id });
  ok('A ya ve la respuesta de B', (verA.data ?? []).some((x) => x.respuesta === 'respuesta de B'));
  const r3 = await a.rpc('responder_pregunta_hoy', { p_question_id: q.id, p_respuesta: 'A corrige' });
  ok('corregir la respuesta no suma otra racha', !r3.error && Number(r3.data?.[0]?.racha_dias) === 1, msg(r3.error) + ' ' + r3.data?.[0]?.racha_dias);

  // ---- Presupuesto
  const pres = await b.rpc('actualizar_presupuesto_pareja', { p_monto: 2500000 });
  ok('B fija el presupuesto mensual', !pres.error, msg(pres.error));
  const presA = await a.from('couples').select('presupuesto_mensual').eq('id', pareja.id).single();
  ok('A ve el presupuesto que fijó B', Number(presA.data?.presupuesto_mensual) === 2500000);

  // ---- Aislamiento
  const espia = await c.from('expenses').select('id').eq('couple_id', pareja.id);
  ok('la cuenta ajena NO ve gastos de la pareja', (espia.data ?? []).length === 0);
  const espiaMeta = await c.from('savings_goals').select('id').eq('couple_id', pareja.id);
  ok('la cuenta ajena NO ve metas de la pareja', (espiaMeta.data ?? []).length === 0);
  const espiaPerfil = await c.from('profiles').select('id').eq('id', ids.a);
  ok('la cuenta ajena NO ve el perfil de A', (espiaPerfil.data ?? []).length === 0);

  // ---- Un integrante sale: el otro conserva todo
  const salida = await b.from('couple_members').delete().eq('user_id', ids.b);
  console.log(`INFO salir de la pareja desde B: ${salida.error ? 'no permitido (' + msg(salida.error) + ')' : 'permitido'}`);
  const aunVe = await a.from('expenses').select('id').eq('couple_id', pareja.id);
  ok('A sigue viendo sus gastos', (aunVe.data ?? []).length >= 1);
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
