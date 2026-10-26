// Prueba contra la base real: quién tiene acceso (plan premium) — suscripción vigente, 2 días de gracia, vencida,
// y acceso manual del dueño. Crea un usuario temporal (@example.com) y lo borra al terminar.
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
const email = 'tmp-acceso-a@example.com';
let uid, cid, fallos = 0;
const ok = (n, c) => { console.log(`${c ? 'OK   ' : 'FALLA'} ${n}`); if (!c) fallos++; };
const dias = (n) => new Date(Date.now() + n * 86_400_000).toISOString();
const plan = async () => {
  await admin.rpc('recalcular_plan_pareja', { p_couple_id: cid });
  return (await admin.from('couples').select('plan').eq('id', cid).single()).data.plan;
};
const sub = async (status, accessUntil) => {
  await admin.from('subscriptions').delete().eq('email', email);
  if (status) await admin.from('subscriptions').insert({ email, status, plan_interval: 'mensual', access_until: accessUntil, last_event_at: new Date().toISOString() });
};

try {
  const r = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true });
  if (r.error) throw r.error;
  uid = r.data.user.id;
  const c = createClient(SB, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email, password: pw });
  cid = (await c.rpc('crear_pareja')).data.id;

  ok('un espacio nuevo sin pago queda en gratis (bloqueado)', (await plan()) === 'gratis');
  await sub('trialing', dias(5));
  ok('en prueba gratis (acceso futuro) tiene plan', (await plan()) === 'premium');
  await sub('active', dias(25));
  ok('suscripción activa tiene plan', (await plan()) === 'premium');
  await sub('cancelled', dias(-1));
  ok('cancelada y vencida hace 1 día: sigue dentro de los 2 días de gracia', (await plan()) === 'premium');
  await sub('cancelled', dias(-1.9));
  ok('vencida hace 1,9 días: todavía en gracia', (await plan()) === 'premium');
  await sub('cancelled', dias(-2.1));
  ok('vencida hace más de 2 días: se bloquea (gratis)', (await plan()) === 'gratis');
  await sub('refunded', dias(10));
  ok('reembolsada: se bloquea aunque quedara tiempo', (await plan()) === 'gratis');
  await sub('chargeback', dias(10));
  ok('contracargo: se bloquea', (await plan()) === 'gratis');

  await sub(null);
  await admin.from('couples').update({ acceso_manual: true }).eq('id', cid);
  ok('acceso manual del dueño: tiene plan sin suscripción', (await plan()) === 'premium');
  await admin.from('couples').update({ acceso_manual: false }).eq('id', cid);
  ok('al quitar el acceso manual vuelve a bloquearse', (await plan()) === 'gratis');

  // el cliente no puede darse acceso a sí mismo
  const mio = await c.from('couples').update({ acceso_manual: true, plan: 'premium' }).eq('id', cid).select();
  const despues = (await admin.from('couples').select('plan, acceso_manual').eq('id', cid).single()).data;
  ok('un usuario no puede activarse a sí mismo el acceso ni el plan', despues.plan === 'gratis' && despues.acceso_manual === false);
  const rpcDirecto = await c.rpc('recalcular_plan_pareja', { p_couple_id: cid });
  ok('un usuario no puede llamar a recalcular_plan_pareja', !!rpcDirecto.error);
} catch (e) {
  console.log('ERROR de la prueba:', e.message ?? JSON.stringify(e));
  fallos++;
} finally {
  await admin.from('subscriptions').delete().eq('email', email);
  if (cid) await admin.from('couples').delete().eq('id', cid);
  if (uid) await admin.auth.admin.deleteUser(uid);
  const u = await admin.auth.admin.listUsers({ perPage: 200 });
  console.log('usuarios tmp-acceso que quedan:', u.data.users.filter((x) => x.email?.startsWith('tmp-acceso')).length);
}
console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
