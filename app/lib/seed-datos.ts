// Datos semilla de la app interna — MISMA pareja (Mateo & Sofía) y MISMOS números que
// HeroVisual.tsx en la landing, para que la demo se sienta consistente en todo el producto
// (32-DEL-MVP-AL-PRODUCTO: "la app nunca se enseña vacía"). Reemplazar por datos reales de
// Supabase en la Sesión 6 — hoy es estado local, sin backend.

import type { LucideIcon } from 'lucide-react';
import { Home, Receipt, ShoppingCart, Car, Popcorn } from 'lucide-react';

export interface Categoria {
  id: string;
  nombre: string;
  icono: LucideIcon;
  color: 'accent' | 'accent-2';
}

export interface Gasto {
  id: string;
  categoriaId: string;
  monto: number;
  fecha: string; // ISO
  registradoPor: 'M' | 'S';
  nota?: string;
}

export const PAREJA = {
  nombres: { m: 'Mateo', s: 'Sofía' } as const,
  diasRacha: 12,
  planGratis: false, // demo en plan Premium — el plan gratis con límite de 15 mov/mes se maqueta cuando haya backend real (Sesión 6)
};

// Regla de color por categoría (antes era una alternancia sin criterio — defecto real
// detectado por el revisor-visual): accent-2 (verde azulado, calmo) = gasto FIJO/recurrente
// del hogar, el mismo cada mes; accent (coral, cálido) = gasto VARIABLE/discrecional, el que
// más conviene vigilar. La regla es visual: de un vistazo, coral = "esto varía mes a mes".
export const CATEGORIAS: Categoria[] = [
  { id: 'arriendo', nombre: 'Arriendo', icono: Home, color: 'accent-2' }, // fijo
  { id: 'servicios', nombre: 'Servicios', icono: Receipt, color: 'accent-2' }, // fijo
  { id: 'mercado', nombre: 'Mercado', icono: ShoppingCart, color: 'accent' }, // variable
  { id: 'transporte', nombre: 'Transporte', icono: Car, color: 'accent' }, // variable
  { id: 'ocio', nombre: 'Ocio', icono: Popcorn, color: 'accent' }, // variable
];

// Mes vigente de la demo: agosto 2026 — coincide con currentDate del sistema.
export const GASTOS: Gasto[] = [
  { id: 'g1', categoriaId: 'arriendo', monto: 1200000, fecha: '2026-08-01', registradoPor: 'M' },
  { id: 'g2', categoriaId: 'servicios', monto: 185000, fecha: '2026-08-03', registradoPor: 'S' },
  { id: 'g3', categoriaId: 'mercado', monto: 240000, fecha: '2026-08-05', registradoPor: 'S', nota: 'Mercado de la quincena' },
  { id: 'g4', categoriaId: 'transporte', monto: 96000, fecha: '2026-08-07', registradoPor: 'M' },
  { id: 'g5', categoriaId: 'mercado', monto: 178000, fecha: '2026-08-10', registradoPor: 'M' },
  { id: 'g6', categoriaId: 'ocio', monto: 85000, fecha: '2026-08-12', registradoPor: 'S', nota: 'Cine + comida' },
  { id: 'g7', categoriaId: 'servicios', monto: 62000, fecha: '2026-08-14', registradoPor: 'S' },
  { id: 'g8', categoriaId: 'mercado', monto: 94000, fecha: '2026-08-15', registradoPor: 'M' },
];

export const SALDO_MES = GASTOS.reduce((acc, g) => acc + g.monto, 0); // 2.140.000 — igual al HeroVisual

export const META_AHORRO = {
  nombre: 'Viaje a Cartagena',
  montoObjetivo: 4000000,
  montoActual: 1240000, // 31% — igual al HeroVisual
  fechaObjetivo: '2026-12-15',
};

export const PREGUNTA_HOY = {
  texto: '¿Qué gasto del mes pasado volverían a hacer sin dudarlo?',
  respuestaM: 'La cena de aniversario — valió cada peso.',
  respuestaS: null as string | null, // Sofía todavía no responde — bloquea revelar la de Mateo (mecánica de conexión)
};

export const RACHA = {
  dias: 12,
  historial: [true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // últimos 28 días, hoy=index0
};

export function formatoCOP(n: number): string {
  return `$${n.toLocaleString('es-CO')}`;
}

export function categoriaPorId(id: string): Categoria {
  const c = CATEGORIAS.find((c) => c.id === id);
  if (!c) throw new Error(`Categoría desconocida: ${id}`);
  return c;
}
