'use client';

// Destino del enlace de invitación que se manda por WhatsApp: /unirme?codigo=1234. La persona invitada
// NO pasa por el onboarding ni por el paywall (la pareja ya existe y la suscripción es de la pareja):
// ve a quién se une, confirma el código y sigue directo a entrar con su correo.

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Users } from 'lucide-react';
import { FunnelShell, CtaFijo } from '@/components/onboarding/ui';

function UnirmeInner() {
  const params = useSearchParams();
  const [codigo, setCodigo] = useState((params.get('codigo') ?? '').replace(/\D/g, '').slice(0, 4));
  const completo = codigo.length === 4;

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
            Tu pareja ya armó su espacio para llevar las cuentas juntos. Con este código te unes: no tienes que pagar ni responder preguntas.
          </p>

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
        </div>

        <div className="mt-auto pt-8">
          <CtaFijo href={`/login?plan=free&modo=unirse&codigo=${encodeURIComponent(codigo)}`} disabled={!completo}>
            Unirme con mi correo
          </CtaFijo>
          <p className="mt-3 text-center text-[12px] text-[var(--text-secondary)]">Sin contraseñas: te enviamos un enlace o un código a tu correo.</p>
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
