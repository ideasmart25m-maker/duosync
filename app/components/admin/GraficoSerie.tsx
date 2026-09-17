'use client';

import { useReducedMotion } from 'motion/react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface PuntoSerie {
  etiqueta: string;
  valor: number;
}

const NUM = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 });

// Tooltip tematizado con los tokens reales de la app — nunca el recuadro azul/blanco por
// defecto de Recharts, que delata "gráfico de plantilla" al instante (17-VISUALIZACION-DATOS.md).
function TooltipTematizado({ active, label, payload }: { active?: boolean; label?: string; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-2)]">
      <p className="text-[11px] font-medium text-[var(--text-tertiary)]">{label}</p>
      <p className="text-[14px] font-semibold tabular-nums text-[var(--text-primary)]">{NUM.format(payload[0].value)}</p>
    </div>
  );
}

// Línea de tendencia para series temporales (costo de IA, errores, altas por día) — el tipo de
// gráfico correcto para "evolución en el tiempo" según la tabla del sistema (barras se vuelven
// una reja ilegible con 14+ puntos). Colores: SOLO tokens de la app, nunca los defaults de Recharts.
export function GraficoSerie({ titulo, datos, color = 'var(--accent)', altura = 160 }: { titulo: string; datos: PuntoSerie[]; color?: string; altura?: number }) {
  const reducido = useReducedMotion();
  const hayDatos = datos.some((p) => p.valor > 0);

  if (!hayDatos) {
    return (
      <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] text-[12px] text-[var(--text-tertiary)]" style={{ height: altura }}>
        Sin datos suficientes todavía para dibujar la tendencia
      </div>
    );
  }

  return (
    <figure aria-label={titulo}>
      <ResponsiveContainer width="100%" height={altura}>
        <LineChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="color-mix(in oklab, var(--text-tertiary) 15%, transparent)" strokeDasharray="3 3" />
          <XAxis dataKey="etiqueta" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis width={36} axisLine={false} tickLine={false} tickCount={4} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} tickFormatter={(v: number) => NUM.format(v)} />
          <Tooltip content={<TooltipTematizado />} cursor={{ stroke: 'color-mix(in oklab, var(--text-tertiary) 25%, transparent)' }} />
          <Line
            type="monotone"
            dataKey="valor"
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={!reducido}
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
      {/* Alternativa en tabla para lectores de pantalla — misma regla de accesibilidad del 17 */}
      <figcaption className="sr-only">
        <table>
          <caption>{titulo}</caption>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Valor</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((p) => (
              <tr key={p.etiqueta}>
                <th scope="row">{p.etiqueta}</th>
                <td>{p.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
