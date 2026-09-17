'use client';

// Error Boundary propio de /admin (Next.js aplica el error.tsx más cercano al segmento que
// falló) — mensaje en el mismo tono de "panel privado" en vez del genérico de la app pública.

import { useEffect } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { logError } from '@/lib/eventos';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    (async () => {
      const supabase = crearClienteNavegador();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await logError(supabase, error.message, 'error_boundary_admin', user.id);
    })();
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--bg)] px-6 text-center [font-family:var(--font-body)]">
      <p className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">El panel tuvo un problema</p>
      <p className="max-w-xs text-[14px] text-[var(--text-secondary)]">Ya quedó registrado en Salud. Intenta de nuevo — si se repite, revisa los errores agrupados.</p>
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
