'use client';

// Vista previa del producto para el Hero — construida con el mismo sistema de
// diseño de FICHA-ARTE.md (no es un screenshot real todavía, es la UI aprobada
// en Sesión 2, renderizada con datos semilla). Reemplazar por un screenshot real
// de app/(app)/hoy cuando exista (Sesión 5) — pendiente anotado en ESTADO.md.
// Cero emojis como íconos (Lucide) + baseline de movimiento: conteo animado del
// saldo + barras que crecen al entrar en viewport (14-LEYES-DE-DISENO).

import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import { Apple, Flame, Home, Sprout, TreeDeciduous } from 'lucide-react';

function useCountUp(target: number, activo: boolean, reducido: boolean): number {
  const [valor, setValor] = useState(reducido ? target : 0);
  useEffect(() => {
    if (!activo) return;
    if (reducido) {
      setValor(target);
      return;
    }
    const controls = animate(0, target, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValor(Math.round(v)),
    });
    return () => controls.stop();
  }, [activo, target, reducido]);
  return valor;
}

function formatoCLP(n: number): string {
  return `$${n.toLocaleString('es-CO')}`;
}

export function HeroVisual() {
  const ref = useRef<HTMLDivElement | null>(null);
  const enVista = useInView(ref, { once: true, amount: 0.5 });
  const reducido = useReducedMotion() ?? false;
  const saldo = useCountUp(2140000, enVista, reducido);

  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-card)] bg-[var(--surface-2)] px-6 py-8 sm:px-10"
    >
      <div className="mx-auto flex h-full max-w-72 flex-col justify-center rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-2)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <span className="flex size-7 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--accent-2)] text-[12px] font-bold text-[var(--bg)]">
                M
              </span>
              <span className="flex size-7 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--accent)] text-[12px] font-bold text-[var(--bg)]">
                S
              </span>
            </div>
            <span className="text-[12px] font-semibold text-[var(--text-primary)]">Mateo &amp; Sofía</span>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-[var(--accent)] px-2 py-1 text-[12px] font-bold text-[var(--bg)]">
            <Flame size={11} strokeWidth={2.5} aria-hidden="true" />
            12 días
          </span>
        </div>

        <div className="mb-3 rounded-[var(--radius-button)] bg-[var(--accent-2)] p-4 text-[var(--bg)]">
          <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.08em] opacity-80">Pregunta de hoy</p>
          <p className="text-[16px] font-bold leading-snug [font-family:var(--font-display)]">
            ¿Qué gasto del mes pasado volverían a hacer sin dudarlo?
          </p>
        </div>

        <div className="mb-3 flex items-baseline justify-between rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-3 py-3">
          <div>
            <p className="text-[12px] text-[var(--text-tertiary)]">Este mes</p>
            <p className="text-[16px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
              {formatoCLP(saldo)}
            </p>
          </div>
          <p className="text-[12px] font-bold text-[var(--accent)]">64% de la meta</p>
        </div>

        <div className="space-y-2">
          <div className="rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] px-3 py-2">
            <div className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-[var(--text-primary)]">
              <span className="flex items-center gap-1.5">
                <Home size={12} strokeWidth={2.2} color="var(--text-secondary)" aria-hidden="true" />
                Arriendo
              </span>
              <span className="tabular-nums">$1.200.000</span>
            </div>
            <div className="h-1 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)]">
              <motion.div
                className="h-full rounded-full bg-[var(--accent-2)]"
                initial={{ width: reducido ? '100%' : 0 }}
                animate={enVista ? { width: '100%' } : undefined}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
          <div className="rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[color-mix(in_oklab,var(--accent-2)_5%,var(--surface))] px-3 py-3">
            <div className="mb-3 flex items-center justify-between text-[12px] font-semibold text-[var(--text-primary)]">
              <span>Meta: Viaje a Cartagena</span>
              <span className="tabular-nums text-[var(--accent)]">31%</span>
            </div>

            {/* La semilla que siembran hoy se vuelve el árbol de su meta cumplida */}
            <div className="relative flex h-6 items-center justify-between">
              <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)]" />
              <motion.div
                className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-[var(--accent)]"
                initial={{ width: reducido ? '31%' : 0 }}
                animate={enVista ? { width: '31%' } : undefined}
                transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              />
              <span className="relative z-10 flex size-6 items-center justify-center rounded-full bg-[var(--accent)]">
                <Sprout size={12} strokeWidth={2.4} color="var(--bg)" aria-hidden="true" />
              </span>
              <span className="relative z-10 flex size-6 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] opacity-60">
                <TreeDeciduous size={12} strokeWidth={2.2} color="var(--text-tertiary)" aria-hidden="true" />
              </span>
              <span className="relative z-10 flex size-6 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] opacity-60">
                <TreeDeciduous size={12} strokeWidth={2.2} color="var(--text-tertiary)" aria-hidden="true" />
              </span>
              <span className="relative z-10 flex size-6 items-center justify-center rounded-full bg-[var(--accent-2)]">
                <TreeDeciduous size={12} strokeWidth={2.4} color="var(--bg)" aria-hidden="true" />
                <Apple
                  size={8}
                  strokeWidth={2.5}
                  color="var(--bg)"
                  className="absolute -right-0.5 -top-0.5"
                  aria-hidden="true"
                />
              </span>
            </div>
            <div className="mt-1.5 flex justify-between text-[12px] text-[var(--text-tertiary)]">
              <span>Hoy siembran</span>
              <span>Su meta, cumplida</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
