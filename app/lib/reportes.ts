// Cuentas de la pantalla Reportes. Las funciones puras (sin base de datos) se pueden probar solas; la consulta
// trae los gastos de la casa de un rango de meses y todo lo demás se calcula aquí. Solo cuentan los gastos en la
// moneda de la casa: los de viajes (otra moneda) van aparte y no se suman con pesos.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface GastoSimple {
  fecha: string; // yyyy-mm-dd
  monto: number;
  categoriaId: string;
  registradoPor: string;
}

export interface FilaTotal {
  id: string;
  total: number;
}

export interface ResumenMes {
  total: number;
  cantidad: number;
  porCategoria: FilaTotal[]; // de mayor a menor
  porPersona: FilaTotal[]; // de mayor a menor
}

export const claveMes = (anio: number, mes: number) => `${anio}-${String(mes).padStart(2, '0')}`;

/** Los `n` meses que terminan en (anio, mes), del más viejo al actual. `mes` va de 1 a 12. */
export function ultimosMeses(anio: number, mes: number, n: number): { anio: number; mes: number; clave: string }[] {
  const lista: { anio: number; mes: number; clave: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(anio, mes - 1 - i, 1);
    lista.push({ anio: d.getFullYear(), mes: d.getMonth() + 1, clave: claveMes(d.getFullYear(), d.getMonth() + 1) });
  }
  return lista;
}

function ordenar(mapa: Map<string, number>): FilaTotal[] {
  return [...mapa.entries()].map(([id, total]) => ({ id, total })).sort((a, b) => b.total - a.total);
}

/** Resume los gastos de UN mes (`clave` = yyyy-mm). Ignora los de otros meses. */
export function resumirMes(gastos: GastoSimple[], clave: string): ResumenMes {
  const porCategoria = new Map<string, number>();
  const porPersona = new Map<string, number>();
  let total = 0;
  let cantidad = 0;
  for (const g of gastos) {
    if (!g.fecha.startsWith(clave)) continue;
    total += g.monto;
    cantidad++;
    porCategoria.set(g.categoriaId, (porCategoria.get(g.categoriaId) ?? 0) + g.monto);
    porPersona.set(g.registradoPor, (porPersona.get(g.registradoPor) ?? 0) + g.monto);
  }
  return { total, cantidad, porCategoria: ordenar(porCategoria), porPersona: ordenar(porPersona) };
}

/** Resume un mes contando solo hasta el día `hastaDia` (inclusive): sirve para comparar el mes en curso con el mismo tramo del anterior. */
export function resumirMesHasta(gastos: GastoSimple[], clave: string, hastaDia: number): ResumenMes {
  const tope = `${clave}-${String(Math.max(1, hastaDia)).padStart(2, '0')}`;
  return resumirMes(
    gastos.filter((g) => g.fecha.slice(0, 10) <= tope),
    clave
  );
}

/** Total por mes de los meses pedidos (los meses sin gastos dan 0). */
export function totalesPorMes(gastos: GastoSimple[], meses: { clave: string }[]): { clave: string; total: number }[] {
  return meses.map((m) => ({ clave: m.clave, total: resumirMes(gastos, m.clave).total }));
}

/** Cambio porcentual frente al mes anterior; null si no hay con qué comparar (el mes anterior no tuvo gastos). */
export function variacionPorcentual(actual: number, anterior: number): number | null {
  if (!(anterior > 0)) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

/** Parte de cada fila sobre el total, en % enteros (0 si el total es 0). */
export function porcentajeDe(valor: number, total: number): number {
  return total > 0 ? Math.round((valor / total) * 100) : 0;
}

export async function listarGastosDeRango(supabase: SupabaseClient, coupleId: string, desdeClave: string, hastaClaveExclusiva: string): Promise<GastoSimple[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('fecha, monto, category_id, registrado_por')
    .eq('couple_id', coupleId)
    .is('moneda', null)
    .gte('fecha', `${desdeClave}-01`)
    .lt('fecha', `${hastaClaveExclusiva}-01`)
    .order('fecha', { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data ?? []).map((g) => ({
    fecha: g.fecha as string,
    monto: Number(g.monto),
    categoriaId: g.category_id as string,
    registradoPor: g.registrado_por as string,
  }));
}
