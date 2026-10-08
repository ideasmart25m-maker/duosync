'use client';

// Quien entró con el enlace de invitación (cuenta de invitado, sin correo) puede GUARDAR su acceso con un
// correo cuando quiera: la misma cuenta, con los mismos datos, pasa a ser una cuenta normal que se puede
// abrir desde otro celular o navegador. No es obligatorio ni bloquea nada.

import { useEffect, useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';

export function GuardarAcceso({ supabase }: { supabase: SupabaseClient }) {
  const [esInvitado, setEsInvitado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEsInvitado(!!data.user?.is_anonymous));
  }, [supabase]);

  if (!esInvitado) return null;

  const enviarCodigo = async () => {
    if (ocupado || !email.includes('@')) return;
    setOcupado(true);
    setError(null);
    const { error: e } = await supabase.auth.updateUser({ email: email.trim() });
    setOcupado(false);
    if (e) {
      setError(/already|registered|exists/i.test(e.message) ? 'Ese correo ya tiene una cuenta. Usa otro correo.' : 'No pudimos enviar el código. Revisa el correo e intenta de nuevo.');
      return;
    }
    setEnviado(true);
  };

  const confirmar = async (valor: string) => {
    const token = valor.replace(/\D/g, '');
    if (ocupado || token.length < 6) return;
    setOcupado(true);
    setError(null);
    const { error: e } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email_change' });
    if (e) {
      setOcupado(false);
      setError('Ese código no es correcto o ya venció. Revisa el último correo que te llegó.');
      return;
    }
    window.location.reload();
  };

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_22%,transparent)] bg-[var(--surface)] p-4 text-left [touch-action:manipulation]"
      >
        <ShieldCheck size={20} strokeWidth={2} color="var(--accent-2)" aria-hidden="true" />
        <span className="flex-1">
          <span className="block text-[14px] font-semibold text-[var(--text-primary)]">Guarda tu acceso con tu correo</span>
          <span className="block text-[12px] text-[var(--text-secondary)]">Así no lo pierdes si cambias de celular o borras el navegador.</span>
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_22%,transparent)] bg-[var(--surface)] p-4">
      <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--text-primary)]">
        <ShieldCheck size={18} strokeWidth={2} color="var(--accent-2)" aria-hidden="true" />
        Guarda tu acceso con tu correo
      </p>
      {!enviado ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(ev) => {
            ev.preventDefault();
            enviarCodigo();
          }}
        >
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="tu@correo.com"
            className="h-12 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[16px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
          {error && <p className="text-[12px] font-medium text-[var(--danger)]">{error}</p>}
          <button
            type="submit"
            disabled={!email.includes('@') || ocupado}
            className="flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)] disabled:opacity-50 [touch-action:manipulation]"
          >
            {ocupado && <Loader2 size={15} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />}
            Enviarme un código
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-[var(--text-secondary)]">
            Te enviamos un código a <span className="font-semibold text-[var(--text-primary)]">{email}</span>. Escríbelo aquí:
          </p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={codigo}
            onChange={(ev) => {
              const limpio = ev.target.value.replace(/\D/g, '').slice(0, 8);
              setCodigo(limpio);
              if (error) setError(null);
              if (limpio.length === 8) confirmar(limpio);
            }}
            placeholder="00000000"
            className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-center text-[24px] font-semibold tracking-[0.3em] tabular-nums text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
          {error && <p className="text-[12px] font-medium text-[var(--danger)]">{error}</p>}
        </div>
      )}
    </div>
  );
}
