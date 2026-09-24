// Categorías reales (tabla `categories` de Supabase) — reemplaza a CATEGORIAS de seed-datos.ts
// en las pantallas ya conectadas. El nombre del ícono y la clave de color (texto) vienen de la
// base de datos porque las categorías son personalizables por pareja; este mapa los traduce al
// componente de Lucide y a la variable CSS correspondiente.

import type { LucideIcon } from 'lucide-react';
import { Home, Receipt, ShoppingCart, Car, Popcorn, Zap, Utensils, Film, Circle } from 'lucide-react';
import {
  House,
  Receipt as ReceiptFill,
  ShoppingCart as ShoppingCartFill,
  Car as CarFill,
  Popcorn as PopcornFill,
  Lightning,
  ForkKnife,
  FilmSlate,
  Circle as CircleFill,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';

export type ColorCategoria = 'teal' | 'coral' | 'amber' | 'rose' | 'blue' | 'violet' | 'gray';

export interface CategoriaDB {
  id: string;
  nombre: string;
  icono: string;
  color: ColorCategoria;
  splitPercent: number; // % del gasto que le corresponde a quien lo REGISTRA (el resto, a su pareja)
  esRecurrente: boolean;
  diasVencimiento: number[] | null; // días 1-31, uno por cada factura de la categoría (solo si esRecurrente)
  montosMensuales: number[] | null; // valor a pagar cada mes, mismo orden que diasVencimiento
  pagaUserId: string | null; // quien paga siempre esta categoría; null = quien toque "Registrar pago"
  repartoUserId: string | null; // persona a la que pertenece splitPercent (null = datos viejos: quien registra)
}

const ICONOS: Record<string, LucideIcon> = {
  home: Home,
  receipt: Receipt,
  'shopping-cart': ShoppingCart,
  car: Car,
  popcorn: Popcorn,
  zap: Zap,
  utensils: Utensils,
  film: Film,
};

export function iconoDeCategoria(nombreIcono: string): LucideIcon {
  return ICONOS[nombreIcono] ?? Circle;
}

// Versión Phosphor (peso `fill`) del mismo ícono — SOLO para el estado "seleccionada" del
// selector de categoría (22-LIBRERIAS-Y-CRAFT.md: Phosphor fill para estados activos). El resto
// de la app sigue usando `iconoDeCategoria` (Lucide) sin cambios.
const ICONOS_FILL: Record<string, PhosphorIcon> = {
  home: House,
  receipt: ReceiptFill,
  'shopping-cart': ShoppingCartFill,
  car: CarFill,
  popcorn: PopcornFill,
  zap: Lightning,
  utensils: ForkKnife,
  film: FilmSlate,
};

export function iconoDeCategoriaFill(nombreIcono: string): PhosphorIcon {
  return ICONOS_FILL[nombreIcono] ?? CircleFill;
}

// La variable CSS `--cat-*` correspondiente (tokens.css) — un color propio por categoría en
// vez de alternar entre 2, para que se distingan de un vistazo (razón funcional real).
export function colorDeCategoria(color: string): string {
  const validos: ColorCategoria[] = ['teal', 'coral', 'amber', 'rose', 'blue', 'violet', 'gray'];
  const clave = (validos as string[]).includes(color) ? color : 'gray';
  return `var(--cat-${clave})`;
}

// Parte del gasto que le toca a QUIEN PAGÓ (lo que entiende el cálculo de saldos), a partir del
// reparto acordado por persona: el 60/40 se respeta sin importar quién ponga la plata ese día.
export function splitEfectivo(cat: Pick<CategoriaDB, 'splitPercent' | 'repartoUserId'> | undefined, pagadorId: string | null): number {
  const p = cat?.splitPercent ?? 50;
  if (!cat?.repartoUserId || !pagadorId) return p;
  return cat.repartoUserId === pagadorId ? p : 100 - p;
}
