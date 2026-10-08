// Prueba contra la base real: el código de pareja que se comparte pasa a ser el real. Crea usuarios
// temporales (@example.com), los usa y los borra al terminar. Requiere correr desde una carpeta con
// node_modules (se probó copiándolo temporalmente a app/ y ajustando la ruta del .env.local).
import { createClient } from '@supabase/supabase-js';

for (const l of fs.readFileSync('app/.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(SB, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const pw = 'Prueba-' + Math.random().toString(36).slice(2) + '-Xx9';
const correos = ['tmp-pareja-a@example.com', 'tmp-pareja-b@example.com'];
const ids = [];
const parejas = [];
let fallos = 0;
const ok = (n, c) => {
  console.log(`${c ? 'OK   ' : 'FALLA'} ${n}`);
  if (!c) fallos++;
};

try {
  for (const e of correos) {
    const r = await admin.auth.admin.createUser({ email: e, password: pw, email_confirm: true });
    if (r.error) throw r.error;
    ids.push(r.data.user.id);
  }
  const entrar = async (e) => {
    const c = createClient(SB, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
    const r = await c.auth.signInWithPassword({ email: e, password: pw });
    if (r.error) throw r.error;
    return c;
  };
  const a = await entrar(correos[0]);
  const b = await entrar(correos[1]);

  const ra = await a.rpc('crear_pareja', { p_codigo: '7391' });
  if (ra.error) throw ra.error;
  parejas.push(ra.data.id);
  ok('A pide 7391 y ese pasa a ser el código real de su pareja', ra.data.codigo_invitacion === '7391');

  const rb = await b.rpc('crear_pareja', { p_codigo: '7391' });
  if (rb.error) throw rb.error;
  parejas.push(rb.data.id);
  ok('B pide el mismo 7391 (ocupado): se le genera otro, sin error', /^[0-9]{4}$/.test(rb.data.codigo_invitacion) && rb.data.codigo_invitacion !== '7391');

  // La otra persona se une con el código real
  const extra = await admin.auth.admin.createUser({ email: 'tmp-pareja-c@example.com', password: pw, email_confirm: true });
  ids.push(extra.data.user.id);
  const c = await entrar('tmp-pareja-c@example.com');
  const rc = await c.rpc('unirse_con_codigo', { p_codigo: '7391' });
  ok('una tercera persona se une a la pareja de A con el código 7391', !rc.error && rc.data.id === ra.data.id);
  const miembros = await admin.from('couple_members').select('user_id').eq('couple_id', ra.data.id);
  ok('la pareja de A ahora tiene 2 integrantes', miembros.data.length === 2);

  const sinCodigo = await createClient(SB, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } }).rpc('crear_pareja', { p_codigo: '1234' });
  ok('sin sesión no se puede crear una pareja', !!sinCodigo.error);
} catch (e) {
  console.log('ERROR de la prueba:', e.message ?? JSON.stringify(e));
  fallos++;
} finally {
  for (const id of parejas) await admin.from('couples').delete().eq('id', id);
  for (const id of ids) await admin.auth.admin.deleteUser(id);
  const u = await admin.auth.admin.listUsers();
  console.log('usuarios que quedan:', u.data.users.map((x) => x.email).join(', '));
  const cp = await admin.from('couples').select('id');
  console.log('parejas que quedan:', cp.data.length);
}
console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
