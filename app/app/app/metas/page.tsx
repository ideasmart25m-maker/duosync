'use client';

// Pantalla METAS — protagonista: el progreso de la meta de ahorro compartida, con la misma
// metáfora semilla→árbol-con-frutos del Hero de la landing (dispositivo ownable reutilizado,
// no reinventado — FICHA-ARTE.md). Acción primaria: aportar a la meta.
// Conectada a datos reales de Supabase (pedido real del usuario, 2026-09-07) — antes vivía
// enteramente en datos de ejemplo: solo el nombre "se editaba" (era el único campo guardado en
// el estado del componente), la fecha y el monto objetivo estaban fijos en el código, y
// "+ Nueva meta juntos" no tenía ninguna acción conectada.

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { animate } from 'motion/react';
import { Sprout, TreeDeciduous, Trees, Apple, Plus, CalendarDays, Pencil, Check, X, Loader2, Sparkles } from 'lucide-react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { obtenerCoupleId, obtenerPaisPareja } from '@/lib/gastos';
import { listarMetas, crearMeta, actualizarMeta, aportarAMeta, type MetaDB } from '@/lib/metas';
import { formatoMoneda } from '@/lib/paises';

// Anima CADA VEZ que cambia `target` (desde el último valor mostrado, no siempre desde 0) —
// antes solo corría una vez al montar (`useEffect(..., [])`), así que un aporte nuevo cambiaba
// el % y la barra pero el número grande se quedaba congelado en el valor original (defecto
// real reportado por el usuario: aportó $700.000 y el número en negrilla nunca se movió).
function useCountUp(target: number): number {
  const reducido = useReducedMotion();
  const [valor, setValor] = useState(reducido ? target : 0);
  const anterior = useRef(reducido ? target : 0);
  useEffect(() => {
    if (reducido) {
      setValor(target);
      anterior.current = target;
      return;
    }
    const desde = anterior.current;
    const controls = animate(desde, target, { duration: 0.9, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setValor(Math.round(v)) });
    anterior.current = target;
    return () => controls.stop();
  }, [target, reducido]);
  return valor;
}

function fechaLarga(iso: string): string {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} de ${meses[m - 1]} de ${y}`;
}

// Confeti de burst (Motion — misma librería ya instalada, sin sumar dependencias nuevas):
// una decena de partículas salen desde el centro y caen con gravedad + rotación, SOLO al
// llegar al 100% de la meta (hito real, no cualquier aporte — 11-DISENO-EMOCIONAL: celebrar
// solo lo que de verdad se ganó). Colores de la propia marca, nunca confeti multicolor genérico.
const COLORES_CONFETI = ['var(--bg)', 'var(--accent)', 'var(--cat-amber)'];
function ConfettiMeta() {
  const particulas = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        angulo: (i / 14) * Math.PI * 2 + Math.random() * 0.4,
        distancia: 70 + Math.random() * 50,
        color: COLORES_CONFETI[i % COLORES_CONFETI.length],
        rotacion: Math.random() * 360,
        tamano: 5 + Math.random() * 4,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {particulas.map((p, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: Math.cos(p.angulo) * p.distancia,
            y: Math.sin(p.angulo) * p.distancia + 40,
            opacity: 0,
            rotate: p.rotacion,
          }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute rounded-[2px]"
          style={{ width: p.tamano, height: p.tamano * 2.2, backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

// Formulario compartido por "editar meta" y "nueva meta juntos" — mismos 3 campos reales
// (nombre, monto objetivo, fecha objetivo), la única diferencia es si viene precargado.
function FormularioMeta({
  inicial,
  guardando,
  textoBoton,
  sobreVerde,
  onGuardar,
  onCancelar,
}: {
  inicial?: { nombre: string; montoObjetivo: number; fechaObjetivo: string | null };
  guardando: boolean;
  textoBoton: string;
  // true cuando el formulario vive DENTRO de la tarjeta verde (editar meta existente) — el botón
  // "Cancelar" necesita texto claro en vez del gris pensado para fondo blanco (poco contraste ahí).
  sobreVerde?: boolean;
  onGuardar: (v: { nombre: string; montoObjetivo: number; fechaObjetivo: string | null }) => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [montoObjetivo, setMontoObjetivo] = useState(inicial?.montoObjetivo ? String(inicial.montoObjetivo) : '');
  const [fechaObjetivo, setFechaObjetivo] = useState(inicial?.fechaObjetivo ?? '');

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const valor = Number(montoObjetivo);
        if (!nombre.trim() || !valor || valor <= 0 || guardando) return;
        onGuardar({ nombre: nombre.trim(), montoObjetivo: valor, fechaObjetivo: fechaObjetivo || null });
      }}
    >
      <input
        autoFocus
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre de la meta"
        maxLength={60}
        className="h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[15px] font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
      />
      <input
        inputMode="numeric"
        value={montoObjetivo}
        onChange={(e) => setMontoObjetivo(e.target.value.replace(/\D/g, ''))}
        placeholder="Monto objetivo"
        className="h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[15px] tabular-nums text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
      />
      <input
        type="date"
        value={fechaObjetivo}
        onChange={(e) => setFechaObjetivo(e.target.value)}
        className="h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
      />
      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={onCancelar}
          disabled={guardando}
          className={`flex h-11 flex-1 items-center justify-center rounded-[var(--radius-button)] text-[15px] font-medium disabled:opacity-50 [touch-action:manipulation] ${
            sobreVerde ? 'text-[var(--bg)] opacity-80' : 'text-[var(--text-tertiary)]'
          }`}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!nombre.trim() || !montoObjetivo || guardando}
          className={`flex h-11 flex-[2] items-center justify-center gap-2 rounded-[var(--radius-button)] text-[15px] font-semibold disabled:opacity-50 [touch-action:manipulation] ${
            sobreVerde ? 'bg-[var(--bg)] text-[var(--accent-2)]' : 'bg-[var(--accent)] text-[var(--bg)]'
          }`}
        >
          {guardando && <Loader2 size={16} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />}
          {guardando ? 'Guardando…' : textoBoton}
        </button>
      </div>
    </form>
  );
}

function TarjetaMeta({
  meta,
  pais,
  supabase,
  onActualizada,
}: {
  meta: MetaDB;
  pais: string | null;
  supabase: ReturnType<typeof crearClienteNavegador>;
  onActualizada: (m: MetaDB) => void;
}) {
  const reducido = useReducedMotion();
  const [celebrar, setCelebrar] = useState(false);
  const [metaCumplida, setMetaCumplida] = useState(false);
  const [aportando, setAportando] = useState(false);
  const [montoAporte, setMontoAporte] = useState('');
  const [guardandoAporte, setGuardandoAporte] = useState(false);
  const [editando, setEditando] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const montoMostrado = useCountUp(meta.montoActual);

  const pct = Math.min(100, Math.round((meta.montoActual / meta.montoObjetivo) * 100));

  const confirmarAporte = async () => {
    const valor = Number(montoAporte);
    if (!valor || valor <= 0) return;
    setGuardandoAporte(true);
    setError(null);
    try {
      const pctAntes = pct;
      const actualizado = await aportarAMeta(supabase, meta.id, valor);
      onActualizada(actualizado);
      setCelebrar(true);
      setTimeout(() => setCelebrar(false), 900);
      // El confeti es para el HITO real de completar la meta, no para cualquier aporte — un
      // aporte normal ya tiene su propio feedback (el pop del %, la barra creciendo).
      const pctNuevo = Math.min(100, Math.round((actualizado.montoActual / actualizado.montoObjetivo) * 100));
      if (pctAntes < 100 && pctNuevo >= 100) {
        setMetaCumplida(true);
        setTimeout(() => setMetaCumplida(false), 1000);
      }
      setMontoAporte('');
      setAportando(false);
    } catch {
      setError('No pudimos guardar el aporte. Intenten de nuevo en un momento.');
    } finally {
      setGuardandoAporte(false);
    }
  };

  const guardarEdicion = async (v: { nombre: string; montoObjetivo: number; fechaObjetivo: string | null }) => {
    setGuardandoEdicion(true);
    setError(null);
    try {
      const actualizado = await actualizarMeta(supabase, meta.id, v);
      onActualizada(actualizado);
      setEditando(false);
    } catch {
      setError('No pudimos guardar los cambios. Intenten de nuevo en un momento.');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // 4 etapas visualmente DISTINTAS (defecto real reportado: el paso 2 y 3 usaban el mismo
  // ícono, no se notaba el crecimiento) — semilla → árbol joven → árbol lleno → fruto.
  const nodos = [
    { icono: Sprout, activo: pct >= 0 },
    { icono: TreeDeciduous, activo: pct >= 33 },
    { icono: Trees, activo: pct >= 66 },
    { icono: Apple, activo: pct >= 100 },
  ];

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-[var(--accent-2)] p-5 text-[var(--bg)] shadow-[var(--shadow-hero)]">
      {metaCumplida && <ConfettiMeta />}

      {editando ? (
        <FormularioMeta
          inicial={{ nombre: meta.nombre, montoObjetivo: meta.montoObjetivo, fechaObjetivo: meta.fechaObjetivo }}
          guardando={guardandoEdicion}
          textoBoton="Guardar cambios"
          sobreVerde
          onGuardar={guardarEdicion}
          onCancelar={() => setEditando(false)}
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="flex items-center gap-1.5 text-left [touch-action:manipulation]"
            >
              <h2 className="text-[19px] font-semibold">{meta.nombre}</h2>
              <Pencil size={13} strokeWidth={2.2} className="opacity-70" aria-hidden="true" />
            </button>
            <motion.span
              key={celebrar ? 'on' : 'off'}
              animate={celebrar ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--bg)_18%,transparent)] px-2 py-1 text-[12px] font-bold tabular-nums"
            >
              {pct}%
            </motion.span>
          </div>

          {meta.fechaObjetivo && (
            <p className="mt-1 flex items-center gap-1.5 text-[12px] opacity-80">
              <CalendarDays size={13} strokeWidth={2} aria-hidden="true" />
              Meta para el {fechaLarga(meta.fechaObjetivo)}
            </p>
          )}

          <p className="mt-4 text-[32px] font-bold tabular-nums leading-tight [font-family:var(--font-display)]">
            {formatoMoneda(montoMostrado, pais)}
          </p>
          <p className="mt-0.5 text-[12px] opacity-80">
            de <span className="font-semibold tabular-nums">{formatoMoneda(meta.montoObjetivo, pais)}</span> — su meta total
          </p>

          {/* La semilla que siembran hoy se vuelve el árbol de su meta cumplida — misma
              metáfora del Hero de la landing, ahora con más espacio y detalle. */}
          <div className="relative mt-6 flex h-9 items-center justify-between">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[color-mix(in_oklab,var(--bg)_20%,transparent)]" />
            <motion.div
              className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--bg)]"
              initial={{ width: reducido ? `${pct}%` : 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
            {nodos.map((n, i) => (
              <span
                key={i}
                className={`relative z-10 flex size-9 items-center justify-center rounded-full ${
                  n.activo
                    ? 'bg-[var(--bg)]'
                    : 'border border-[color-mix(in_oklab,var(--bg)_35%,transparent)] bg-[color-mix(in_oklab,var(--bg)_14%,transparent)] opacity-70'
                }`}
              >
                <n.icono size={17} strokeWidth={2.2} color={n.activo ? 'var(--accent-2)' : 'var(--bg)'} aria-hidden="true" />
              </span>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[12px] opacity-80">
            <span>Hoy siembran</span>
            <span>Su meta, cumplida</span>
          </div>

          {error && <p className="mt-3 text-[12px] font-medium">{error}</p>}

          <AnimatePresence initial={false} mode="wait">
            {aportando ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="mt-5 overflow-hidden"
                onSubmit={(e) => {
                  e.preventDefault();
                  confirmarAporte();
                }}
              >
                <input
                  autoFocus
                  inputMode="numeric"
                  value={montoAporte}
                  onChange={(e) => setMontoAporte(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  placeholder="¿Cuánto van a aportar?"
                  style={{ '--focus-ring': 'var(--bg)' } as CSSProperties}
                  className="h-12 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--bg)_30%,transparent)] bg-[color-mix(in_oklab,var(--bg)_12%,transparent)] px-4 text-[16px] tabular-nums text-[var(--bg)] placeholder:text-[color-mix(in_oklab,var(--bg)_65%,transparent)] outline-none focus:border-[var(--bg)]"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAportando(false);
                      setMontoAporte('');
                    }}
                    disabled={guardandoAporte}
                    className="flex h-11 flex-1 items-center justify-center rounded-[var(--radius-button)] text-[15px] font-medium opacity-80 disabled:opacity-50 [touch-action:manipulation]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!montoAporte || guardandoAporte}
                    className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--bg)] text-[15px] font-semibold text-[var(--accent-2)] disabled:opacity-50 [touch-action:manipulation]"
                  >
                    {guardandoAporte ? <Loader2 size={16} strokeWidth={2.4} className="animate-spin" aria-hidden="true" /> : <Plus size={16} strokeWidth={2.4} aria-hidden="true" />}
                    {guardandoAporte ? 'Guardando…' : 'Confirmar aporte'}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.button
                key="boton"
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setAportando(true)}
                disabled={pct >= 100}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--bg)] text-[15px] font-semibold text-[var(--accent-2)] disabled:opacity-50 [touch-action:manipulation]"
              >
                <Plus size={17} strokeWidth={2.4} aria-hidden="true" />
                {pct >= 100 ? 'Meta cumplida' : 'Aportar a la meta'}
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default function MetasPage() {
  const supabase = useMemo(() => crearClienteNavegador(), []);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [pais, setPais] = useState<string | null>(null);
  const [metas, setMetas] = useState<MetaDB[]>([]);
  const [creandoMeta, setCreandoMeta] = useState(false);
  const [guardandoMeta, setGuardandoMeta] = useState(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const cid = await obtenerCoupleId(supabase);
        if (!cid) throw new Error('Todavía no tienen una pareja vinculada.');
        if (cancelado) return;
        setCoupleId(cid);
        const [paisPareja, metasReales] = await Promise.all([obtenerPaisPareja(supabase, cid), listarMetas(supabase, cid)]);
        if (cancelado) return;
        setPais(paisPareja);
        setMetas(metasReales);
      } catch (e) {
        if (!cancelado) setError(e instanceof Error ? e.message : 'No pudimos cargar sus metas.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [supabase]);

  const actualizarEnLista = useCallback((m: MetaDB) => {
    setMetas((prev) => prev.map((x) => (x.id === m.id ? m : x)));
  }, []);

  const crearMetaNueva = async (v: { nombre: string; montoObjetivo: number; fechaObjetivo: string | null }) => {
    if (!coupleId) return;
    setGuardandoMeta(true);
    setError(null);
    try {
      const nueva = await crearMeta(supabase, coupleId, v);
      setMetas((prev) => [...prev, nueva]);
      setCreandoMeta(false);
    } catch {
      setError('No pudimos crear la meta. Intenten de nuevo en un momento.');
    } finally {
      setGuardandoMeta(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Metas</h1>
        <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
      </div>
    );
  }

  if (error && !coupleId) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--danger)_35%,transparent)] py-10 text-center">
        <p className="text-[14px] text-[var(--danger)]">{error}</p>
      </div>
    );
  }

  const sinMetasNiFormulario = metas.length === 0 && !creandoMeta;

  return (
    <div className={`flex flex-1 flex-col gap-4 ${sinMetasNiFormulario ? 'justify-center' : ''}`}>
      <h1 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Metas</h1>

      {error && coupleId && <p className="text-[12px] font-medium text-[var(--danger)]">{error}</p>}

      {sinMetasNiFormulario ? (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
            <Sparkles size={22} strokeWidth={2} color="var(--accent)" aria-hidden="true" />
          </span>
          <p className="text-[15px] font-medium text-[var(--text-primary)]">Todavía no tienen una meta en común.</p>
          <p className="text-[13px] text-[var(--text-tertiary)]">Un viaje, un proyecto, un ahorro para lo que sea — empiecen por ponerle nombre.</p>
        </div>
      ) : (
        metas.map((m) => <TarjetaMeta key={m.id} meta={m} pais={pais} supabase={supabase} onActualizada={actualizarEnLista} />)
      )}

      {creandoMeta ? (
        <div className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">Nueva meta juntos</p>
            <button type="button" onClick={() => setCreandoMeta(false)} aria-label="Cerrar" className="text-[var(--text-tertiary)] [touch-action:manipulation]">
              <X size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
          <FormularioMeta guardando={guardandoMeta} textoBoton="Crear meta" onGuardar={crearMetaNueva} onCancelar={() => setCreandoMeta(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreandoMeta(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-dashed border-[color-mix(in_oklab,var(--accent)_35%,transparent)] text-[15px] font-semibold text-[var(--accent)] [touch-action:manipulation]"
        >
          <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
          Nueva meta juntos
        </button>
      )}
    </div>
  );
}
