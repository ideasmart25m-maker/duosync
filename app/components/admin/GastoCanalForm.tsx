'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';

export function GastoCanalForm() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [channel, setChannel] = useState('');
  const [amount, setAmount] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/gasto-canal/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, amount: Number(amount), currency: 'USD', periodStart, periodEnd }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'No pudimos guardar el gasto.');
        return;
      }
      setChannel('');
      setAmount('');
      setPeriodStart('');
      setPeriodEnd('');
      setAbierto(false);
      router.refresh();
    } catch {
      setError('No pudimos conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] border border-dashed border-[color-mix(in_oklab,var(--accent)_35%,transparent)] px-4 text-[13px] font-semibold text-[var(--accent)] [touch-action:manipulation]"
      >
        <Plus size={15} strokeWidth={2.2} aria-hidden="true" />
        Anotar gasto de un canal
      </button>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
    >
      <p className="text-[13px] font-semibold text-[var(--text-primary)]">Nuevo gasto de adquisición</p>
      <input
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
        placeholder="Canal (ej. ads_meta, afiliado, contenido)"
        className="h-10 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
      />
      <input
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
        placeholder="Monto en USD"
        className="h-10 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
      />
      <div className="flex gap-2">
        <input
          type="date"
          value={periodStart}
          onChange={(e) => setPeriodStart(e.target.value)}
          className="h-10 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
        <input
          type="date"
          value={periodEnd}
          onChange={(e) => setPeriodEnd(e.target.value)}
          className="h-10 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
      </div>
      {error && <p className="text-[12px] font-medium text-[var(--danger)]">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setAbierto(false)} className="flex h-10 flex-1 items-center justify-center rounded-[var(--radius-button)] text-[13px] font-medium text-[var(--text-tertiary)]">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!channel || !amount || !periodStart || !periodEnd || enviando}
          className="flex h-10 flex-[2] items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[13px] font-semibold text-[var(--bg)] disabled:opacity-50"
        >
          {enviando && <Loader2 size={14} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />}
          Guardar
        </button>
      </div>
    </form>
  );
}
