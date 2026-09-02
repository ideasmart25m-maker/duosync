'use client';

// UI compartida del funnel (onboarding + paywall + login) — blueprint 50-DISENO-ONBOARDING-PAYWALL.md
// Márgenes laterales de TODO el funnel: 16px (contenido útil = 343px a 375px de viewport).
// Usa los mismos tokens de FICHA-ARTE.md que la landing (--accent = coral = CTA/selección,
// --accent-2 = verde azulado = estructura/dato secundario).

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, X, Check } from 'lucide-react';

export function FunnelHeader({
  onBack,
  progreso,
  appName = 'DuoSync Wallet',
  contador,
  salida = true,
}: {
  onBack?: () => void;
  /** 0-100. undefined = sin barra (pantallas sin quiz: loading, paywall, login). */
  progreso?: number;
  appName?: string;
  /** "Pregunta 1 de 5" — para reconocer cuántas faltan sin calcular el %. */
  contador?: string;
  /** Mostrar la "X" de salida — INDEPENDIENTE de `progreso` (defecto real: antes solo
      aparecía durante el quiz de 5 preguntas; los pasos 6-8 quedaban sin forma de salir). */
  salida?: boolean;
}) {
  const reducido = useReducedMotion();
  return (
    <div className="flex h-11 items-center gap-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Atrás"
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] [touch-action:manipulation]"
        >
          <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
      ) : (
        <Link href="/" className="flex size-11 shrink-0 items-center justify-center">
          <Image src="/logo-duosync.png" alt="DuoSync Wallet" width={233} height={128} className="h-6 w-auto" />
        </Link>
      )}
      {progreso !== undefined ? (
        <div className="flex flex-1 items-center gap-3">
          <div className="h-0.5 flex-1 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)]">
            <motion.div
              className="h-full rounded-full bg-[var(--accent)]"
              initial={false}
              animate={{ width: `${progreso}%` }}
              transition={{ duration: reducido ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="whitespace-nowrap text-[12px] tabular-nums text-[var(--text-tertiary)]">
            {contador ? `${contador} · ` : ''}
            {Math.round(progreso)}%
          </span>
        </div>
      ) : (
        <span className="text-[12px] font-semibold text-[var(--text-primary)]">{appName}</span>
      )}
      {salida && (
        // Salida persistente en TODO el funnel, no solo durante el quiz de 5 preguntas
        // (defecto real detectado por el revisor-visual: los pasos 6-8 quedaban sin salida).
        <Link
          href="/"
          aria-label="Salir"
          className="flex size-11 shrink-0 items-center justify-center text-[var(--text-tertiary)] [touch-action:manipulation]"
        >
          <X size={18} strokeWidth={2.2} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function FunnelShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--bg)] px-4 pb-4 pt-2 [font-family:var(--font-body)]">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-md flex-col">{children}</div>
    </div>
  );
}

const variantesPaso = {
  entra: { opacity: 0, x: 40 },
  centro: { opacity: 1, x: 0 },
  sale: { opacity: 0, x: -24 },
};

export function PasoTransition({ children, stepKey }: { children: ReactNode; stepKey: string | number }) {
  const reducido = useReducedMotion();
  return (
    <motion.div
      key={stepKey}
      initial={reducido ? { opacity: 0 } : variantesPaso.entra}
      animate={reducido ? { opacity: 1 } : variantesPaso.centro}
      exit={reducido ? { opacity: 0 } : variantesPaso.sale}
      transition={{ duration: reducido ? 0.2 : 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}

export function PreguntaTitulo({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mt-8 mb-8">
      <h1 className="text-balance text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-[var(--text-primary)] [font-family:var(--font-display)]">
        {children}
      </h1>
      {sub && <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">{sub}</p>}
    </div>
  );
}

export function Chip({
  label,
  seleccionado,
  onClick,
  icon: Icono,
}: {
  label: string;
  seleccionado: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-pressed={seleccionado}
      className={`flex h-14 w-full items-center gap-3 rounded-[var(--radius-button)] border px-4 text-left text-[16px] font-medium shadow-[var(--shadow-chip)] transition-colors duration-150 [touch-action:manipulation] ${
        seleccionado
          ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,var(--surface))] text-[var(--text-primary)]'
          : 'border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] text-[var(--text-primary)]'
      }`}
    >
      {Icono && <Icono size={20} strokeWidth={2} color={seleccionado ? 'var(--accent)' : 'var(--text-secondary)'} />}
      <span className="flex-1">{label}</span>
      {seleccionado && (
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]"
        >
          <Check size={12} strokeWidth={3} color="var(--bg)" aria-hidden="true" />
        </motion.span>
      )}
    </motion.button>
  );
}

export function CtaFijo({
  children,
  onClick,
  href,
  disabled,
  variante = 'primario',
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variante?: 'primario' | 'secundario';
}) {
  const claseBase =
    'flex h-14 w-full items-center justify-center rounded-[var(--radius-button)] text-[16px] font-semibold [touch-action:manipulation] transition-opacity duration-150';
  const clase =
    variante === 'primario'
      ? `${claseBase} bg-[var(--accent)] text-[var(--bg)] shadow-[0_8px_24px_color-mix(in_oklab,var(--accent)_28%,transparent)] ${disabled ? 'opacity-50' : ''}`
      : `${claseBase} border border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] text-[var(--text-primary)]`;

  if (href && !disabled) {
    return (
      <motion.a whileTap={{ scale: 0.98 }} href={href} className={clase}>
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={clase}
    >
      {children}
    </motion.button>
  );
}

export function SalidaLimpia({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 flex h-11 w-full items-center justify-center text-[12px] font-medium text-[var(--text-tertiary)] [touch-action:manipulation]"
    >
      {children}
    </button>
  );
}
