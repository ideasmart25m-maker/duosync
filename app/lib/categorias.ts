// Categorías reales (tabla `categories` de Supabase) — reemplaza a CATEGORIAS de seed-datos.ts
// en las pantallas ya conectadas. El nombre del ícono y la clave de color (texto) vienen de la
// base de datos porque las categorías son personalizables por pareja; este mapa los traduce al
// componente de Lucide y a la variable CSS correspondiente.

import type { LucideIcon } from 'lucide-react';
import { Home, Receipt, ShoppingCart, Car, Popcorn, Zap, Utensils, Film, Circle } from 'lucide-react';

export type ColorCategoria = 'teal' | 'coral' | 'amber' | 'rose' | 'blue' | 'violet' | 'gray';

export interface CategoriaDB {
  id: string;
  nombre: string;
  icono: string;
  color: ColorCategoria;
  splitPercent: number; // % del gasto que le corresponde a quien lo REGISTRA (el resto, a su pareja)
  esRecurrente: boolean;
  diasVencimiento: number[] | null; // días 1-31, uno por cada factura de la categoría (solo si esRecurrente)
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

// La variable CSS `--cat-*` correspondiente (tokens.css) — un color propio por categoría en
// vez de alternar entre 2, para que se distingan de un vistazo (razón funcional real).
export function colorDeCategoria(color: string): string {
  const validos: ColorCategoria[] = ['teal', 'coral', 'amber', 'rose', 'blue', 'violet', 'gray'];
  const clave = (validos as string[]).includes(color) ? color : 'gray';
  return `var(--cat-${clave})`;
}
