'use client';

// Campo de dinero con puntos de miles mientras se escribe (1234567 → 1.234.567). El valor que entrega es el
// "crudo" (solo dígitos; con `decimal`, dígitos y una coma decimal), así el resto del código sigue haciendo
// Number(valor) como siempre. Mantiene el cursor en su sitio aunque se edite en medio del número.

import { useLayoutEffect, useRef, type InputHTMLAttributes } from 'react';

const agrupar = (enteros: string) => enteros.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// Texto que se ve a partir del valor crudo.
export function formatearMonto(crudo: string, decimal = false): string {
  if (!decimal) return agrupar(crudo.replace(/\D/g, ''));
  const [enteros, decimales] = crudo.split(',');
  return agrupar((enteros ?? '').replace(/\D/g, '')) + (decimales !== undefined ? `,${decimales.replace(/\D/g, '').slice(0, 2)}` : '');
}

// Valor crudo a partir de lo que hay en el campo. En modo decimal, la coma es el decimal; un punto al final con
// 0-2 dígitos detrás (teclados que solo traen punto) también se toma como decimal, porque los grupos de miles
// siempre llevan exactamente 3 dígitos.
function limpiar(texto: string, decimal: boolean): string {
  if (!decimal) return texto.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  let t = texto;
  if (!t.includes(',')) {
    const m = t.match(/^(.*)\.(\d{0,2})$/);
    if (m && !/\.\d{3}/.test(m[2])) t = `${m[1]},${m[2]}`;
  }
  const i = t.indexOf(',');
  const enteros = (i === -1 ? t : t.slice(0, i)).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (i === -1) return enteros;
  return `${enteros || '0'},${t.slice(i + 1).replace(/\D/g, '').slice(0, 2)}`;
}

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: string;
  onValueChange: (crudo: string) => void;
  decimal?: boolean;
};

export function InputMonto({ value, onValueChange, decimal = false, inputMode, ...resto }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const significativos = useRef<number | null>(null);
  const visible = formatearMonto(value, decimal);

  // Después de pintar el valor ya con puntos, devuelve el cursor a la misma posición lógica (mismo número de
  // dígitos/coma a su izquierda).
  useLayoutEffect(() => {
    const n = significativos.current;
    const el = ref.current;
    if (n === null || !el || document.activeElement !== el) return;
    let vistos = 0;
    let pos = 0;
    while (pos < visible.length && vistos < n) {
      if (/[\d,]/.test(visible[pos])) vistos++;
      pos++;
    }
    el.setSelectionRange(pos, pos);
    significativos.current = null;
  }, [visible]);

  return (
    <input
      {...resto}
      ref={ref}
      type="text"
      inputMode={inputMode ?? (decimal ? 'decimal' : 'numeric')}
      autoComplete="off"
      value={visible}
      onChange={(e) => {
        const texto = e.target.value;
        const cursor = e.target.selectionStart ?? texto.length;
        const crudo = limpiar(texto, decimal);
        // Un punto escrito como decimal se convierte en coma: el cursor se queda al final.
        const aComa = decimal && crudo.includes(',') && !texto.includes(',');
        significativos.current = aComa ? Number.MAX_SAFE_INTEGER : texto.slice(0, cursor).replace(/[^\d,]/g, '').length;
        onValueChange(crudo);
      }}
    />
  );
}
