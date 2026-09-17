'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { motion, animate, useReducedMotion } from 'motion/react';
import { InfoTooltip } from './InfoTooltip';

// Cuenta de 0 al número real — reconoce enteros ("12"), decimales ("$0.000 USD") y porcentajes
// ("42%"), preservando el prefijo/sufijo y la cantidad de decimales originales. Una de las 7
// animaciones baseline no negociables del sistema (defecto real detectado por el revisor-visual:
// la pantalla no animaba nada, y luego que solo animaba enteros triviales, no los valores héroe).
const PATRON_NUMERO = /^(-?\$?)(\d+(?:\.\d+)?)(%| USD)?$/;

function useConteoSiEsNumero(valor: string | null): string | null {
  const reducido = useReducedMotion();
  const coincidencia = valor !== null ? valor.match(PATRON_NUMERO) : null;
  const [, prefijo = '', numeroTexto = '0', sufijo = ''] = coincidencia ?? [];
  const decimales = numeroTexto.includes('.') ? numeroTexto.split('.')[1].length : 0;
  const objetivo = coincidencia ? Number(numeroTexto) : 0;
  const [mostrado, setMostrado] = useState(coincidencia && !reducido ? 0 : objetivo);
  const anteriorRef = useRef(objetivo);

  useEffect(() => {
    if (!coincidencia || reducido) {
      setMostrado(objetivo);
      anteriorRef.current = objetivo;
      return;
    }
    const desde = anteriorRef.current;
    const controls = animate(desde, objetivo, { duration: 0.7, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setMostrado(v) });
    anteriorRef.current = objetivo;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacciona solo al valor/tipo
  }, [valor, reducido]);

  if (!coincidencia) return valor;
  return `${prefijo}${mostrado.toFixed(decimales)}${sufijo}`;
}

// Tarjeta de métrica reutilizable en todo el panel de administración — dato héroe + etiqueta +
// insight opcional en una línea. Si `valor` es null, muestra "Sin datos" en vez de inventar un
// número (pedido explícito del usuario: "si un dato no existe, márcalo como Sin datos").
export function Tarjeta({
  etiqueta,
  valor,
  insight,
  colorValor,
  progreso,
  destacada,
  info,
}: {
  etiqueta: string;
  valor: string | null;
  insight?: string;
  colorValor?: string;
  /** 0-100: si se pasa, dibuja una barra de progreso animada bajo el valor (dato de proporción, no solo texto). */
  progreso?: number;
  /** Marca esta tarjeta como el dato héroe del bloque: valor más grande + borde de acento. */
  destacada?: boolean;
  /** Frase que explica qué significa esta métrica — se muestra en un tooltip junto a la etiqueta. */
  info?: string;
}) {
  const reducido = useReducedMotion();
  const valorMostrado = useConteoSiEsNumero(valor);

  return (
    <motion.div
      variants={{
        hidden: reducido ? { opacity: 0 } : { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: reducido ? 0.15 : 0.3, ease: [0.16, 1, 0.3, 1] } },
      }}
      className="rounded-[var(--radius-card)] border p-4 shadow-[var(--shadow-1)]"
      style={{
        borderColor: destacada ? 'var(--accent)' : 'color-mix(in oklab, var(--text-tertiary) 18%, transparent)',
        background: destacada ? 'color-mix(in oklab, var(--accent) 6%, var(--surface))' : 'var(--surface)',
      }}
    >
      <p className="flex items-center gap-1 text-[12px] font-medium text-[var(--text-tertiary)]">
        {etiqueta}
        {info && <InfoTooltip texto={info} />}
      </p>
      <p
        className={`mt-1 font-bold tabular-nums tracking-tight [font-family:var(--font-display)] ${destacada ? 'text-[32px]' : 'text-[26px]'}`}
        style={{ color: valor === null ? 'var(--text-tertiary)' : colorValor ?? 'var(--text-primary)' }}
      >
        {valorMostrado ?? 'Sin datos'}
      </p>
      {progreso !== undefined && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_16%,transparent)]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: colorValor ?? 'var(--accent)' }}
            initial={{ width: reducido ? `${progreso}%` : '0%' }}
            animate={{ width: `${progreso}%` }}
            transition={{ duration: reducido ? 0.15 : 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      )}
      {insight && <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{insight}</p>}
    </motion.div>
  );
}

// Escalona la entrada de cada tarjeta hija (70ms entre elementos, motion signature ya
// establecida en el resto de la app) en vez de que todas aparezcan a la vez — defecto real
// detectado por el revisor-visual (cero movimiento en toda la pantalla).
export function GrillaTarjetas({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      {children}
    </motion.div>
  );
}
