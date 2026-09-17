'use client';

import { useId, useState } from 'react';
import { Info } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

// Ícono "i" junto a cada métrica que explica, en una frase, qué significa el número — el dueño
// de la app no tiene por qué saber de memoria qué es "retención D1" o "CAC" (pedido explícito
// del usuario: tooltips en cada métrica del panel).
export function InfoTooltip({ texto }: { texto: string }) {
  const [abierto, setAbierto] = useState(false);
  const reducido = useReducedMotion();
  const id = useId();

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-describedby={id}
        onMouseEnter={() => setAbierto(true)}
        onMouseLeave={() => setAbierto(false)}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onClick={() => setAbierto((v) => !v)}
        className="flex size-4 items-center justify-center rounded-full text-[var(--text-tertiary)] outline-none transition-colors duration-150 hover:text-[var(--accent)] focus-visible:text-[var(--accent)] [touch-action:manipulation]"
      >
        <Info size={13} strokeWidth={2.2} aria-hidden="true" />
        <span className="sr-only">Qué significa esta métrica</span>
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.span
            id={id}
            role="tooltip"
            initial={reducido ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducido ? { opacity: 0 } : { opacity: 0, y: 4 }}
            transition={{ duration: reducido ? 0.1 : 0.15 }}
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-48 -translate-x-1/2 rounded-[var(--radius-button)] bg-[var(--text-primary)] px-2.5 py-2 text-[11px] leading-snug text-[var(--bg)] shadow-[var(--shadow-2)]"
          >
            {texto}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
