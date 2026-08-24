'use client';

// Pantalla GASTOS — protagonista: la lista de movimientos del hogar, con filtros por categoría
// y navegación real entre meses (DESIGN-CORE regla 13: fechas reales + navegación, nunca solo
// "Este mes"). El registro de un gasto nuevo vive en el contexto visual de la lista (regla 12).

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Inbox } from 'lucide-react';
import { CATEGORIAS, GASTOS as GASTOS_SEMILLA, formatoCOP, categoriaPorId, PAREJA, type Gasto } from '@/lib/seed-datos';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatoFecha(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${parseInt(d, 10)} de ${MESES[parseInt(m, 10) - 1]}`;
}

function FormularioGasto({ onGuardar, onCerrar }: { onGuardar: (g: Omit<Gasto, 'id'>) => void; onCerrar: () => void }) {
  const [categoriaId, setCategoriaId] = useState(CATEGORIAS[0].id);
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
      onSubmit={(e) => {
        e.preventDefault();
        const valor = Number(monto);
        if (!valor || valor <= 0) return;
        onGuardar({ categoriaId, monto: valor, fecha: new Date().toISOString().slice(0, 10), registradoPor: 'S', nota: nota.trim() || undefined });
        setMonto('');
        setNota('');
        onCerrar();
      }}
    >
      <div className="mb-4 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoriaId(c.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium [touch-action:manipulation] ${
                categoriaId === c.id
                  ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--accent)]'
                  : 'border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] text-[var(--text-secondary)]'
              }`}
            >
              <c.icono size={13} strokeWidth={2.2} aria-hidden="true" />
              {c.nombre}
            </button>
          ))}
        </div>
        <input
          autoFocus
          inputMode="numeric"
          value={monto}
          onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))}
          placeholder="Monto"
          className="h-12 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[16px] tabular-nums text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Nota (opcional)"
          className="mt-2 h-12 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCerrar}
            className="flex h-11 flex-1 items-center justify-center rounded-[var(--radius-button)] text-[14px] font-medium text-[var(--text-tertiary)] [touch-action:manipulation]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!monto}
            className="flex h-11 flex-[2] items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)] disabled:opacity-50 [touch-action:manipulation]"
          >
            Guardar gasto
          </button>
        </div>
      </div>
    </motion.form>
  );
}

function GastosInner() {
  const params = useSearchParams();
  const [gastos, setGastos] = useState<Gasto[]>(GASTOS_SEMILLA);
  const [mesOffset, setMesOffset] = useState(0);
  const [filtro, setFiltro] = useState<string | 'todas'>('todas');
  const [formularioAbierto, setFormularioAbierto] = useState(params.get('nuevo') === '1');

  const fechaBase = new Date(2026, 7, 1); // agosto 2026 — mes vigente de la demo
  fechaBase.setMonth(fechaBase.getMonth() + mesOffset);
  const mesLabel = `${MESES[fechaBase.getMonth()][0].toUpperCase()}${MESES[fechaBase.getMonth()].slice(1)} ${fechaBase.getFullYear()}`;

  // Comparación por PREFIJO del string ISO ("2026-08"), no por Date — `new Date('2026-08-01')`
  // se parsea como medianoche UTC, y en timezones detrás de UTC eso cae en julio: el gasto del
  // día 1 desaparecía del mes y del total (defecto real detectado al probar la pantalla).
  const prefijoMes = `${fechaBase.getFullYear()}-${String(fechaBase.getMonth() + 1).padStart(2, '0')}`;
  const gastosDelMes = useMemo(
    () =>
      gastos
        .filter((g) => g.fecha.startsWith(prefijoMes))
        .filter((g) => filtro === 'todas' || g.categoriaId === filtro)
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
    [gastos, prefijoMes, filtro]
  );

  const totalMes = gastosDelMes.reduce((a, g) => a + g.monto, 0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[24px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Gastos</h1>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMesOffset((m) => m - 1)}
          aria-label="Mes anterior"
          className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] [touch-action:manipulation]"
        >
          <ChevronLeft size={18} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <span className="text-[15px] font-semibold text-[var(--text-primary)]">{mesLabel}</span>
        <button
          type="button"
          onClick={() => setMesOffset((m) => Math.min(m + 1, 0))}
          disabled={mesOffset === 0}
          aria-label="Mes siguiente"
          className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] disabled:opacity-30 [touch-action:manipulation]"
        >
          <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFiltro('todas')}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium [touch-action:manipulation] ${
            filtro === 'todas'
              ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--accent)]'
              : 'border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] text-[var(--text-secondary)]'
          }`}
        >
          Todas
        </button>
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFiltro(c.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium [touch-action:manipulation] ${
              filtro === c.id
                ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--accent)]'
                : 'border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] text-[var(--text-secondary)]'
            }`}
          >
            <c.icono size={13} strokeWidth={2.2} aria-hidden="true" />
            {c.nombre}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-[var(--radius-card)] bg-[var(--surface-2)] px-4 py-3">
        <span className="text-[13px] text-[var(--text-secondary)]">Total del mes</span>
        <span className="text-[18px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
          {formatoCOP(totalMes)}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {formularioAbierto && (
          <FormularioGasto
            onGuardar={(g) => setGastos((prev) => [...prev, { ...g, id: `local-${Date.now()}` }])}
            onCerrar={() => setFormularioAbierto(false)}
          />
        )}
      </AnimatePresence>

      {!formularioAbierto && (
        <button
          type="button"
          onClick={() => setFormularioAbierto(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-dashed border-[color-mix(in_oklab,var(--accent)_40%,transparent)] text-[14px] font-semibold text-[var(--accent)] [touch-action:manipulation]"
        >
          <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
          Nuevo gasto
        </button>
      )}

      {gastosDelMes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] py-10 text-center">
          <Inbox size={28} strokeWidth={1.6} color="var(--text-tertiary)" aria-hidden="true" />
          <p className="text-[14px] text-[var(--text-tertiary)]">
            {filtro === 'todas' ? 'Sin gastos registrados este mes.' : 'Sin gastos en esta categoría.'}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {gastosDelMes.map((g) => {
            const cat = categoriaPorId(g.categoriaId);
            return (
              <li
                key={g.id}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] bg-[var(--surface)] p-3"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-button)] ${
                    cat.color === 'accent' ? 'bg-[var(--accent)]' : 'bg-[var(--accent-2)]'
                  }`}
                >
                  <cat.icono size={16} strokeWidth={2.2} color="var(--bg)" aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-[14px] font-medium text-[var(--text-primary)]">
                    {g.nota || cat.nombre}
                  </span>
                  <span className="block text-[12px] text-[var(--text-tertiary)]">
                    {formatoFecha(g.fecha)} · {g.registradoPor === 'M' ? PAREJA.nombres.m : PAREJA.nombres.s}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-[14px] font-semibold text-[var(--text-primary)]">
                  {formatoCOP(g.monto)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function GastosPage() {
  return (
    <Suspense fallback={null}>
      <GastosInner />
    </Suspense>
  );
}
