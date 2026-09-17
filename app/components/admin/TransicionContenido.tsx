'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';

// Cross-fade al cambiar de pestaña dentro de /admin — antes el salto entre Resumen/Ventas/
// Usuarios/Uso/Salud era seco mientras las cards de cada pantalla sí animaban con cuidado.
export function TransicionContenido({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reducido = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reducido ? { opacity: 0 } : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducido ? 0.1 : 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
