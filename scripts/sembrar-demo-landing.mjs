import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, ''); }
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(SB, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const pw = 'Demo-' + Math.random().toString(36).slice(2) + '-Qq7';
const SP = 'C:/Users/Gloria/AppData/Local/Temp/claude/C--Users-Gloria-Documents-RENTAS-INTELIGENTES-DUOSYNC/49179176-cdc1-4385-9b66-fd1bdf01aaee/scratchpad';
const ids = {};
for (const [k, nombre] of [['mateo', 'Mateo'], ['sofia', 'Sofía']]) {
  const r = await admin.auth.admin.createUser({ email: 'tmp-demo-' + k + '@example.com', password: pw, email_confirm: true });
  if (r.error) throw r.error;
  ids[k] = r.data.user.id;
  const p = await admin.from('profiles').upsert({ id: ids[k], nombre });
  if (p.error) throw p.error;
}
const entrar = async (k) => {
  const c = createClient(SB, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const r = await c.auth.signInWithPassword({ email: 'tmp-demo-' + k + '@example.com', password: pw });
  if (r.error) throw r.error;
  return { c, session: r.data.session };
};
const m = await entrar('mateo');
const s = await entrar('sofia');
const pareja = (await m.c.rpc('crear_pareja')).data;
const un = await s.c.rpc('unirse_con_token', { p_token: pareja.token_invitacion });
if (un.error) throw un.error;
const cid = pareja.id;
const cats = Object.fromEntries((await admin.from('categories').select('id,nombre').eq('couple_id', cid)).data.map((x) => [x.nombre, x.id]));
const G = (cat, monto, fecha, quien, nota) => ({ couple_id: cid, category_id: cats[cat], monto, fecha, registrado_por: ids[quien], nota, split_percent: 50 });
const gastos = [
  G('Arriendo/hipoteca', 1200000, '2026-10-01', 'mateo', 'Arriendo de octubre'),
  G('Servicios públicos', 185000, '2026-10-05', 'sofia', 'Luz, agua e internet'),
  G('Supermercado', 240000, '2026-10-03', 'sofia', 'Mercado de la quincena'),
  G('Supermercado', 178000, '2026-10-10', 'mateo', 'Mercado'),
  G('Supermercado', 94000, '2026-10-16', 'mateo', 'Frutas y verduras'),
  G('Restaurantes / Salidas', 85000, '2026-10-12', 'sofia', 'Cine + comida'),
  G('Restaurantes / Salidas', 62000, '2026-10-18', 'mateo', 'Almuerzo del domingo'),
  G('Transporte / Gasolina', 96000, '2026-10-07', 'mateo', 'Gasolina'),
  G('Transporte / Gasolina', 54000, '2026-10-19', 'sofia', 'Taxi y parqueadero'),
  G('Entretenimiento', 45000, '2026-10-14', 'sofia', 'Concierto'),
  G('Arriendo/hipoteca', 1200000, '2026-09-01', 'mateo', 'Arriendo de septiembre'),
  G('Servicios públicos', 190000, '2026-09-05', 'sofia', 'Luz, agua e internet'),
  G('Supermercado', 300000, '2026-09-04', 'sofia', 'Mercado'),
  G('Supermercado', 220000, '2026-09-18', 'mateo', 'Mercado'),
  G('Restaurantes / Salidas', 310000, '2026-09-20', 'sofia', 'Salidas'),
  G('Transporte / Gasolina', 160000, '2026-09-12', 'mateo', 'Gasolina'),
  G('Entretenimiento', 70000, '2026-09-26', 'sofia', 'Teatro'),
];
let r = await admin.from('expenses').insert(gastos);
if (r.error) throw r.error;
r = await admin.from('couples').update({ presupuesto_mensual: 2500000, pais: 'CO', plan: 'premium' }).eq('id', cid);
if (r.error) console.log('couples update:', r.error.message);
r = await admin.from('streaks').update({ dias: 12, ultima_fecha: '2026-10-21' }).eq('couple_id', cid);
const metas = (await admin.from('savings_goals').insert([
  { couple_id: cid, nombre: 'Viaje a Cartagena', monto_objetivo: 4800000, monto_actual: 1488000, fecha_objetivo: '2027-03-15' },
  { couple_id: cid, nombre: 'Fondo de emergencia', monto_objetivo: 5000000, monto_actual: 1250000, fecha_objetivo: '2027-06-30' },
]).select('id,nombre')).data;
const meta = (n) => metas.find((x) => x.nombre === n).id;
r = await admin.from('goal_contributions').insert([
  { couple_id: cid, meta_id: meta('Viaje a Cartagena'), monto: 300000, created_by: ids.mateo, created_at: '2026-09-10T15:00:00Z' },
  { couple_id: cid, meta_id: meta('Viaje a Cartagena'), monto: 288000, created_by: ids.sofia, created_at: '2026-09-25T15:00:00Z' },
  { couple_id: cid, meta_id: meta('Viaje a Cartagena'), monto: 400000, created_by: ids.sofia, created_at: '2026-10-05T15:00:00Z' },
  { couple_id: cid, meta_id: meta('Fondo de emergencia'), monto: 250000, created_by: ids.mateo, created_at: '2026-10-08T15:00:00Z' },
]);
if (r.error) console.log('aportes:', r.error.message);
// cookies de sesión de Mateo, troceadas como @supabase/ssr
const val = 'base64-' + Buffer.from(JSON.stringify(m.session)).toString('base64url');
const name = 'sb-' + new URL(SB).hostname.split('.')[0] + '-auth-token';
const trozos = val.match(/.{1,3180}/g);
const cookies = trozos.length === 1 ? [{ name, value: val }] : trozos.map((v, i) => ({ name: name + '.' + i, value: v }));
fs.writeFileSync('public/_demo.json', JSON.stringify(cookies.map((c) => ({ ...c, url: 'http://localhost:3000' }))));
fs.writeFileSync(SP + '/demo_ids.json', JSON.stringify({ cid, ids }));
console.log('OK pareja demo', cid);
