'use client';

// Aviso dentro de la app durante los 2 días de gracia: el plan ya venció pero todavía pueden entrar. Dice hasta cuándo
// y cómo renovar, para que no se enteren cuando la app ya esté bloqueada. No aparece si el plan está al día.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { urlCheckout } from '@/lib/hotmart/checkout';

function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function AvisoGracia() {
  const [hasta, setHasta] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const { data } = await crearClienteNavegador().rpc('estado_acceso');
      const fila = (data as { en_gracia: boolean; gracia_hasta: string | null }[] | null)?.[0];
      if (!cancelado && fila?.en_gracia && fila.gracia_hasta) setHasta(fila.gracia_hasta);
    })().catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  if (!hasta) return null;

  return (
    <div
      role="status"
      className="mb-4 rounded-[var(--radius-card)] border-2 border-[var(--cat-amber)] bg-[color-mix(in_oklab,var(--cat-amber)_10%,var(--surface))] p-4"
    >
      <p className="flex items-center gap-2 text-[15px] font-semibold text-[var(--text-primary)]">
        <Clock size={18} strokeWidth={2.2} color="var(--cat-amber)" aria-hidden="true" />
        Su plan venció
      </p>
      <p className="mt-1 text-[14px] leading-snug text-[var(--text-secondary)]">
        Pueden seguir usando Fairsy <span className="font-semibold text-[var(--text-primary)]">hasta el {fechaLarga(hasta)}</span>. Si no lo renuevan para
        entonces, la app queda en pausa (sus datos no se pierden).
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <a
          href={urlCheckout('anual')}
          className="flex min-h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[14px] font-semibold text-[var(--bg)] [touch-action:manipulation]"
        >
          Renovar mi plan
        </a>
        <Link href="/app/cuenta" className="flex min-h-11 items-center text-[14px] font-semibold text-[var(--accent-2)] underline underline-offset-4">
          Ya pagué con otro correo
        </Link>
      </div>
    </div>
  );
}
