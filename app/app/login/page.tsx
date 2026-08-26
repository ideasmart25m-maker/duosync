'use client';

// Login de DuoSync — magic link real (Supabase Auth), decidido en Sesión 1: sin contraseña
// que olvidar. Conectado de verdad en la auditoría de Sesión 6 (antes simulaba el envío con
// estado local — hallazgo crítico: nada persistía). El plan, el modo de vinculación (crear
// pareja / unirse con código) y el código mismo viajan por la URL desde el onboarding y el
// paywall — recién aquí, al confirmar el correo, hay una sesión real para guardarlos.
// El registro NUNCA pide más que el email (52, hallazgo del 70%).

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { FunnelShell, CtaFijo } from '@/components/onboarding/ui';
import { crearClienteNavegador } from '@/lib/supabase/client';

function LoginInner() {
  const params = useSearchParams();
  const plan = params.get('plan');
  const modo = params.get('modo') ?? 'crear';
  const codigo = params.get('codigo') ?? '';
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esGratis = plan === 'free' || !plan;

  const enviarEnlace = async () => {
    if (enviando || !email.includes('@')) return;
    setEnviando(true);
    setError(null);

    const supabase = crearClienteNavegador();
    const siguiente = new URLSearchParams({ next: '/app/hoy', modo, codigo, plan: plan ?? 'free' });
    const { error: errorEnvio } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?${siguiente.toString()}` },
    });

    setEnviando(false);
    if (errorEnvio) {
      // Mensaje empático con qué pasó y qué hacer — nunca el error técnico crudo (42-UX-WRITING.md).
      setError('No pudimos enviar el enlace. Revisen el correo e intenten de nuevo en un momento.');
      return;
    }
    setEnviado(true);
  };

  return (
    <FunnelShell>
      <div className="flex h-11 items-center">
        <Link href="/" className="flex items-center gap-2 text-[16px] font-semibold text-[var(--accent)]">
          <Image src="/logo-duosync.png" alt="" width={233} height={128} className="h-6 w-auto" />
          DuoSync
        </Link>
      </div>

      {!enviado ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-1 flex-col"
        >
          {/* Bloque centrado en el espacio disponible arriba del CTA fijo — antes quedaba
              pegado arriba con ~45% del viewport en blanco antes del botón (mismo defecto
              real ya corregido en las pantallas del onboarding con este mismo patrón). */}
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="text-balance text-[32px] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)] [font-family:var(--font-display)]">
              Guardemos su plan
            </h1>
            <p className="mt-2 text-[16px] leading-relaxed text-[var(--text-secondary)]">
              {esGratis
                ? 'Con su correo, sus cuentas quedan conectadas y listas cuando vuelvan.'
                : 'Con su correo activamos su plan y les avisamos antes de cada cobro.'}
            </p>

            <form
              className="mt-8 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                enviarEnlace();
              }}
            >
              <div
                className={`flex h-14 items-center gap-3 rounded-[var(--radius-button)] border bg-[var(--surface)] px-4 ${
                  error ? 'border-[var(--danger)]' : 'border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]'
                }`}
              >
                <Mail size={20} strokeWidth={2} color="var(--text-secondary)" aria-hidden="true" />
                <input
                  type="email"
                  autoFocus
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="su@correo.com"
                  aria-invalid={!!error}
                  className="flex-1 bg-transparent text-[16px] text-[var(--text-primary)] outline-none"
                />
              </div>
              {error && <p className="text-[12px] font-medium text-[var(--danger)]">{error}</p>}
            </form>
          </div>

          <div className="mt-auto pt-8">
            <CtaFijo disabled={!email.includes('@') || enviando} onClick={enviarEnlace}>
              {enviando ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />
                  Enviando…
                </span>
              ) : (
                'Enviarme el enlace mágico'
              )}
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
