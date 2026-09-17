'use client';

import { CheckCircle2, AlertTriangle, XCircle, type LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export type EstadoDiagnostico = 'bien' | 'atencion' | 'mal';

export interface ItemDiagnostico {
  estado: EstadoDiagnostico;
  texto: string;
}

const ICONO: Record<EstadoDiagnostico, LucideIcon> = { bien: CheckCircle2, atencion: AlertTriangle, mal: XCircle };
// Color + ícono juntos, nunca solo color (daltonismo — 17-VISUALIZACION-DATOS.md).
const COLOR: Record<EstadoDiagnostico, string> = { bien: 'var(--accent-2)', atencion: 'var(--cat-amber)', mal: 'var(--danger)' };

// "Qué está bien / qué está mal" por sección — pedido explícito del usuario para que el panel
// diga en una línea, sin que él tenga que interpretar números, cómo va cada área.
export function DiagnosticoSeccion({ items }: { items: ItemDiagnostico[] }) {
  const reducido = useReducedMotion();
  if (items.length === 0) return null;

  return (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      className="flex flex-col gap-1.5"
    >
      {items.map((item, i) => {
        const Icono = ICONO[item.estado];
        const color = COLOR[item.estado];
        return (
          <motion.li
            key={i}
            variants={{
              hidden: reducido ? { opacity: 0 } : { opacity: 0, x: -6 },
              show: { opacity: 1, x: 0, transition: { duration: reducido ? 0.1 : 0.25, ease: [0.16, 1, 0.3, 1] } },
            }}
            className="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]"
          >
            <Icono size={15} strokeWidth={2.2} color={color} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{item.texto}</span>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
