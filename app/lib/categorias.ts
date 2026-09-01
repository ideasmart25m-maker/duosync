// Categorías reales (tabla `categories` de Supabase) — reemplaza a CATEGORIAS de seed-datos.ts
// en las pantallas ya conectadas. El nombre del ícono (texto) viene de la base de datos porque
// las categorías son personalizables por pareja; este mapa lo traduce al componente de Lucide.

import type { LucideIcon } from 'lucide-react';
import { Home, Receipt, ShoppingCart, Car, Popcorn, Circle } from 'lucide-react';

export interface CategoriaDB {
  id: string;
  nombre: string;
  icono: string;
  color: 'accent' | 'accent-2';
}

const ICONOS: Record<string, LucideIcon> = {
  home: Home,
  receipt: Receipt,
  'shopping-cart': ShoppingCart,
  car: Car,
  popcorn: Popcorn,
};

export function iconoDeCategoria(nombreIcono: string): LucideIcon {
  return ICONOS[nombreIcono] ?? Circle;
}
