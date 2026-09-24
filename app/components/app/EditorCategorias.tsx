'use client';

// Editor de categorías — reparto (% por defecto) y recurrencia (pago que se repite cada mes,
// con el día en que vence). Pedido real del usuario: poder marcar Arriendo/Servicios/
// Suscripciones como recurrentes y ajustar el % de reparto por categoría, no solo al vuelo
// cuando registran un gasto.

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Minus, Plus, Bell, Trash2 } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { iconoDeCategoria, colorDeCategoria, type CategoriaDB } from '@/lib/categorias';
import { actualizarCategoria } from '@/lib/gastos';
import { formatoMoneda } from '@/lib/paises';

export interface ParejaEditor {
  miUserId: string;
  otroUserId: string | null;
  nombrePropio: string;
  nombreOtro: string | null;
  pais: string | null;
}

// Valor del mes de UNA factura — se escribe libre y se guarda al salir del campo (no a cada tecla).
function MontoInput({ valor, etiqueta, onGuardar }: { valor: number; etiqueta: string; onGuardar: (n: number) => void }) {
  const [texto, setTexto] = useState(valor ? String(valor) : '');
  useEffect(() => setTexto(valor ? String(valor) : ''), [valor]);
  return (
    <input
      inputMode="numeric"
      value={texto}
      onChange={(e) => setTexto(e.target.value.replace(/\D/g, ''))}
      onBlur={() => {
        const n = Number(texto) || 0;
        if (n !== valor) onGuardar(n);
      }}
      placeholder="Valor"
      aria-label={etiqueta}
      className="h-9 w-24 border-l border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-transparent pl-2 text-[13px] tabular-nums text-[var(--text-primary)] outline-none"
    />
  );
}

// Orden fijo pensado para "Servicios públicos": Acueducto, Energía, Gas, Internet — el usuario
// agrega las fechas en ese orden y cada una se identifica con su letra (no hay forma de saber
// desde la base de datos cuál factura es cuál, así que esto es solo una guía visual de orden).
const LETRAS_SERVICIOS = ['A', 'E', 'G', 'I'];
export const NOMBRES_SERVICIOS = ['Acueducto', 'Energía', 'Gas', 'Internet'];

function FilaCategoria({
  categoria,
  supabase,
  pareja,
  onActualizada,
}: {
  categoria: CategoriaDB;
  supabase: SupabaseClient;
  pareja: ParejaEditor;
  onActualizada: (c: CategoriaDB) => void;
}) {
  const [guardando, setGuardando] = useState(false);
  const Icono = iconoDeCategoria(categoria.icono);
  const color = colorDeCategoria(categoria.color);
  const dias = categoria.diasVencimiento ?? [1];
  const montos = dias.map((_, i) => categoria.montosMensuales?.[i] ?? 0);
  const totalMes = montos.reduce((a, m) => a + m, 0);
  const cambiarMonto = (indice: number, nuevo: number) => {
    const copia = [...montos];
    copia[indice] = nuevo;
    guardar({ montosMensuales: copia });
  };
  const nombrePagador =
    categoria.pagaUserId === null ? null : categoria.pagaUserId === pareja.miUserId ? pareja.nombrePropio : (pareja.nombreOtro ?? 'Tu pareja');
  const parteDelPagador = Math.round((totalMes * categoria.splitPercent) / 100);
  const parteDelOtro = totalMes - parteDelPagador;

  const guardar = async (cambios: Parameters<typeof actualizarCategoria>[2]) => {
    setGuardando(true);
    try {
      const actualizada = await actualizarCategoria(supabase, categoria.id, cambios);
      onActualizada(actualizada);
    } catch {
      // Silencioso: el valor visual vuelve a su estado real en el próximo render de props
      // (el padre solo actualiza si la llamada tuvo éxito) — no hace falta un banner aparte
      // para un ajuste menor que se puede reintentar tocando otra vez.
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-3">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
          <Icono size={16} strokeWidth={2.2} color="var(--bg)" aria-hidden="true" />
        </span>
        <span className="flex-1 text-[14px] font-medium text-[var(--text-primary)]">{categoria.nombre}</span>
        {guardando && <span className="text-[11px] text-[var(--text-tertiary)]">Guardando…</span>}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[12px] text-[var(--text-secondary)]">
          Reparto: <span className="font-semibold text-[var(--text-primary)]">{categoria.splitPercent}%</span> quien registra ·{' '}
          <span className="font-semibold text-[var(--text-primary)]">{100 - categoria.splitPercent}%</span> su pareja
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={categoria.splitPercent <= 0 || guardando}
            onClick={() => guardar({ splitPercent: Math.max(0, categoria.splitPercent - 10) })}
            aria-label="Bajar reparto"
            className="flex size-7 items-center justify-center rounded-full bg-[var(--surface-2)] disabled:opacity-40 [touch-action:manipulation]"
          >
            <Minus size={12} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={categoria.splitPercent >= 100 || guardando}
            onClick={() => guardar({ splitPercent: Math.min(100, categoria.splitPercent + 10) })}
            aria-label="Subir reparto"
            className="flex size-7 items-center justify-center rounded-full bg-[var(--surface-2)] disabled:opacity-40 [touch-action:manipulation]"
          >
            <Plus size={12} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)] pt-3">
        <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
          <Bell size={13} strokeWidth={2} aria-hidden="true" />
          Se repite cada mes
        </span>
        <button
          type="button"
          disabled={guardando}
          onClick={() =>
            guardar(
              categoria.esRecurrente
                ? { esRecurrente: false, diasVencimiento: null }
                : { esRecurrente: true, diasVencimiento: categoria.diasVencimiento?.length ? categoria.diasVencimiento : [1] }
            )
          }
          aria-pressed={categoria.esRecurrente}
          className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors [touch-action:manipulation] ${
            categoria.esRecurrente ? 'justify-end bg-[var(--accent)]' : 'justify-start bg-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)]'
          }`}
        >
          <span className="size-5 rounded-full bg-[var(--bg)]" />
        </button>
      </div>

      {categoria.esRecurrente && (
        <div className="mt-3 space-y-2">
          <span className="text-[12px] text-[var(--text-secondary)]">
            {categoria.nombre === 'Servicios públicos' || (categoria.diasVencimiento?.length ?? 0) > 1
              ? 'Un día por cada factura (acueducto, energía, gas…)'
              : 'Vence el día de cada mes'}
          </span>
          {categoria.nombre === 'Servicios públicos' && (categoria.diasVencimiento?.length ?? 0) > 1 && (
            <p className="text-[11px] text-[var(--text-tertiary)]">
              {LETRAS_SERVICIOS.slice(0, categoria.diasVencimiento?.length ?? 0)
                .map((letra, i) => `${letra} = ${NOMBRES_SERVICIOS[i]}`)
                .join(' · ')}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {(categoria.diasVencimiento ?? [1]).map((dia, indice) => (
              <div
                key={indice}
                className="flex items-center gap-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] pl-2 pr-1"
              >
                {/* Letra que identifica cada factura (Acueducto/Energía/Gas/Internet…) — antes
                    eran solo números sueltos, sin forma de saber a cuál servicio correspondía
                    cada fecha (pedido real del usuario). Solo aplica a Servicios públicos, que
                    es la única categoría pensada para agrupar varias facturas distintas. */}
                {categoria.nombre === 'Servicios públicos' && (categoria.diasVencimiento?.length ?? 0) > 1 && (
                  <span
                    className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-[var(--bg)]"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  >
                    {LETRAS_SERVICIOS[indice] ?? indice + 1}
                  </span>
                )}
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={dia}
                  aria-label={
                    categoria.nombre === 'Servicios públicos' && (categoria.diasVencimiento?.length ?? 0) > 1
                      ? `Día de vencimiento de ${NOMBRES_SERVICIOS[indice] ?? `factura ${indice + 1}`}`
                      : 'Día de vencimiento'
                  }
                  onChange={(e) => {
                    const nuevoDia = Math.min(31, Math.max(1, Number(e.target.value) || 1));
                    const nuevos = [...dias];
                    nuevos[indice] = nuevoDia;
                    guardar({ diasVencimiento: nuevos });
                  }}
                  className="h-9 w-12 bg-transparent text-center text-[13px] tabular-nums text-[var(--text-primary)] outline-none"
                />
                <MontoInput
                  valor={montos[indice] ?? 0}
                  etiqueta={`Valor a pagar cada mes de ${
                    categoria.nombre === 'Servicios públicos' && dias.length > 1 ? (NOMBRES_SERVICIOS[indice] ?? `factura ${indice + 1}`) : categoria.nombre
                  }`}
                  onGuardar={(n) => cambiarMonto(indice, n)}
                />
                {(categoria.diasVencimiento?.length ?? 1) > 1 && (
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => {
                      guardar({
                        diasVencimiento: dias.filter((_, i) => i !== indice),
                        montosMensuales: montos.filter((_, i) => i !== indice),
                      });
                    }}
                    aria-label="Quitar esta fecha"
                    className="flex size-7 items-center justify-center text-[var(--text-tertiary)] [touch-action:manipulation]"
                  >
                    <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              disabled={guardando || (categoria.diasVencimiento?.length ?? 0) >= 6}
              onClick={() => guardar({ diasVencimiento: [...dias, 1], montosMensuales: [...montos, 0] })}
              aria-label="Agregar otra fecha"
              className="flex size-9 items-center justify-center rounded-[var(--radius-button)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_35%,transparent)] text-[var(--text-tertiary)] disabled:opacity-40 [touch-action:manipulation]"
            >
              <Plus size={14} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          {totalMes > 0 && (
            <div className="rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3 text-[12px] text-[var(--text-secondary)]">
              <p>
                Total del mes: <span className="font-semibold text-[var(--text-primary)]">{formatoMoneda(totalMes, pareja.pais)}</span>
              </p>
              <p className="mt-1">
                {nombrePagador ? `${nombrePagador} paga y se queda con` : 'Quien pague se queda con'}{' '}
                <span className="font-semibold text-[var(--text-primary)]">
                  {categoria.splitPercent}% ({formatoMoneda(parteDelPagador, pareja.pais)})
                </span>
                {' · '}el otro le devuelve{' '}
                <span className="font-semibold text-[var(--text-primary)]">
                  {100 - categoria.splitPercent}% ({formatoMoneda(parteDelOtro, pareja.pais)})
                </span>
              </p>
            </div>
          )}

          <div>
            <span className="text-[12px] text-[var(--text-secondary)]">¿Quién lo paga?</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {[
                { id: null as string | null, texto: 'Quien toque "Registrar pago"' },
                { id: pareja.miUserId as string | null, texto: pareja.nombrePropio },
                ...(pareja.otroUserId ? [{ id: pareja.otroUserId as string | null, texto: pareja.nombreOtro ?? 'Tu pareja' }] : []),
              ].map((op) => (
                <button
                  key={op.id ?? 'nadie'}
                  type="button"
                  disabled={guardando}
                  onClick={() => guardar({ pagaUserId: op.id })}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-medium [touch-action:manipulation] ${
                    categoria.pagaUserId === op.id
                      ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--accent)]'
                      : 'border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] text-[var(--text-secondary)]'
                  }`}
                >
                  {op.texto}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function EditorCategorias({
  categorias,
  supabase,
  pareja,
  onActualizada,
  onCerrar,
}: {
  categorias: CategoriaDB[];
  supabase: SupabaseClient;
  pareja: ParejaEditor;
  onActualizada: (c: CategoriaDB) => void;
  onCerrar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_oklab,black_45%,transparent)] sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-[85dvh] w-full max-w-md flex-col rounded-t-[var(--radius-card)] bg-[var(--bg)] p-5 shadow-[var(--shadow-2)] sm:h-[75dvh] sm:rounded-[var(--radius-card)]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Categorías</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex size-9 items-center justify-center text-[var(--text-tertiary)] [touch-action:manipulation]">
            <X size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
        <p className="mb-3 text-[13px] text-[var(--text-secondary)]">
          Ajusten cómo se reparte cada categoría y marquen las que se repiten cada mes para avisarles antes de que venzan.
        </p>
        <div className="flex-1 space-y-3 overflow-y-auto">
          {categorias.map((c) => (
            <FilaCategoria key={c.id} categoria={c} supabase={supabase} pareja={pareja} onActualizada={onActualizada} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
