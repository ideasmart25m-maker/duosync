'use client';

// Pantalla METAS — protagonista: el progreso de la meta de ahorro compartida, con la misma
// metáfora semilla→árbol-con-frutos del Hero de la landing (dispositivo ownable reutilizado,
// no reinventado — FICHA-ARTE.md). Acción primaria: aportar a la meta.

import { useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { animate } from 'motion/react';
import { useEffect } from 'react';
import { Sprout, TreeDeciduous, Trees, Apple, Plus, CalendarDays, Pencil, Check } from 'lucide-react';
import { META_AHORRO } from '@/lib/seed-datos';
import { crearClienteNavegador } from '@/lib/supabase/client';
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

export default function MetasPage() {
  const reducido = useReducedMotion();
  const [montoActual, setMontoActual] = useState(META_AHORRO.montoActual);
  const [celebrar, setCelebrar] = useState(false);
  const [aportando, setAportando] = useState(false);
  const [montoAporte, setMontoAporte] = useState('');
  const [pais, setPais] = useState<string | null>(null);
  const [nombreMeta, setNombreMeta] = useState(META_AHORRO.nombre);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [borradorNombre, setBorradorNombre] = useState(nombreMeta);
  const montoMostrado = useCountUp(montoActual);

  useEffect(() => {
    // Mismo dato real que Hoy — el resto de esta pantalla sigue en datos de ejemplo (ver ESTADO.md).
    (async () => {
      const supabase = crearClienteNavegador();
      const { data: membresia } = await supabase.from('couple_members').select('couple_id').limit(1).maybeSingle();
      if (!membresia) return;
      const { data: pareja } = await supabase.from('couples').select('pais').eq('id', membresia.couple_id).maybeSingle();
      setPais(pareja?.pais ?? null);
    })();
  }, []);
  const pct = Math.min(100, Math.round((montoActual / META_AHORRO.montoObjetivo) * 100));

  const confirmarAporte = () => {
    const valor = Number(montoAporte);
    if (!valor || valor <= 0) return;
    setMontoActual((m) => Math.min(META_AHORRO.montoObjetivo, m + valor));
    setCelebrar(true);
    setTimeout(() => setCelebrar(false), 900);
    setMontoAporte('');
    setAportando(false);
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
    // flex-1 + justify-center: con una sola meta activa, el contenido se centra en el
    // espacio disponible en vez de dejar ~40% del viewport en blanco debajo del botón
    // "Nueva meta juntos" (defecto real detectado en la auditoría).
    <div className="flex flex-1 flex-col justify-center gap-5">
      <h1 className="text-[24px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Metas</h1>

      <div className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
        <div className="flex items-center justify-between gap-2">
          {editandoNombre ? (
            <form
              className="flex flex-1 items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (borradorNombre.trim()) setNombreMeta(borradorNombre.trim());
                setEditandoNombre(false);
              }}
            >
              <input
                autoFocus
                value={borradorNombre}
                onChange={(e) => setBorradorNombre(e.target.value)}
                maxLength={40}
                className="h-9 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-2 text-[15px] font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
              <button type="submit" aria-label="Guardar nombre" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)] [touch-action:manipulation]">
                <Check size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setBorradorNombre(nombreMeta);
                setEditandoNombre(true);
              }}
              className="flex items-center gap-1.5 text-left [touch-action:manipulation]"
            >
              <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">{nombreMeta}</h2>
              <Pencil size={13} strokeWidth={2.2} color="var(--text-tertiary)" aria-hidden="true" />
            </button>
          )}
          <motion.span
            key={celebrar ? 'on' : 'off'}
            animate={celebrar ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-[15px] font-bold tabular-nums text-[var(--accent)]"
          >
            {pct}%
          </motion.span>
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
          <CalendarDays size={13} strokeWidth={2} aria-hidden="true" />
          Meta para el {fechaLarga(META_AHORRO.fechaObjetivo)}
        </p>

        <p className="mt-4 text-[30px] font-bold tabular-nums leading-tight text-[var(--text-primary)] [font-family:var(--font-display)]">
          {formatoMoneda(montoMostrado, pais)}
        </p>
        <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">
          de <span className="font-semibold tabular-nums">{formatoMoneda(META_AHORRO.montoObjetivo, pais)}</span> — su meta total
        </p>

        {/* La semilla que siembran hoy se vuelve el árbol de su meta cumplida — misma
            metáfora del Hero de la landing, ahora con más espacio y detalle. */}
        <div className="relative mt-6 flex h-9 items-center justify-between">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)]" />
          <motion.div
            className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--accent)]"
            initial={{ width: reducido ? `${pct}%` : 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
          {nodos.map((n, i) => (
            <span
              key={i}
              className={`relative z-10 flex size-9 items-center justify-center rounded-full ${
                n.activo
                  ? i === nodos.length - 1
                    ? 'bg-[var(--accent-2)]'
                    : 'bg-[var(--accent)]'
                  : 'border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] opacity-60'
              }`}
            >
              <n.icono size={17} strokeWidth={2.2} color={n.activo ? 'var(--bg)' : 'var(--text-tertiary)'} aria-hidden="true" />
            </span>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[12px] text-[var(--text-tertiary)]">
          <span>Hoy siembran</span>
          <span>Su meta, cumplida</span>
        </div>

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
                className="h-12 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[16px] tabular-nums text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAportando(false);
                    setMontoAporte('');
                  }}
                  className="flex h-11 flex-1 items-center justify-center rounded-[var(--radius-button)] text-[14px] font-medium text-[var(--text-tertiary)] [touch-action:manipulation]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!montoAporte}
                  className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)] disabled:opacity-50 [touch-action:manipulation]"
                >
                  <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
                  Confirmar aporte
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
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[15px] font-semibold text-[var(--bg)] disabled:opacity-50 [touch-action:manipulation]"
            >
              <Plus size={17} strokeWidth={2.4} aria-hidden="true" />
              {pct >= 100 ? 'Meta cumplida' : 'Aportar a la meta'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-dashed border-[color-mix(in_oklab,var(--accent)_35%,transparent)] text-[14px] font-semibold text-[var(--accent)] [touch-action:manipulation]"
      >
        <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
        Nueva meta juntos
      </button>
    </div>
  );
}
