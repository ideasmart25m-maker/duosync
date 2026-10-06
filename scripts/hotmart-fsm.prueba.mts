import { decidir, type Suscripcion, type EventoNormalizado } from '../app/lib/hotmart/fsm.ts';

let fallos = 0;
function ok(nombre: string, condicion: boolean) {
  console.log(`${condicion ? 'OK   ' : 'FALLA'} ${nombre}`);
  if (!condicion) fallos++;
}
const d = (iso: string) => new Date(iso);
const ev = (tipo: string, extra: Partial<EventoNormalizado> = {}): EventoNormalizado => ({
  tipo,
  transaccion: 'HP1',
  intervalo: 'mensual',
  ocurridoEn: d('2026-10-10T12:00:00Z'),
  precioPositivo: true,
  ...extra,
});

// 1. Primera compra → prueba de 7 días + gracia
let r = decidir(null, ev('PURCHASE_APPROVED'));
ok('primer APPROVED inicia prueba', r.accion === 'aplicar' && r.siguiente.status === 'trialing' && r.inicioDePrueba && !r.registrarVenta);
const prueba: Suscripcion = (r as Extract<typeof r, { accion: 'aplicar' }>).siguiente;
ok('prueba dura 7 días', prueba.trialEndsAt?.toISOString() === '2026-10-17T12:00:00.000Z');
ok('acceso = fin de prueba + 5 días', prueba.accessUntil.toISOString() === '2026-10-22T12:00:00.000Z');

// 2. Reintento del mismo aviso dentro de la prueba → ignorar
r = decidir(prueba, ev('PURCHASE_APPROVED', { ocurridoEn: d('2026-10-11T12:00:00Z') }));
ok('segundo APPROVED dentro de la prueba se ignora', r.accion === 'ignorar');

// 3. Primer cobro real tras la prueba → active
r = decidir(prueba, ev('PURCHASE_APPROVED', { transaccion: 'HP2', ocurridoEn: d('2026-10-17T12:30:00Z') }));
ok('cobro tras la prueba pasa a active', r.accion === 'aplicar' && r.siguiente.status === 'active' && r.registrarVenta);
const activa = (r as Extract<typeof r, { accion: 'aplicar' }>).siguiente;
ok('firstPaidAt se fija en el primer cobro', activa.firstPaidAt?.toISOString() === '2026-10-17T12:30:00.000Z');
ok('acceso mensual = 31 + 5 días', activa.accessUntil.toISOString() === '2026-11-22T12:30:00.000Z');

// 3b. Aviso de precio 0 tras la prueba no convierte a pagante
r = decidir(prueba, ev('PURCHASE_APPROVED', { transaccion: 'HP7', precioPositivo: false, ocurridoEn: d('2026-10-18T00:00:00Z') }));
ok('APPROVED con precio 0 tras la prueba se ignora', r.accion === 'ignorar');

// 4. PURCHASE_COMPLETE no extiende el acceso
r = decidir(activa, ev('PURCHASE_COMPLETE', { transaccion: 'HP2', ocurridoEn: d('2026-11-01T00:00:00Z') }));
ok('COMPLETE se ignora', r.accion === 'ignorar');

// 5. Misma transacción reentregada
r = decidir(activa, ev('PURCHASE_APPROVED', { transaccion: 'HP2', ocurridoEn: d('2026-10-17T12:31:00Z') }));
ok('misma transacción no se aplica dos veces', r.accion === 'ignorar');

// 6. Renovación
r = decidir(activa, ev('PURCHASE_APPROVED', { transaccion: 'HP3', ocurridoEn: d('2026-11-17T12:00:00Z') }));
ok('renovación extiende el acceso', r.accion === 'aplicar' && r.siguiente.accessUntil.toISOString() === '2026-12-23T12:00:00.000Z' && r.registrarVenta);

// 7. Plan anual
r = decidir(null, ev('PURCHASE_APPROVED', { intervalo: 'anual' }));
ok('anual inicia prueba con intervalo anual', r.accion === 'aplicar' && r.siguiente.planInterval === 'anual');
const trialAnual = (r as Extract<typeof r, { accion: 'aplicar' }>).siguiente;
r = decidir(trialAnual, ev('PURCHASE_APPROVED', { transaccion: 'HP9', intervalo: 'anual', ocurridoEn: d('2026-10-17T13:00:00Z') }));
ok('cobro anual da 366 + 5 días', r.accion === 'aplicar' && r.siguiente.accessUntil.toISOString() === '2027-10-23T13:00:00.000Z');

// 8. Atraso y cancelación
r = decidir(activa, ev('PURCHASE_DELAYED'));
ok('DELAYED marca past_due sin extender', r.accion === 'aplicar' && r.siguiente.status === 'past_due' && r.siguiente.accessUntil.getTime() === activa.accessUntil.getTime());
r = decidir(activa, ev('SUBSCRIPTION_CANCELLATION'));
ok('cancelar mes pagado respeta el acceso', r.accion === 'aplicar' && r.siguiente.status === 'cancelled' && r.siguiente.accessUntil.getTime() === activa.accessUntil.getTime());
r = decidir(prueba, ev('SUBSCRIPTION_CANCELLATION'));
ok('cancelar en la prueba corta al fin de la prueba', r.accion === 'aplicar' && r.siguiente.accessUntil.getTime() === prueba.trialEndsAt!.getTime());

// 9. Reembolso / chargeback cortan ya
r = decidir(activa, ev('PURCHASE_REFUNDED', { transaccion: 'HP2', ocurridoEn: d('2026-10-20T00:00:00Z') }));
ok('reembolso corta el acceso', r.accion === 'aplicar' && r.siguiente.status === 'refunded' && r.siguiente.accessUntil.toISOString() === '2026-10-20T00:00:00.000Z' && r.registrarReversa === 'refund');
const reembolsada = (r as Extract<typeof r, { accion: 'aplicar' }>).siguiente;
r = decidir(reembolsada, ev('PURCHASE_APPROVED', { transaccion: 'HP2', ocurridoEn: d('2026-10-21T00:00:00Z') }));
ok('APPROVED viejo no reactiva a un reembolsado', r.accion === 'ignorar');
r = decidir(reembolsada, ev('PURCHASE_APPROVED', { transaccion: 'HP50', ocurridoEn: d('2026-12-01T00:00:00Z') }));
ok('recompra posterior sí es una compra nueva', r.accion === 'aplicar' && r.siguiente.status === 'trialing');
r = decidir(activa, ev('PURCHASE_CHARGEBACK'));
ok('chargeback corta y marca', r.accion === 'aplicar' && r.siguiente.status === 'chargeback' && r.registrarReversa === 'chargeback');

// 10. Eventos sin suscripción previa / desconocidos
ok('cancelación sin suscripción se ignora', decidir(null, ev('SUBSCRIPTION_CANCELLATION')).accion === 'ignorar');
ok('reembolso sin suscripción se ignora', decidir(null, ev('PURCHASE_REFUNDED')).accion === 'ignorar');
ok('evento desconocido se ignora', decidir(activa, ev('CLUB_FIRST_ACCESS')).accion === 'ignorar');
r = decidir(activa, ev('SWITCH_PLAN', { intervalo: 'anual' }));
ok('SWITCH_PLAN cambia el intervalo sin tocar el estado', r.accion === 'aplicar' && r.siguiente.planInterval === 'anual' && r.siguiente.status === 'active');

console.log(fallos === 0 ? '\nTODAS LAS PRUEBAS PASAN' : `\n${fallos} PRUEBA(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
