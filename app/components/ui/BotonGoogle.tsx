'use client';

// "Continuar con Google": un toque, sin códigos. El botón solo aparece cuando el ingreso con Google ya está
// configurado en Supabase y activado en Vercel (NEXT_PUBLIC_GOOGLE_LOGIN=1): así nunca se muestra un botón que no funcione.

import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export const GOOGLE_ACTIVO = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === '1';

// Logo oficial de Google (colores de marca; los exige Google en su botón de ingreso).
function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.3 0 11.8-2.1 15.7-5.7l-7.5-5.8c-2.1 1.4-4.8 2.3-8.2 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export function BotonGoogle({ onClick, cargando, children }: { onClick: () => void; cargando: boolean; children: ReactNode }) {
  if (!GOOGLE_ACTIVO) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={cargando}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] bg-[var(--surface)] text-[16px] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-1)] disabled:opacity-60 [touch-action:manipulation]"
    >
      {cargando ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : <GoogleG />}
      {children}
    </button>
  );
}
