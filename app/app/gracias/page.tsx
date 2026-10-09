'use client';

// Página a la que Hotmart devuelve a quien acaba de pagar (se configura en el producto como "página de
// agradecimiento"). Explica qué pasó y retoma la vinculación que se guardó antes de irse a pagar.

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Mail } from 'lucide-react';
import { FunnelShell, CtaFijo } from '@/components/onboarding/ui';
import { leerVinculacionPendiente } from '@/lib/hotmart/checkout';

export default function GraciasPage() {
  const destino = useMemo(() => {
    const v = typeof window === 'undefined' ? null : leerVinculacionPendiente();
    const p = new URLSearchParams({ plan: 'pro', modo: v?.modo ?? 'crear', codigo: v?.codigo ?? '', tk: v?.tk ?? '' });
    return `/login?${p.toString()}`;
  }, []);

  return (
    <FunnelShell>
      <div className="flex h-11 items-center">
        <Link href="/" className="flex items-center gap-2 text-[16px] font-semibold text-[var(--accent)]">
          <Image src="/logo-fairsy.png" alt="" width={233} height={128} className="h-6 w-auto" />
          Fairsy
        </Link>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col justify-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
            <CheckCircle2 size={30} strokeWidth={1.8} color="var(--accent)" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-balance text-[32px] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)] [font-family:var(--font-display)]">
            ¡Listo! Su prueba de 7 días ya empezó
          </h1>
          <p className="mt-2 text-[16px] leading-relaxed text-[var(--text-secondary)]">
            No se les cobra nada durante la prueba. Para entrar, usen <strong>el mismo correo con el que compraron</strong>.
          </p>

          <ol className="mt-6 flex flex-col gap-3 text-[15px] text-[var(--text-primary)]">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[12px] font-bold text-[var(--bg)]">1</span>
              Toquen el botón de abajo y escriban ese correo.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[12px] font-bold text-[var(--bg)]">2</span>
              Les llega un código de 8 números por correo: lo escriben y entran solos.
            </li>
          </ol>

          <p className="mt-6 flex items-start gap-2 rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3 text-[13px] text-[var(--text-secondary)]">
            <Mail size={16} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden="true" />
            También les llegó un correo de Hotmart con su compra. Si algo no les funciona, escriban a soporte@fairsy.lat.
          </p>
        </div>

        <div className="mt-auto pt-8">
          <CtaFijo href={destino}>Entrar a Fairsy</CtaFijo>
        </div>
      </div>
    </FunnelShell>
  );
}
