'use client';

// Error Boundary global (convención de Next.js App Router) — cualquier error de render que
// llegue hasta aquí se registra en `error_log` para que el panel de administración lo muestre
// (21-BACKOFFICE.md), y el usuario ve un mensaje humano en vez de una pantalla blanca.

import { useEffect } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { logError } from '@/lib/eventos';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    (async () => {
      const supabase = crearClienteNavegador();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await logError(supabase, error.message, 'error_boundary_global', user.id);
    })();
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--bg)] px-6 text-center [font-family:var(--font-body)]">
      <p className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Algo salió mal</p>
      <p className="max-w-xs text-[14px] text-[var(--text-secondary)]">No fue culpa suya — ya quedó registrado. Intenten de nuevo en un momento.</p>
      <button
        type="button"
        onClick={reset}
        className="flex h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-6 text-[14px] font-semibold text-[var(--bg)] [touch-action:manipulation]"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
