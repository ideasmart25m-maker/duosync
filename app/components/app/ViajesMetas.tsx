'use client';

// Viajes dentro de Metas (pedido de la usuaria): un viaje es un proyecto con presupuesto y sus
// gastos se llevan por subcategoría, con la misma dinámica de reparto que los gastos de la casa.
// Sus cuentas entre ustedes siguen saliendo en Gastos ("Cuentas entre ustedes"), por moneda.

import { useEffect, useMemo, useState } from 'react';
import { Plus, MapPin, Loader2, Minus, Trash2, Check, X } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  listarViajes,
  crearViaje,
  eliminarViaje,
  listarGastosDeViajes,
  registrarGastoDeViaje,
  SUBCATEGORIAS_VIAJE,
  type ViajeDB,
  type GastoViajeDB,
  type SubcategoriaViaje,
} from '@/lib/viajes';
import { MONEDAS_VIAJE, formatoMonedaViaje, nombreMoneda } from '@/lib/monedas';
import { eliminarGasto } from '@/lib/gastos';

type GastoConViaje = GastoViajeDB & { viajeId: string };

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function formatoFecha(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${parseInt(d, 10)} de ${MESES[parseInt(m, 10) - 1]}`;
}

const chip = (activo: boolean) =>
  `rounded-full border px-3 py-1.5 text-[12px] font-medium [touch-action:manipulation] ${
    activo
      ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--accent)]'
      : 'border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] text-[var(--text-secondary)]'
  }`;

const campo =
  'h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]';

function FormularioNuevoViaje({ guardando, onGuardar, onCancelar }: { guardando: boolean; onGuardar: (v: { nombre: string; moneda: string; presupuesto: number | null }) => void; onCancelar: () => void }) {
  const [nombre, setNombre] = useState('');
  const [moneda, setMoneda] = useState('USD');
  const [presupuesto, setPresupuesto] = useState('');
  return (
    <form
      className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nombre.trim() || guardando) return;
        onGuardar({ nombre: nombre.trim(), moneda, presupuesto: Number(presupuesto) > 0 ? Number(presupuesto) : null });
      }}
    >
      <p className="text-[15px] font-semibold text-[var(--text-primary)]">Nuevo viaje</p>
      <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Viaje a Orlando" maxLength={60} className={campo} />
      <div className="flex flex-wrap gap-2">
        {MONEDAS_VIAJE.map((m) => (
          <button key={m.codigo} type="button" onClick={() => setMoneda(m.codigo)} className={chip(moneda === m.codigo)}>
            {m.nombre}
          </button>
        ))}
      </div>
      <input
        inputMode="numeric"
        value={presupuesto}
        onChange={(e) => setPresupuesto(e.target.value.replace(/\D/g, ''))}
        placeholder={`Presupuesto del viaje en ${nombreMoneda(moneda).toLowerCase()} (opcional)`}
        className={campo}
      />
      <div className="mt-1 flex gap-2">
        <button type="button" onClick={onCancelar} disabled={guardando} className="flex h-11 flex-1 items-center justify-center rounded-[var(--radius-button)] text-[15px] font-medium text-[var(--text-tertiary)] disabled:opacity-50 [touch-action:manipulation]">
          Cancelar
        </button>
        <button type="submit" disabled={!nombre.trim() || guardando} className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[15px] font-semibold text-[var(--bg)] disabled:opacity-50 [touch-action:manipulation]">
          {guardando && <Loader2 size={16} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />}
          Crear viaje
        </button>
      </div>
    </form>
  );
}

function FormularioGastoViaje({
  guardando,
  moneda,
  nombreOtro,
  onGuardar,
  onCancelar,
}: {
  guardando: boolean;
  moneda: string;
  nombreOtro: string;
  onGuardar: (g: { monto: number; subcategoria: SubcategoriaViaje; nota?: string; splitPercent: number }) => void;
  onCancelar: () => void;
}) {
  const [subcategoria, setSubcategoria] = useState<SubcategoriaViaje>('alojamiento');
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  // Mi parte: el reparto por persona se respeta sin importar quién pague (igual que en Gastos).
  const [miParte, setMiParte] = useState(50);
  return (
    <form
      className="mt-3 flex flex-col gap-2 border-t border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        const valor = Number(monto.replace(',', '.'));
        if (!valor || valor <= 0 || guardando) return;
        // Quien registra fue quien pagó: se guarda SU parte; lo que sobra le toca a su pareja.
        onGuardar({ monto: valor, subcategoria, nota: nota.trim() || undefined, splitPercent: miParte });
      }}
    >
      <div className="flex flex-wrap gap-2">
        {SUBCATEGORIAS_VIAJE.map((s) => (
          <button key={s.clave} type="button" onClick={() => setSubcategoria(s.clave)} className={chip(subcategoria === s.clave)}>
            {s.nombre}
          </button>
        ))}
      </div>
      <input
        inputMode="decimal"
        value={monto}
        onChange={(e) => setMonto(e.target.value.replace(/[^\d.,]/g, ''))}
        placeholder={`Monto en ${nombreMoneda(moneda).toLowerCase()}`}
        className={campo}
      />
      <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional)" maxLength={140} className={campo} />
      <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
        <span>
          Te toca a ti <span className="font-semibold text-[var(--text-primary)]">{miParte}%</span> · a {nombreOtro}{' '}
          <span className="font-semibold text-[var(--text-primary)]">{100 - miParte}%</span>
        </span>
        <span className="flex items-center gap-1.5">
          <button type="button" disabled={miParte <= 0} onClick={() => setMiParte((p) => Math.max(0, p - 10))} aria-label="Bajar tu parte" className="flex size-7 items-center justify-center rounded-full bg-[var(--surface-2)] disabled:opacity-40 [touch-action:manipulation]">
            <Minus size={12} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <button type="button" disabled={miParte >= 100} onClick={() => setMiParte((p) => Math.min(100, p + 10))} aria-label="Subir tu parte" className="flex size-7 items-center justify-center rounded-full bg-[var(--surface-2)] disabled:opacity-40 [touch-action:manipulation]">
            <Plus size={12} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </span>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancelar} disabled={guardando} className="flex h-11 flex-1 items-center justify-center rounded-[var(--radius-button)] text-[15px] font-medium text-[var(--text-tertiary)] disabled:opacity-50 [touch-action:manipulation]">
          Cancelar
        </button>
        <button type="submit" disabled={!monto || guardando} className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[15px] font-semibold text-[var(--bg)] disabled:opacity-50 [touch-action:manipulation]">
          {guardando ? <Loader2 size={16} strokeWidth={2.4} className="animate-spin" aria-hidden="true" /> : <Check size={16} strokeWidth={2.4} aria-hidden="true" />}
          Guardar gasto
        </button>
      </div>
    </form>
  );
}

function TarjetaViaje({
  viaje,
  gastos,
  miUserId,
  nombreOtro,
  onGastoRegistrado,
  onGastoEliminado,
  onViajeEliminado,
  supabase,
  coupleId,
}: {
  viaje: ViajeDB;
  gastos: GastoConViaje[];
  miUserId: string | null;
  nombreOtro: string;
  onGastoRegistrado: (g: GastoConViaje) => void;
  onGastoEliminado: (id: string) => void;
  onViajeEliminado: (id: string) => void;
  supabase: SupabaseClient;
  coupleId: string;
}) {
  const [registrando, setRegistrando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmandoBorrarViaje, setConfirmandoBorrarViaje] = useState(false);
  const [borrandoGasto, setBorrandoGasto] = useState<string | null>(null);

  const total = gastos.reduce((a, g) => a + g.monto, 0);
  const porSubcategoria = SUBCATEGORIAS_VIAJE.map((s) => ({ ...s, total: gastos.filter((g) => g.subcategoria === s.clave).reduce((a, g) => a + g.monto, 0) }));
  const pct = viaje.presupuesto ? Math.min(100, Math.round((total / viaje.presupuesto) * 100)) : 0;
  const pasado = viaje.presupuesto !== null && total > viaje.presupuesto;
  const f = (n: number) => formatoMonedaViaje(n, viaje.moneda);

  const guardarGasto = async (g: { monto: number; subcategoria: SubcategoriaViaje; nota?: string; splitPercent: number }) => {
    setGuardando(true);
    setError(null);
    try {
      const nuevo = await registrarGastoDeViaje(supabase, coupleId, viaje, g);
      onGastoRegistrado(nuevo);
      setRegistrando(false);
    } catch {
      setError('No pudimos guardar el gasto. Intenten de nuevo en un momento.');
    } finally {
      setGuardando(false);
    }
  };

  const borrarGasto = async (id: string) => {
    setBorrandoGasto(id);
    try {
      await eliminarGasto(supabase, id);
      onGastoEliminado(id);
    } catch {
      setError('No pudimos eliminar el gasto.');
    } finally {
      setBorrandoGasto(null);
    }
  };

  const borrarViaje = async () => {
    try {
      await eliminarViaje(supabase, viaje.id);
      onViajeEliminado(viaje.id);
    } catch {
      setError('No pudimos eliminar el viaje.');
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--accent-2)_40%,transparent)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-[15px] font-semibold text-[var(--text-primary)]">
          <MapPin size={15} strokeWidth={2.2} color="var(--accent-2)" aria-hidden="true" />
          <span className="truncate">{viaje.nombre}</span>
        </p>
        <span className="shrink-0 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[12px] font-medium text-[var(--text-secondary)]">{nombreMoneda(viaje.moneda)}</span>
      </div>

      <p className="mt-2 text-[28px] font-bold tabular-nums leading-tight text-[var(--text-primary)] [font-family:var(--font-display)]">{f(total)}</p>
      <p className="text-[12px] text-[var(--text-tertiary)]">
        {viaje.presupuesto ? (
          <>
            gastado de <span className="font-semibold tabular-nums">{f(viaje.presupuesto)}</span> de presupuesto{pasado ? ' — se pasaron' : ''}
          </>
        ) : (
          'gastado en el viaje'
        )}
      </p>
      {viaje.presupuesto && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pasado ? 'var(--danger)' : 'var(--accent-2)' }} />
        </div>
      )}

      <ul className="mt-3 flex flex-col gap-1.5">
        {porSubcategoria.map((s) => (
          <li key={s.clave} className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--text-secondary)]">{s.nombre}</span>
            <span className="tabular-nums font-semibold text-[var(--text-primary)]">{f(s.total)}</span>
          </li>
        ))}
      </ul>

      {registrando ? (
        <FormularioGastoViaje guardando={guardando} moneda={viaje.moneda} nombreOtro={nombreOtro} onGuardar={guardarGasto} onCancelar={() => setRegistrando(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setRegistrando(true)}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-dashed border-[color-mix(in_oklab,var(--accent)_40%,transparent)] text-[14px] font-semibold text-[var(--accent)] [touch-action:manipulation]"
        >
          <Plus size={15} strokeWidth={2.4} aria-hidden="true" />
          Registrar gasto del viaje
        </button>
      )}

      {error && <p className="mt-2 text-[12px] font-medium text-[var(--danger)]">{error}</p>}

      {gastos.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)] border-t border-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)]">
          {gastos.map((g) => (
            <li key={g.id} className="flex items-center gap-2 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-[var(--text-primary)]">
                  {SUBCATEGORIAS_VIAJE.find((s) => s.clave === g.subcategoria)?.nombre ?? 'Gasto'}
                  {g.nota ? ` · ${g.nota}` : ''}
                </span>
                <span className="block text-[12px] text-[var(--text-tertiary)]">
                  {formatoFecha(g.fecha)} · {g.registradoPor === miUserId ? 'Tú' : nombreOtro}
                </span>
              </span>
              <span className="shrink-0 tabular-nums text-[13px] font-semibold text-[var(--text-primary)]">{f(g.monto)}</span>
              <button
                type="button"
                onClick={() => borrarGasto(g.id)}
                disabled={borrandoGasto === g.id}
                aria-label="Eliminar gasto del viaje"
                className="flex size-8 shrink-0 items-center justify-center text-[var(--text-tertiary)] disabled:opacity-50 [touch-action:manipulation]"
              >
                {borrandoGasto === g.id ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Trash2 size={14} strokeWidth={2.2} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">Lo que se deben por este viaje aparece en Gastos, en &quot;Cuentas entre ustedes&quot;.</p>

      {confirmandoBorrarViaje ? (
        <div className="mt-2 flex items-center justify-end gap-2">
          <span className="mr-auto text-[12px] text-[var(--text-secondary)]">¿Eliminar el viaje y todos sus gastos?</span>
          <button type="button" onClick={() => setConfirmandoBorrarViaje(false)} className="flex h-9 items-center px-3 text-[12px] font-medium text-[var(--text-secondary)] [touch-action:manipulation]">
            <X size={14} aria-hidden="true" />
          </button>
          <button type="button" onClick={borrarViaje} className="flex h-9 items-center rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] px-3 text-[12px] font-semibold text-[var(--danger)] [touch-action:manipulation]">
            Sí, eliminar
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmandoBorrarViaje(true)} className="mt-2 text-[12px] font-medium text-[var(--text-tertiary)] underline [touch-action:manipulation]">
          Eliminar viaje
        </button>
      )}
    </div>
  );
}

export function ViajesMetas({ supabase, coupleId, nombreOtro }: { supabase: SupabaseClient; coupleId: string; nombreOtro: string }) {
  const [viajes, setViajes] = useState<ViajeDB[]>([]);
  const [gastos, setGastos] = useState<GastoConViaje[]>([]);
  const [miUserId, setMiUserId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [{ data }, vs, gs] = await Promise.all([supabase.auth.getUser(), listarViajes(supabase, coupleId), listarGastosDeViajes(supabase, coupleId)]);
        if (cancelado) return;
        setMiUserId(data.user?.id ?? null);
        setViajes(vs);
        setGastos(gs);
      } catch {
        if (!cancelado) setError('No pudimos cargar sus viajes.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [supabase, coupleId]);

  const gastosPorViaje = useMemo(() => {
    const mapa = new Map<string, GastoConViaje[]>();
    for (const g of gastos) mapa.set(g.viajeId, [...(mapa.get(g.viajeId) ?? []), g]);
    return mapa;
  }, [gastos]);

  const crear = async (v: { nombre: string; moneda: string; presupuesto: number | null }) => {
    setGuardando(true);
    setError(null);
    try {
      const nuevo = await crearViaje(supabase, coupleId, v);
      setViajes((prev) => [nuevo, ...prev]);
      setCreando(false);
    } catch {
      setError('No pudimos crear el viaje. Intenten de nuevo en un momento.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)]" />;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Viajes</h2>
      {error && <p className="text-[12px] font-medium text-[var(--danger)]">{error}</p>}

      {viajes.map((v) => (
        <TarjetaViaje
          key={v.id}
          viaje={v}
          gastos={gastosPorViaje.get(v.id) ?? []}
          miUserId={miUserId}
          nombreOtro={nombreOtro}
          supabase={supabase}
          coupleId={coupleId}
          onGastoRegistrado={(g) => setGastos((prev) => [g, ...prev])}
          onGastoEliminado={(id) => setGastos((prev) => prev.filter((g) => g.id !== id))}
          onViajeEliminado={(id) => {
            setViajes((prev) => prev.filter((x) => x.id !== id));
            setGastos((prev) => prev.filter((g) => g.viajeId !== id));
          }}
        />
      ))}

      {creando ? (
        <FormularioNuevoViaje guardando={guardando} onGuardar={crear} onCancelar={() => setCreando(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-dashed border-[color-mix(in_oklab,var(--accent-2)_45%,transparent)] text-[15px] font-semibold text-[var(--accent-2)] [touch-action:manipulation]"
        >
          <MapPin size={16} strokeWidth={2.4} aria-hidden="true" />
          Nuevo viaje
        </button>
      )}
    </section>
  );
}
