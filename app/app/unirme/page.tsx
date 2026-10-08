'use client';

// Destino del enlace de invitación que se manda por WhatsApp:
//   /unirme?t=<clave larga>&codigo=1234
// Con la clave larga (t) la persona invitada entra AL INSTANTE, sin correo: se le crea una cuenta de invitado
// (sign-in anónimo) y se une a la pareja. La clave es imposible de adivinar, así que no depende de los 4 dígitos.
// Si prefiere (o si el enlace no trae la clave) puede unirse con su correo y el código de 4 dígitos.
// NO pasa por el onboarding ni por el paywall: la pareja ya existe y la suscripción es de la pareja.

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Users, Loader2 } from 'lucide-react';
import { FunnelShell, CtaFijo } from '@/components/onboarding/ui';
import { crearClienteNavegador } from '@/lib/supabase/client';

const MENSAJES: Record<string, string> = {
  TOKEN_INVALIDO: 'Esta invitación no es válida, o tu pareja todavía no termina de crear su cuenta. Pídele que te la envíe otra vez en un momento.',
  PAREJA_COMPLETA: 'Esta pareja ya tiene sus dos integrantes. Si crees que es un error, pídele a tu pareja que revise.',
  YA_TIENES_PAREJA: 'Este navegador ya tiene una cuenta con su propia pareja y datos, así que no puede unirse a otra. Ábrela en otro navegador o usa tu correo.',
};

function UnirmeInner() {
  const params = useSearchParams();
  const token = (params.get('t') ?? '').toLowerCase();
  const conClave = /^[0-9a-f]{32}$/.test(token);
  const [codigo, setCodigo] = useState((params.get('codigo') ?? '').replace(/\D/g, '').slice(0, 4));
  const [conCorreo, setConCorreo] = useState(!conClave);
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completo = codigo.length === 4;

  const entrarAhora = async () => {
    if (entrando) return;
    setEntrando(true);
    setError(null);
    const supabase = crearClienteNavegador();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const { error: errorInvitado } = await supabase.auth.signInAnonymously();
      if (errorInvitado) {
        setError('No pudimos dejarte entrar sin correo en este momento. Puedes unirte con tu correo, aquí abajo.');
        setConCorreo(true);
        setEntrando(false);
        return;
      }
    }
    const { error: errorUnirse } = await supabase.rpc('unirse_con_token', { p_token: token });
    if (errorUnirse) {
      const clave = Object.keys(MENSAJES).find((k) => (errorUnirse.message ?? '').includes(k));
      setError(clave ? MENSAJES[clave] : 'No pudimos unirte a tu pareja. Intenta de nuevo en un momento.');
      setEntrando(false);
      return;
    }
    // Navegación completa: la sesión nueva tiene que llegar al servidor en la siguiente página.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/app/hoy';
  };

  return (
    <FunnelShell>
      <div className="flex h-11 items-center">
        <Link href="/" className="flex items-center gap-2 text-[16px] font-semibold text-[var(--accent)]">
          <Image src="/logo-fairsy.png" alt="" width={233} height={128} className="h-6 w-auto" />
          Fairsy
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-1 flex-col"
      >
        <div className="flex flex-1 flex-col justify-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
            <Users size={28} strokeWidth={1.8} color="var(--accent)" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-balance text-[32px] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Te invitaron a Fairsy
          </h1>
          <p className="mt-2 text-[16px] leading-relaxed text-[var(--text-secondary)]">
            Tu pareja ya armó su espacio para llevar las cuentas juntos.{' '}
            {conClave ? 'Toca el botón y entras al instante: no tienes que pagar, ni escribir un correo, ni responder preguntas.' : 'Con este código te unes: no tienes que pagar ni responder preguntas.'}
          </p>

          {error && (
            <p role="alert" className="mt-4 rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] p-3 text-[14px] text-[var(--danger)]">
              {error}
            </p>
          )}

          {conCorreo && (
            <>
              <label htmlFor="codigo-pareja" className="mt-8 text-[13px] font-medium text-[var(--text-secondary)]">
                Código de pareja
              </label>
              <input
                id="codigo-pareja"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="mt-1.5 h-16 w-full rounded-[var(--radius-button)] border-2 border-[var(--accent)] bg-[var(--surface)] px-4 text-center text-[32px] font-bold tabular-nums tracking-[0.3em] text-[var(--text-primary)] outline-none [font-family:var(--font-display)]"
              />
            </>
          )}
        </div>

        <div className="mt-auto pt-8">
          {conClave && !conCorreo ? (
            <>
              <CtaFijo onClick={entrarAhora} disabled={entrando}>
                {entrando ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />
                    Entrando…
                  </span>
                ) : (
                  'Entrar ahora'
                )}
              </CtaFijo>
              <button
                type="button"
                onClick={() => setConCorreo(true)}
                className="mt-3 w-full text-center text-[13px] font-medium text-[var(--text-secondary)] underline underline-offset-2 [touch-action:manipulation]"
              >
                Prefiero unirme con mi correo
              </button>
            </>
          ) : (
            <>
              <CtaFijo href={`/login?plan=free&modo=unirse&codigo=${encodeURIComponent(codigo)}`} disabled={!completo}>
                Unirme con mi correo
              </CtaFijo>
              <p className="mt-3 text-center text-[12px] text-[var(--text-secondary)]">Te enviamos un código de 8 números a tu correo; lo escribes y listo.</p>
              {conClave && (
                <button
                  type="button"
                  onClick={() => setConCorreo(false)}
                  className="mt-2 w-full text-center text-[13px] font-medium text-[var(--accent)] [touch-action:manipulation]"
                >
                  Mejor entrar ahora, sin correo
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </FunnelShell>
  );
}

export default function UnirmePage() {
  return (
    <Suspense fallback={null}>
      <UnirmeInner />
    </Suspense>
  );
}
