'use client';

// Recuadro desplegable "¿Qué encuentras aquí?" de cada pantalla. Abierto la primera vez que se entra a esa pantalla y
// plegado después (se puede volver a abrir cuando se quiera). Pedido de la encuesta a usuarios: varias personas no
// entendían para qué servía cada sección.

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';

export interface ItemGuia {
  titulo: string;
  texto: string;
}

export function GuiaPagina({
  id,
  items,
  titulo = '¿Qué encuentras aquí?',
  abrirPrimeraVez = true,
}: {
  id: string;
  items: ItemGuia[];
  titulo?: string;
  /** false en las pantallas donde abrirla taparía lo principal (Inicio): queda plegada desde el principio. */
  abrirPrimeraVez?: boolean;
}) {
  const clave = `fairsy-guia-${id}`;
  const reducido = useReducedMotion();
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(clave)) {
        if (abrirPrimeraVez) setAbierta(true);
        localStorage.setItem(clave, '1');
      }
    } catch {
      // sin almacenamiento: queda plegada
    }
  }, [clave, abrirPrimeraVez]);

  return (
    <div className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)]">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className="flex min-h-11 w-full items-center justify-between gap-2 px-4 text-left [touch-action:manipulation]"
      >
        <span className="text-[14px] font-semibold text-[var(--text-primary)]">{titulo}</span>
        <ChevronDown size={18} strokeWidth={2.2} className={`shrink-0 text-[var(--text-tertiary)] transition-transform ${abierta ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {abierta && (
          <motion.ul
            key="contenido"
            initial={reducido ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reducido ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-2.5 overflow-hidden px-4"
          >
            {items.map((it) => (
              <li key={it.titulo} className="text-[13px] leading-relaxed text-[var(--text-secondary)] first:pt-0.5 last:pb-4">
                <span className="font-semibold text-[var(--text-primary)]">{it.titulo}. </span>
                {it.texto}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
