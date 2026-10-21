// Prueba de las cuentas de Reportes (puras, sin base de datos): node --experimental-strip-types scripts/reportes.prueba.mts
import { ahorroPorMes, ahorroPorMeta, claveLocalDe, resumirMes, resumirMesHasta, totalesPorMes, ultimosMeses, variacionPorcentual, porcentajeDe, claveMes } from '../app/lib/reportes.ts';

let fallos = 0;
const ok = (n: string, c: boolean) => {
  console.log(`${c ? 'OK   ' : 'FALLA'} ${n}`);
  if (!c) fallos++;
};

const g = (fecha: string, monto: number, categoriaId: string, registradoPor: string) => ({ fecha, monto, categoriaId, registradoPor });
const gastos = [
  g('2026-10-02', 1200000, 'arriendo', 'ana'),
  g('2026-10-10', 400000, 'mercado', 'luis'),
  g('2026-10-12', 150000, 'mercado', 'ana'),
  g('2026-09-30', 900000, 'arriendo', 'luis'),
  g('2026-09-05', 100000, 'mercado', 'luis'),
  g('2026-07-15', 50000, 'salidas', 'ana'),
];

const oct = resumirMes(gastos, '2026-10');
ok('octubre suma 1.750.000 en 3 gastos', oct.total === 1750000 && oct.cantidad === 3);
ok('la categoría más pesada es arriendo, luego mercado', oct.porCategoria[0].id === 'arriendo' && oct.porCategoria[1].id === 'mercado' && oct.porCategoria[1].total === 550000);
ok('quién más pagó es ana (1.350.000), luego luis (400.000)', oct.porPersona[0].id === 'ana' && oct.porPersona[0].total === 1350000 && oct.porPersona[1].total === 400000);
ok('un gasto del 30 de septiembre NO cuenta en octubre', resumirMes(gastos, '2026-10').total === 1750000 && resumirMes(gastos, '2026-09').total === 1000000);
ok('un mes sin gastos da cero', resumirMes(gastos, '2026-08').total === 0 && resumirMes(gastos, '2026-08').porCategoria.length === 0);

const meses = ultimosMeses(2026, 10, 6);
ok('los últimos 6 meses van de mayo a octubre', meses.length === 6 && meses[0].clave === '2026-05' && meses[5].clave === '2026-10');
const cruce = ultimosMeses(2026, 2, 4);
ok('cruzando el año: nov, dic, ene, feb', cruce.map((m) => m.clave).join(',') === '2025-11,2025-12,2026-01,2026-02');
const t = totalesPorMes(gastos, meses);
ok('totales por mes: julio 50.000, agosto 0, septiembre 1.000.000, octubre 1.750.000', t[2].total === 50000 && t[3].total === 0 && t[4].total === 1000000 && t[5].total === 1750000);

ok('variación octubre vs septiembre: +75 %', variacionPorcentual(1750000, 1000000) === 75);
ok('variación a la baja: -50 %', variacionPorcentual(500000, 1000000) === -50);
ok('sin mes anterior con gastos no hay comparación', variacionPorcentual(500000, 0) === null);
ok('porcentaje: 550.000 de 1.750.000 = 31 %', porcentajeDe(550000, 1750000) === 31);
ok('porcentaje con total 0 = 0', porcentajeDe(10, 0) === 0);
ok('claveMes rellena el cero', claveMes(2026, 3) === '2026-03');

const hasta15 = resumirMesHasta(gastos, '2026-10', 10);
ok('hasta el día 10 de octubre solo cuentan 2 gastos (1.600.000)', hasta15.cantidad === 2 && hasta15.total === 1600000);
ok('el 5 de septiembre solo cuenta el gasto del 5 (100.000)', resumirMesHasta(gastos, '2026-09', 5).total === 100000);

const ap = [
  { metaId: 'cruc', monto: 300000, creadoEn: '2026-10-12T15:00:00' },
  { metaId: 'cruc', monto: 100000, creadoEn: '2026-10-20T10:00:00' },
  { metaId: 'cuota', monto: 500000, creadoEn: '2026-10-05T09:00:00' },
  { metaId: 'cuota', monto: 250000, creadoEn: '2026-09-14T09:00:00' },
];
ok('claveLocalDe da el mes del aporte', claveLocalDe('2026-10-12T15:00:00') === '2026-10');
const am = ahorroPorMes(ap, ultimosMeses(2026, 10, 3));
ok('ahorro por mes: agosto 0, septiembre 250.000, octubre 900.000', am[0].total === 0 && am[1].total === 250000 && am[2].total === 900000);
const pm = ahorroPorMeta(ap, '2026-10');
ok('por meta en octubre: cuota 500.000 y crucero 400.000 (de mayor a menor)', pm[0].id === 'cuota' && pm[0].total === 500000 && pm[1].id === 'cruc' && pm[1].total === 400000);
ok('una meta sin aportes en el mes no aparece', ahorroPorMeta(ap, '2026-08').length === 0);

console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
