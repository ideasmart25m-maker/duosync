'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

// Interruptor del dueño: deja un espacio activo a mano (sin pasar por Hotmart) o se lo quita. Llama a
// /api/admin/acceso-manual, que verifica en el servidor que quien llama es admin.
export function AccesoManual({ coupleId, inicial, planInicial }: { coupleId: string; inicial: boolean; planInicial: string }) {
  const [manual, setManual] = useState(inicial);
  const [plan, setPlan] = useState(planInicial);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiar = async () => {
    setOcupado(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/acceso-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupleId, activo: !manual }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; plan?: string; accesoManual?: boolean };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'No pudimos guardar el cambio.');
      } else {
        setManual(!!data.accesoManual);
        if (data.plan) setPlan(data.plan);
      }
    } catch {
      setError('Sin conexión. Intenta de nuevo.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          plan === 'premium' ? 'bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] text-[var(--accent)]' : 'bg-[var(--surface-2)] text-[var(--text-tertiary)]'
        }`}
      >
        {plan === 'premium' ? (manual ? 'Activo a mano' : 'Activo') : 'Bloqueado'}
      </span>
      <button
        type="button"
        onClick={cambiar}
        disabled={ocupado}
        className="flex min-h-9 items-center gap-1.5 text-[12px] font-semibold text-[var(--accent-2)] underline underline-offset-2 disabled:opacity-60 [touch-action:manipulation]"
      >
        {ocupado && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
        {manual ? 'Quitar acceso manual' : 'Activar a mano'}
      </button>
      {error && <span className="text-[11px] text-[var(--danger)]">{error}</span>}
    </div>
  );
}
