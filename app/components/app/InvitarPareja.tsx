'use client';

// Invitación a la pareja dentro de la app: muestra el código REAL de la pareja (el de la base de datos,
// no el que se vio en el onboarding) mientras la otra persona todavía no se ha unido.

import { useEffect, useState } from 'react';
import { Copy, Check, MessageCircle, KeyRound } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';

export function InvitarPareja({ supabase, coupleId }: { supabase: SupabaseClient; coupleId: string }) {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [falta, setFalta] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const [{ data: pareja }, { count }] = await Promise.all([
        supabase.from('couples').select('codigo_invitacion').eq('id', coupleId).maybeSingle(),
        supabase.from('couple_members').select('user_id', { count: 'exact', head: true }).eq('couple_id', coupleId),
      ]);
      if (cancelado) return;
      setCodigo(pareja?.codigo_invitacion ?? null);
      setFalta((count ?? 0) < 2);
    })().catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [supabase, coupleId]);

  if (!codigo || !falta) return null;

  const mensaje = `Vamos a organizar nuestras cuentas juntos en Fairsy (no hay que bajar nada, se abre directo en el navegador). Entra a ${window.location.origin}, toca "Ya tengo un código" y escribe este código de pareja: ${codigo}`;

  return (
    <div className="rounded-[var(--radius-card)] border-2 border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_7%,var(--surface))] p-4">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
        <KeyRound size={13} strokeWidth={2.2} aria-hidden="true" />
        Inviten a su pareja
      </p>
      <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Todavía no se ha unido. Este es el código de su pareja:</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-[32px] font-bold tabular-nums tracking-[0.15em] text-[var(--text-primary)] [font-family:var(--font-display)]">{codigo}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(codigo);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1500);
          }}
          aria-label="Copiar el código"
          className="flex size-10 items-center justify-center rounded-full bg-[var(--surface)] [touch-action:manipulation]"
        >
          {copiado ? <Check size={18} strokeWidth={2.4} color="var(--accent)" aria-hidden="true" /> : <Copy size={18} strokeWidth={2} color="var(--text-secondary)" aria-hidden="true" />}
        </button>
      </div>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--surface)] text-[14px] font-semibold text-[var(--text-primary)] [touch-action:manipulation]"
      >
        <MessageCircle size={17} strokeWidth={2} aria-hidden="true" />
        Enviar el código por WhatsApp
      </a>
    </div>
  );
}
