'use client';

// Login de DuoSync — magic link (Supabase Auth), decidido en Sesión 1: sin contraseña que
// olvidar. La conexión real a Supabase se hace en Sesión 6; hoy es la experiencia completa de
// UI/UX con estado local (simula el envío y la pantalla de "revisa tu correo").
// El plan elegido en el paywall llega por ?plan= y se guarda para aplicarlo tras confirmar el
// correo (el registro NUNCA pide más que el email — 52, hallazgo del 70%).

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Mail, ArrowRight } from 'lucide-react';
import { FunnelShell, CtaFijo } from '@/components/onboarding/ui';

function LoginInner() {
  const params = useSearchParams();
  const plan = params.get('plan');
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);

  const esGratis = plan === 'free' || !plan;

  return (
    <FunnelShell>
      <div className="flex h-11 items-center">
        <a href="/" className="flex items-center gap-2 text-[16px] font-semibold text-[var(--text-primary)]">
          <span className="size-6 rounded-[8px] bg-[var(--accent-2)]" aria-hidden="true" />
          DuoSync
        </a>
      </div>

      {!enviado ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-1 flex-col"
        >
          <h1 className="text-balance text-[32px] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Guardemos su plan
          </h1>
          <p className="mt-2 text-[16px] leading-relaxed text-[var(--text-secondary)]">
            {esGratis
              ? 'Con su correo, sus cuentas quedan conectadas y listas cuando vuelvan.'
              : 'Con su correo activamos su plan y les avisamos antes de cada cobro.'}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <div className="flex h-14 items-center gap-3 rounded-[16px] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] px-4">
              <Mail size={20} strokeWidth={2} color="var(--text-secondary)" aria-hidden="true" />
              <input
                type="email"
                autoFocus
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="su@correo.com"
                className="flex-1 bg-transparent text-[16px] text-[var(--text-primary)] outline-none"
              />
            </div>
          </div>

          <div className="mt-auto pt-8">
            <CtaFijo disabled={!email.includes('@')} onClick={() => setEnviado(true)}>
              Enviarme el enlace mágico
            </CtaFijo>
            <p className="mt-3 text-center text-[12px] text-[var(--text-secondary)]">
              Sin contraseñas. Les enviamos un enlace para entrar directo, cada vez.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-1 flex-col items-center text-center"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
            <Mail size={28} strokeWidth={1.8} color="var(--accent)" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-balance text-[24px] font-bold leading-[1.2] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Revisen su correo
          </h1>
          <p className="mt-3 max-w-xs text-[16px] leading-relaxed text-[var(--text-secondary)]">
            Le enviamos un enlace a <span className="font-semibold text-[var(--text-primary)]">{email}</span>. Tóquenlo
            para entrar — no hace falta contraseña.
          </p>
          <button
            type="button"
            onClick={() => setEnviado(false)}
            className="mt-6 flex items-center gap-1 text-[12px] font-medium text-[var(--accent)]"
          >
            Usar otro correo
            <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </FunnelShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
