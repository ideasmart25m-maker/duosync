// Prueba contra la base real: el día cambia a medianoche HORA LOCAL de cada pareja según su país.
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
const casos = [
  ['co', 'CO', 'America/Bogota'],
  ['mx', 'MX', 'America/Mexico_City'],
  ['ar', 'AR', 'America/Argentina/Buenos_Aires'],
  ['br', 'BR', 'America/Sao_Paulo'],
];
const ids = {};
let fallos = 0;
const ok = (n, c) => {
  console.log(`${c ? 'OK   ' : 'FALLA'} ${n}`);
  if (!c) fallos++;
};

try {
  const clientes = {};
  for (const [k] of casos) {
    const r = await admin.auth.admin.createUser({ email: `tmp-huso-${k}@example.com`, password: pw, email_confirm: true });
    if (r.error) throw r.error;
    ids[k] = r.data.user.id;
    const c = createClient(SB, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
    await c.auth.signInWithPassword({ email: `tmp-huso-${k}@example.com`, password: pw });
    clientes[k] = c;
  }
  for (const [k, pais, zona] of casos) {
    await clientes[k].rpc('crear_pareja');
    const r = await clientes[k].rpc('actualizar_pais_pareja', { p_pais: pais });
    if (r.error) throw r.error;
    const z = (await clientes[k].from('couples').select('zona_horaria').single()).data.zona_horaria;
    ok(`pareja de ${pais}: su huso es ${zona}`, z === zona);
  }

  // Instante: 10-oct 03:30 UTC → Colombia 9-oct 22:30 · México 9-oct 21:30 · Argentina/Brasil 10-oct 00:30
  const instante = '2026-10-10T03:30:00Z';
  const esperado = { co: '2026-10-09', mx: '2026-10-09', ar: '2026-10-10', br: '2026-10-10' };
  for (const [k, pais] of casos) {
    const r = await clientes[k].rpc('fecha_de_hoy', { p_ahora: instante });
    ok(`a las 03:30 UTC, "hoy" para ${pais} es ${esperado[k]} (da ${r.data})`, r.data === esperado[k]);
  }
  // Otro instante: 10-oct 05:30 UTC → Colombia 00:30 del 10 · México 23:30 del 9 · Argentina/Brasil 02:30 del 10
  const instante2 = '2026-10-10T05:30:00Z';
  const esperado2 = { co: '2026-10-10', mx: '2026-10-09', ar: '2026-10-10', br: '2026-10-10' };
  for (const [k, pais] of casos) {
    const r = await clientes[k].rpc('fecha_de_hoy', { p_ahora: instante2 });
    ok(`a las 05:30 UTC, "hoy" para ${pais} es ${esperado2[k]} (da ${r.data})`, r.data === esperado2[k]);
  }

  // La pregunta del día y las respuestas usan ese día: responder deja la fecha local de la pareja
  const hoyAr = (await clientes.ar.rpc('fecha_de_hoy')).data;
  const q = (await clientes.ar.rpc('pregunta_de_hoy')).data;
  const resp = await clientes.ar.rpc('responder_pregunta_hoy', { p_question_id: q.id, p_respuesta: 'prueba' });
  ok('responder la pregunta funciona con el huso por pareja', !resp.error);
  const fila = (await admin.from('daily_answers').select('fecha').eq('user_id', ids.ar).single()).data;
  ok(`la respuesta quedó con el día local de la pareja (${hoyAr})`, fila.fecha === hoyAr);
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
