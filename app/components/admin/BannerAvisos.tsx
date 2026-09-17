'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { Plug, Wallet, Bug, CheckCircle2, ArrowRight, type LucideIcon } from 'lucide-react';
import type { AvisoAdmin, IconoAviso } from '@/lib/admin-datos';

const ICONOS: Record<IconoAviso, LucideIcon> = { plug: Plug, wallet: Wallet, bug: Bug, check: CheckCircle2 };
// Color semántico por tipo de aviso — nunca un emoji como ícono (prohibido por el sistema de
// diseño, defecto real detectado por el revisor-visual).
const COLORES: Record<IconoAviso, string> = { plug: 'var(--danger)', wallet: 'var(--cat-amber)', bug: 'var(--danger)', check: 'var(--accent-2)' };

export function BannerAvisos({ avisos }: { avisos: AvisoAdmin[] }) {
  const reducido = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="flex flex-col gap-2"
    >
      {avisos.map((a, i) => {
        const Icono = ICONOS[a.icono];
        const color = COLORES[a.icono];
        return (
          <motion.div
            key={i}
            variants={{
              hidden: reducido ? { opacity: 0 } : { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { duration: reducido ? 0.15 : 0.3, ease: [0.16, 1, 0.3, 1] } },
            }}
            className="flex items-start gap-3 rounded-[var(--radius-card)] border p-4"
            style={{ borderColor: `color-mix(in oklab, ${color} 30%, transparent)`, backgroundColor: `color-mix(in oklab, ${color} 6%, var(--surface))` }}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)` }}>
              <Icono size={16} strokeWidth={2.2} color={color} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">{a.titulo}</p>
              <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{a.detalle}</p>
              {a.accion && (
                <Link
                  href={a.accion.href}
                  className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold [touch-action:manipulation]"
                  style={{ color }}
                >
                  {a.accion.texto}
                  <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
                </Link>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
