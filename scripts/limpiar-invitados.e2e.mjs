// Prueba contra la base real de la limpieza de invitados huérfanos: solo se borra al anónimo SIN pareja y viejo.
// Crea usuarios temporales (@example.com / anónimos) y limpia al terminar. Se corre copiándolo a app/ con la
// ruta del .env.local ajustada a '.env.local'.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const l of fs.readFileSync('app/.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(SB, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const pw = 'Prueba-' + Math.random().toString(36).slice(2) + '-Xx9';
const ids = [];
let fallos = 0;
const ok = (n, c, extra = '') => {
  console.log(`${c ? 'OK   ' : 'FALLA'} ${n}${!c && extra ? ' → ' + extra : ''}`);
  if (!c) fallos++;
};
const existe = async (id) => !!(await admin.auth.admin.getUserById(id)).data?.user;
const nuevoCliente = () => createClient(SB, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });

try {
  // Dueña de una pareja real de prueba (con correo)
  const dueno = await admin.auth.admin.createUser({ email: 'tmp-limpieza-dueno@example.com', password: pw, email_confirm: true });
  ids.push(dueno.data.user.id);
  const cd = nuevoCliente();
  await cd.auth.signInWithPassword({ email: 'tmp-limpieza-dueno@example.com', password: pw });
  const pareja = (await cd.rpc('crear_pareja')).data;

  // Invitado huérfano (anónimo, sin pareja)
  const huerfano = nuevoCliente();
  const h = await huerfano.auth.signInAnonymously();
  if (h.error) throw new Error('No se pudo crear invitado anónimo: ' + h.error.message);
  ids.push(h.data.user.id);

  // Invitado que SÍ se unió a la pareja
  const unido = nuevoCliente();
  const u = await unido.auth.signInAnonymously();
  ids.push(u.data.user.id);
  const unir = await unido.rpc('unirse_con_token', { p_token: pareja.token_invitacion });
  ok('el invitado se une a la pareja', !unir.error, unir.error?.message);

  // Usuario con correo, sin pareja
  const sinPareja = await admin.auth.admin.createUser({ email: 'tmp-limpieza-sinpareja@example.com', password: pw, email_confirm: true });
  ids.push(sinPareja.data.user.id);

  // Con el plazo normal de 7 días, nada recién creado se borra
  const r0 = await admin.rpc('limpiar_invitados_huerfanos');
  ok('con el plazo de 7 días no se borra ninguna cuenta recién creada', !r0.error && (await existe(h.data.user.id)), r0.error?.message);

  // Plazo adelantado (como si hubieran pasado 7 días)
  const futuro = new Date(Date.now() + 60_000).toISOString();
  const r1 = await admin.rpc('limpiar_invitados_huerfanos', { p_antes_de: futuro });
  ok('la limpieza corre sin error', !r1.error, r1.error?.message);
  ok('el invitado huérfano se borra', !(await existe(h.data.user.id)));
  ok('el invitado que está en una pareja se conserva', await existe(u.data.user.id));
  ok('la dueña de la pareja se conserva', await existe(dueno.data.user.id));
  ok('un usuario con correo y sin pareja NO se borra', await existe(sinPareja.data.user.id));
  const aun = await admin.from('couple_members').select('user_id').eq('couple_id', pareja.id);
  ok('la pareja conserva a sus 2 integrantes', aun.data?.length === 2);
} catch (e) {
  console.log('ERROR de la prueba:', e.message ?? JSON.stringify(e));
  fallos++;
} finally {
  const todas = await admin.from('couple_members').select('couple_id').in('user_id', ids);
  for (const cp of new Set((todas.data ?? []).map((x) => x.couple_id))) await admin.from('couples').delete().eq('id', cp);
  for (const id of ids) await admin.auth.admin.deleteUser(id).catch(() => null);
  const us = (await admin.auth.admin.listUsers()).data.users;
  console.log('usuarios que quedan:', us.map((x) => x.email || '(anónimo)').join(', '));
}
console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
