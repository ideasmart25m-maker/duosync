'use client';

// "Tu plan": dice en simple en qué plan está la pareja, deja suscribirse desde la app y conectar una compra hecha
// con otro correo (se comprueba con un código que llega a ese correo). No hay otro lugar de la app que muestre esto.

import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Loader2, Sparkles } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { urlCheckout } from '@/lib/hotmart/checkout';

interface EstadoPlan {
  plan: 'gratis' | 'premium';
  pruebaHasta: Date | null;
}

type Paso = 'cerrado' | 'correo' | 'codigo' | 'listo';

const MENSAJES: Record<string, string> = {
  codigo_incorrecto: 'Ese código no es correcto. Revisa el último correo que te llegó.',
  vencido: 'Ese código ya venció. Pide uno nuevo.',
  demasiados_intentos: 'Ya fallaste muchas veces con este código. Pide uno nuevo en unos minutos.',
  ya_conectada: 'Esa compra ya está conectada a otras dos cuentas. Escribe a soporte@fairsy.lat y lo resolvemos.',
};

export function TuPlan({ supabase, coupleId }: { supabase: SupabaseClient; coupleId: string }) {
  const [estado, setEstado] = useState<EstadoPlan | null>(null);
  const [paso, setPaso] = useState<Paso>('cerrado');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('couples').select('plan, trial_termina_en').eq('id', coupleId).maybeSingle();
    if (!data) return;
    const hasta = data.trial_termina_en ? new Date(data.trial_termina_en as string) : null;
    setEstado({ plan: data.plan === 'premium' ? 'premium' : 'gratis', pruebaHasta: hasta && hasta > new Date() ? hasta : null });
  }, [supabase, coupleId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!estado) return null;

  const pedirCodigo = async () => {
    if (ocupado) return;
    setOcupado(true);
    setError(null);
    try {
      const r = await fetch('/api/plan/conectar-compra/enviar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (r.status === 429) {
        setError('Ya pediste varios códigos. Espera una hora o escribe a soporte@fairsy.lat.');
      } else if (!r.ok) {
        const j = (await r.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? 'No pudimos enviar el código. Intenta de nuevo.');
      } else {
        setPaso('codigo');
      }
    } catch {
      setError('Sin conexión. Revisa tu internet e intenta de nuevo.');
    }
    setOcupado(false);
  };

  const confirmar = async (valor: string) => {
    const limpio = valor.replace(/\D/g, '').slice(0, 6);
    setCodigo(limpio);
    if (ocupado || limpio.length !== 6) return;
    setOcupado(true);
    setError(null);
    try {
      const r = await fetch('/api/plan/conectar-compra/confirmar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, codigo: limpio }),
      });
      const j = (await r.json().catch(() => null)) as { resultado?: string; error?: string } | null;
      if (r.ok && j?.resultado === 'ok') {
        setPaso('listo');
        await cargar();
      } else {
        setError(MENSAJES[j?.resultado ?? ''] ?? j?.error ?? 'No pudimos comprobar el código. Intenta de nuevo.');
        setCodigo('');
      }
    } catch {
      setError('Sin conexión. Revisa tu internet e intenta de nuevo.');
    }
    setOcupado(false);
  };

  const esPremium = estado.plan === 'premium';
  const fechaPrueba = estado.pruebaHasta?.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });

  return (
    <section
      aria-label="Tu plan"
      className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_22%,transparent)] bg-[var(--surface)] p-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[color-mix(in_oklab,var(--accent-2)_12%,transparent)]">
          {esPremium ? <BadgeCheck size={20} strokeWidth={2} color="var(--accent-2)" aria-hidden="true" /> : <Sparkles size={20} strokeWidth={2} color="var(--accent-2)" aria-hidden="true" />}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[var(--text-secondary)]">Tu plan</p>
          <p className="text-[17px] font-semibold text-[var(--text-primary)]">
            {esPremium ? (fechaPrueba ? `Prueba gratis hasta el ${fechaPrueba}` : 'Plan Fairsy activo') : 'Plan gratis'}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-[var(--text-secondary)]">
            {esPremium
              ? fechaPrueba
                ? 'Disfrutan todo Fairsy sin pagar. Si no les convence, cancelan desde su compra en Hotmart antes de esa fecha.'
                : 'Los dos disfrutan todo Fairsy.'
              : 'Prueben 7 días gratis todo Fairsy: asistente con IA, escaneo de recibos, metas y viajes sin tope.'}
          </p>
        </div>
      </div>

      {!esPremium && (
        <div className="flex flex-col gap-2">
          <a
            href={urlCheckout('anual')}
            className="flex min-h-12 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[15px] font-semibold text-[var(--bg)] [touch-action:manipulation]"
          >
            Probar 7 días gratis · $35.94 al año
          </a>
          <a
            href={urlCheckout('mensual')}
            className="flex min-h-11 items-center justify-center text-[14px] font-medium text-[var(--text-secondary)] underline underline-offset-4 [touch-action:manipulation]"
          >
            Prefiero el plan mensual · $5.99
          </a>
        </div>
      )}

      {paso === 'cerrado' && (
        <button
          type="button"
          onClick={() => setPaso('correo')}
          className="min-h-11 text-left text-[14px] font-medium text-[var(--accent-2)] underline underline-offset-4 [touch-action:manipulation]"
        >
          ¿Ya pagaste con otro correo? Conectar mi compra
        </button>
      )}

      {paso === 'correo' && (
        <div className="flex flex-col gap-2">
          <label htmlFor="correo-compra" className="text-[14px] font-medium text-[var(--text-primary)]">
            Correo con el que pagaste en Hotmart
          </label>
          <input
            id="correo-compra"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="min-h-12 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] bg-[var(--bg)] px-3 text-[16px] text-[var(--text-primary)]"
          />
          <button
            type="button"
            onClick={pedirCodigo}
            disabled={ocupado || !email.includes('@')}
            className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[15px] font-semibold text-[var(--bg)] disabled:opacity-50 [touch-action:manipulation]"
          >
            {ocupado && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            Enviarme el código
          </button>
        </div>
      )}

      {paso === 'codigo' && (
        <div className="flex flex-col gap-2">
          <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">
            Si hay una compra con <strong className="text-[var(--text-primary)]">{email}</strong>, te llegó un código de 6 números. Revisa también la carpeta de spam.
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={9}
            value={codigo}
            onChange={(e) => void confirmar(e.target.value)}
            aria-label="Código de 6 números"
            placeholder="000000"
            className="min-h-12 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] bg-[var(--bg)] px-3 text-center text-[22px] font-semibold tracking-[0.3em] text-[var(--text-primary)] tabular-nums"
          />
          <button
            type="button"
            onClick={() => {
              setPaso('correo');
              setCodigo('');
              setError(null);
            }}
            className="min-h-11 text-left text-[14px] font-medium text-[var(--text-secondary)] underline underline-offset-4 [touch-action:manipulation]"
          >
            Usar otro correo o pedir un código nuevo
          </button>
        </div>
      )}

      {paso === 'listo' && (
        <p role="status" className="rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--accent-2)_12%,transparent)] p-3 text-[14px] font-medium text-[var(--text-primary)]">
          ¡Listo! Tu compra quedó conectada y el plan ya está activo para los dos.
        </p>
      )}

      {error && (
        <p role="alert" className="text-[14px] font-medium text-[var(--danger)]">
          {error}
        </p>
      )}
    </section>
  );
}
