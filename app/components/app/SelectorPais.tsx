'use client';

// Selector de país/moneda — aparece UNA vez, fuera del embudo de venta ya aprobado (onboarding/
// paywall son pantallas "cosa juzgada", no se tocan). Se pregunta apenas la pareja entra por
// primera vez a la app real; después de elegir, no se vuelve a mostrar (queda en `couples.pais`).

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Globe2 } from 'lucide-react';
import { PAISES } from '@/lib/paises';

export function SelectorPais({ guardando, onElegir }: { guardando: boolean; onElegir: (codigo: string) => void }) {
  const [busqueda, setBusqueda] = useState('');

  const paisesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return PAISES;
    return PAISES.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [busqueda]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_oklab,black_45%,transparent)] sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex max-h-[80dvh] w-full max-w-md flex-col rounded-t-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-2)] sm:rounded-[var(--radius-card)]"
      >
        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
          <Globe2 size={20} strokeWidth={2} color="var(--accent)" aria-hidden="true" />
        </span>
        <h2 className="text-[20px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">¿Desde qué país nos escriben?</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          Así les mostramos sus montos en su propia moneda. Solo se pregunta una vez.
        </p>

        <div className="mt-4 flex h-12 items-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4">
          <Search size={16} strokeWidth={2} color="var(--text-tertiary)" aria-hidden="true" />
          <input
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar país…"
            className="flex-1 bg-transparent text-[15px] text-[var(--text-primary)] outline-none"
          />
        </div>

        <ul className="mt-3 flex-1 overflow-y-auto">
          {paisesFiltrados.map((p) => (
            <li key={p.codigo}>
              <button
                type="button"
                disabled={guardando}
                onClick={() => onElegir(p.codigo)}
                className="flex h-12 w-full items-center justify-between rounded-[var(--radius-button)] px-3 text-left text-[15px] text-[var(--text-primary)] [touch-action:manipulation] disabled:opacity-50 hover:bg-[var(--surface-2)]"
              >
                {p.nombre}
                <span className="text-[12px] text-[var(--text-tertiary)]">{p.moneda}</span>
              </button>
            </li>
          ))}
          {paisesFiltrados.length === 0 && (
            <li className="py-6 text-center text-[13px] text-[var(--text-tertiary)]">No encontramos ese país.</li>
          )}
        </ul>
      </motion.div>
    </div>
  );
}
