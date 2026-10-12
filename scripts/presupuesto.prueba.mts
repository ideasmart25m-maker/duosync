// Prueba de la regla del presupuesto (pura, sin base de datos): npx tsx / node --experimental-strip-types
import { evaluarPresupuesto } from '../app/lib/presupuesto.ts';

let fallos = 0;
const ok = (n: string, c: boolean) => {
  console.log(`${c ? 'OK   ' : 'FALLA'} ${n}`);
  if (!c) fallos++;
};

const sin = evaluarPresupuesto(500000, null);
ok('sin presupuesto definido: no hay nivel ni alerta', sin.nivel === 'sin' && !sin.pasaPorFijos);
ok('presupuesto 0 se trata como sin presupuesto', evaluarPresupuesto(100, 0).nivel === 'sin');

const bien = evaluarPresupuesto(1000000, 2500000);
ok('40 %: todo bien', bien.nivel === 'bien' && bien.porcentaje === 40 && bien.restante === 1500000);

const justo = evaluarPresupuesto(2000000, 2500000);
ok('exactamente 80 %: ya es "cerca"', justo.nivel === 'cerca' && justo.porcentaje === 80);
ok('79 %: todavía bien', evaluarPresupuesto(1975000, 2500000).nivel === 'bien');

const cerca = evaluarPresupuesto(2234000, 2500000);
ok('2.234.000 de 2.500.000: cerca, 89 %, quedan 266.000', cerca.nivel === 'cerca' && cerca.porcentaje === 89 && cerca.restante === 266000);

const igual = evaluarPresupuesto(2500000, 2500000);
ok('justo el 100 %: aún no se pasan (cerca)', igual.nivel === 'cerca' && igual.excedido === 0);

const pasado = evaluarPresupuesto(2600000, 2500000);
ok('2.600.000 de 2.500.000: pasado por 100.000', pasado.nivel === 'pasado' && pasado.excedido === 100000 && pasado.restante === -100000);

// El caso real: iban en 2.234.000 y faltaban los servicios públicos (350.000)
const fijos = evaluarPresupuesto(2234000, 2500000, 350000);
ok('con 350.000 de pagos fijos pendientes se pasarían por 84.000', fijos.pasaPorFijos && fijos.excedidoProyectado === 84000);
ok('y hoy todavía NO se han pasado', fijos.nivel === 'cerca' && fijos.excedido === 0);

const holgado = evaluarPresupuesto(1000000, 2500000, 300000);
ok('con holgura, los pagos fijos pendientes no disparan alerta', !holgado.pasaPorFijos && holgado.nivel === 'bien');

ok('pagos fijos negativos se ignoran', evaluarPresupuesto(100, 1000, -50).pendientesFijos === 0);

console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
