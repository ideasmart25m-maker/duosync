'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';

const DESTINOS = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/ventas', label: 'Ventas' },
  { href: '/admin/negocio', label: 'Negocio' },
  { href: '/admin/usuarios', label: 'Usuarios' },
  { href: '/admin/uso', label: 'Uso' },
  { href: '/admin/costo-ia', label: 'Costo de IA' },
  { href: '/admin/salud', label: 'Salud' },
];

// Cliente (necesita `usePathname()`) para marcar la pestaña activa — antes las 5 pestañas se
// veían exactamente iguales sin importar en cuál estuviera parado el dueño (defecto real
// detectado por el revisor-visual).
export function NavAdmin() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {DESTINOS.map((d) => {
        const activo = pathname === d.href;
        return (
          <motion.div key={d.href} whileTap={{ scale: 0.96 }} className="shrink-0">
            <Link
              href={d.href}
              aria-current={activo ? 'page' : undefined}
              className={`block rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 [touch-action:manipulation] ${
                activo
                  ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent)]'
                  : 'border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              }`}
            >
              {d.label}
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}
