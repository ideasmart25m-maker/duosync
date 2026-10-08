// Prueba contra la base real: una persona solo puede estar en UNA pareja. Crea usuarios temporales
// (@example.com) y los borra al terminar. Se corre copiándolo a app/ (usa app/node_modules) con la ruta
// del .env.local ajustada a '.env.local'.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const l of fs.readFileSync('app/.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(SB, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const pw = 'Prueba-' + Math.random().toString(36).slice(2) + '-Xx9';
const correos = { y: 'tmp-y@example.com', x: 'tmp-x@example.com', z: 'tmp-z@example.com' };
const ids = {};
let fallos = 0;
const ok = (n, c) => {
  console.log(`${c ? 'OK   ' : 'FALLA'} ${n}`);
  if (!c) fallos++;
};
const entrar = async (e) => {
  const c = createClient(SB, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const r = await c.auth.signInWithPassword({ email: e, password: pw });
  if (r.error) throw r.error;
  return c;
};
const parejasDe = async (uid) => (await admin.from('couple_members').select('couple_id').eq('user_id', uid)).data.map((x) => x.couple_id);

try {
  for (const [k, e] of Object.entries(correos)) {
    const r = await admin.auth.admin.createUser({ email: e, password: pw, email_confirm: true });
    if (r.error) throw r.error;
    ids[k] = r.data.user.id;
  }
  const y = await entrar(correos.y);
  const x = await entrar(correos.x);
  const z = await entrar(correos.z);

  const py = (await y.rpc('crear_pareja', { p_codigo: '8123' })).data;
  const px = (await x.rpc('crear_pareja')).data; // pareja propia vacía (como al entrar por "Entrar")
  const pz = (await z.rpc('crear_pareja')).data;
  await admin.from('expenses').insert({ couple_id: pz.id, category_id: (await admin.from('categories').select('id').eq('couple_id', pz.id).limit(1).single()).data.id, monto: 1000, registrado_por: ids.z });

  const rx = await x.rpc('unirse_con_codigo', { p_codigo: '8123' });
  ok('X (con pareja propia vacía) se une al código 8123 sin error', !rx.error && rx.data.id === py.id);
  const parejasX = await parejasDe(ids.x);
  ok('X queda en UNA sola pareja: la de Y', parejasX.length === 1 && parejasX[0] === py.id);
  const vieja = await admin.from('couples').select('id').eq('id', px.id);
  ok('la pareja vacía anterior de X se eliminó sola', vieja.data.length === 0);

  const rz = await z.rpc('unirse_con_codigo', { p_codigo: '8123' });
  ok('Z (con datos en su pareja) NO se puede unir: error YA_TIENES_PAREJA', !!rz.error && rz.error.message.includes('YA_TIENES_PAREJA'));
  const parejasZ = await parejasDe(ids.z);
  ok('Z sigue en su pareja y no se perdió nada', parejasZ.length === 1 && parejasZ[0] === pz.id);
  const gastos = await admin.from('expenses').select('id').eq('couple_id', pz.id);
  ok('el gasto de Z sigue ahí', gastos.data.length === 1);

  const rm = await y.rpc('unirse_con_codigo', { p_codigo: '8123' });
  ok('quien ya está en esa pareja puede repetir el código sin problema', !rm.error);
} catch (e) {
  console.log('ERROR de la prueba:', e.message ?? JSON.stringify(e));
  fallos++;
} finally {
  const todas = await admin.from('couple_members').select('couple_id').in('user_id', Object.values(ids));
  for (const c of new Set((todas.data ?? []).map((x) => x.couple_id))) await admin.from('couples').delete().eq('id', c);
  for (const id of Object.values(ids)) await admin.auth.admin.deleteUser(id);
  const u = await admin.auth.admin.listUsers();
  console.log('usuarios que quedan:', u.data.users.map((x) => x.email).join(', '));
  console.log('parejas que quedan:', (await admin.from('couples').select('id')).data.length);
}
console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
