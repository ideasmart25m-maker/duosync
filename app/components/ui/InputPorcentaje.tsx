'use client';

// Porcentaje de reparto con cualquier valor de 0 a 100 (57 %, 42 %…), no solo de 10 en 10.
// Se escribe el número, o se afina de a 1 con − y +. El valor se confirma al salir del campo o con Enter
// (así no se guarda "5" mientras la persona todavía está escribiendo "57").

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export function InputPorcentaje({
  valor,
  onCambiar,
  disabled,
  etiqueta = 'Mi parte',
}: {
  valor: number;
  onCambiar: (nuevo: number) => void;
  disabled?: boolean;
  etiqueta?: string;
}) {
  // Mientras la persona escribe se guarda el texto tal cual; fuera del campo se muestra siempre el valor real.
  const [texto, setTexto] = useState<string | null>(null);

  const confirmar = () => {
    const n = Number(texto);
    const escrito = texto;
    setTexto(null);
    if (escrito === null || escrito.trim() === '' || !Number.isFinite(n)) return;
    const limpio = Math.min(100, Math.max(0, Math.round(n)));
    if (limpio !== valor) onCambiar(limpio);
  };
  const paso = (delta: number) => onCambiar(Math.min(100, Math.max(0, valor + delta)));

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={disabled || valor <= 0}
        onClick={() => paso(-1)}
        aria-label={`Bajar ${etiqueta} un punto`}
        className="flex size-9 items-center justify-center rounded-full bg-[var(--surface-2)] disabled:opacity-40 [touch-action:manipulation]"
      >
        <Minus size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>
      <label className="flex h-9 items-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] px-2 focus-within:border-[var(--accent)]">
        <span className="sr-only">{etiqueta} en porcentaje</span>
        <input
          type="text"
          inputMode="numeric"
          value={texto ?? String(valor)}
          disabled={disabled}
          maxLength={3}
          onChange={(e) => setTexto(e.target.value.replace(/[^\d]/g, ''))}
          onFocus={(e) => {
            setTexto(String(valor));
            e.target.select();
          }}
          onBlur={confirmar}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-9 bg-transparent text-right text-[15px] font-semibold tabular-nums text-[var(--text-primary)] outline-none"
        />
        <span className="ml-0.5 text-[14px] text-[var(--text-secondary)]">%</span>
      </label>
      <button
        type="button"
        disabled={disabled || valor >= 100}
        onClick={() => paso(1)}
        aria-label={`Subir ${etiqueta} un punto`}
        className="flex size-9 items-center justify-center rounded-full bg-[var(--surface-2)] disabled:opacity-40 [touch-action:manipulation]"
      >
        <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  );
}
