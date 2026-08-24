'use client';

// Pantalla NOSOTROS — protagonista: la racha de días conectados (inversión del loop de
// retención, ESTADO.md) + vista previa honesta del catálogo de dinámicas. Los ítems sin
// función real llevan "Próximamente" (regla UX 11: nada tapable sin acción, o se marca así).

import { motion } from 'motion/react';
import { Flame, Sparkles, MessageCircleHeart, Utensils, Lock } from 'lucide-react';
import { PAREJA, RACHA } from '@/lib/seed-datos';

const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const DINAMICAS = [
  { titulo: 'Cena a ciegas', detalle: 'Elige el menú de esta semana sin que tu pareja sepa qué es', icon: Utensils },
  { titulo: '5 preguntas rápidas', detalle: 'Una ronda corta para conocerse un poco más cada día', icon: MessageCircleHeart },
];

export default function NosotrosPage() {
  // Últimos 28 días, hoy primero — se muestran en 4 filas de 7 (semanas), más reciente arriba.
  const semanas: boolean[][] = [];
  for (let i = 0; i < 4; i++) {
    semanas.push(RACHA.historial.slice(i * 7, i * 7 + 7));
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[24px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Nosotros</h1>

      <div className="rounded-[var(--radius-card)] bg-[var(--accent-2)] p-5 text-[var(--bg)]">
        <div className="flex items-center gap-2">
          <Flame size={22} strokeWidth={2.4} aria-hidden="true" />
          <p className="text-[28px] font-bold tabular-nums [font-family:var(--font-display)]">{RACHA.dias} días</p>
        </div>
        <p className="mt-1 text-[14px] opacity-85">
          {PAREJA.nombres.m} y {PAREJA.nombres.s} han respondido su pregunta diaria sin cortar la racha.
        </p>

        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.04em] opacity-70">
            {DIAS_SEMANA.map((d, i) => (
              <span key={i} className="w-6 text-center">
                {d}
              </span>
            ))}
          </div>
          {semanas.map((semana, i) => (
            <div key={i} className="flex justify-between">
              {semana.map((activo, j) => (
                <span
                  key={j}
                  className={`flex size-6 items-center justify-center rounded-[8px] ${
                    activo ? 'bg-[var(--bg)]' : 'bg-[color-mix(in_oklab,var(--bg)_15%,transparent)]'
                  }`}
                  aria-label={activo ? 'Día conectado' : 'Día sin registrar'}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={16} strokeWidth={2.2} color="var(--accent)" aria-hidden="true" />
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Catálogo de dinámicas</h2>
        </div>
        <div className="flex flex-col gap-2.5">
          {DINAMICAS.map((d) => (
            <motion.div
              key={d.titulo}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4 opacity-80 [touch-action:manipulation]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
                <d.icon size={18} strokeWidth={2} color="var(--accent)" aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-[14px] font-semibold text-[var(--text-primary)]">{d.titulo}</span>
                <span className="block text-[12px] text-[var(--text-tertiary)]">{d.detalle}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)] px-2 py-1 text-[11px] font-semibold text-[var(--text-tertiary)]">
                <Lock size={11} strokeWidth={2.2} aria-hidden="true" />
                Próximamente
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
