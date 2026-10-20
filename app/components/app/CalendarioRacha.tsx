'use client';

// "Su racha": ventana con el calendario del mes real y los días en que los dos respondieron la pregunta. Se abre
// al tocar la planta de Inicio. (Antes vivía en la pantalla Nosotros, que ya no existe.)

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Flame, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { obtenerConexionDelMes } from '@/lib/preguntas';
import { PlantaRacha, etapaDeRacha } from '@/components/app/PlantaRacha';

const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const pad2 = (x: number) => String(x).padStart(2, '0');

export function CalendarioRacha({
  supabase,
  coupleId,
  racha,
  onCerrar,
}: {
  supabase: SupabaseClient;
  coupleId: string;
  racha: number;
  onCerrar: () => void;
}) {
  const [conectados, setConectados] = useState<Set<string>>(new Set());
  const [vista, setVista] = useState(() => {
    const h = new Date();
    return { anio: h.getFullYear(), mes: h.getMonth() + 1 };
  });

  useEffect(() => {
    let cancelado = false;
    obtenerConexionDelMes(supabase, coupleId, vista.anio, vista.mes)
      .then((f) => !cancelado && setConectados(new Set(f)))
      .catch(() => !cancelado && setConectados(new Set()));
    return () => {
      cancelado = true;
    };
  }, [supabase, coupleId, vista]);

  const ahora = new Date();
  const hoyClave = `${ahora.getFullYear()}-${pad2(ahora.getMonth() + 1)}-${pad2(ahora.getDate())}`;
  const esMesActual = vista.anio === ahora.getFullYear() && vista.mes === ahora.getMonth() + 1;

  const semanas = useMemo(() => {
    const primero = new Date(vista.anio, vista.mes - 1, 1);
    const diasDelMes = new Date(vista.anio, vista.mes, 0).getDate();
    const celdas: (number | null)[] = [...Array<null>(primero.getDay()).fill(null)];
    for (let d = 1; d <= diasDelMes; d++) celdas.push(d);
    while (celdas.length % 7 !== 0) celdas.push(null);
    const filas: (number | null)[][] = [];
    for (let k = 0; k < celdas.length; k += 7) filas.push(celdas.slice(k, k + 7));
    return filas;
  }, [vista]);

  const cambiarMes = (delta: number) =>
    setVista((v) => {
      const d = new Date(v.anio, v.mes - 1 + delta, 1);
      return { anio: d.getFullYear(), mes: d.getMonth() + 1 };
    });

  const etapa = etapaDeRacha(racha);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_oklab,black_45%,transparent)] sm:items-center" role="dialog" aria-modal="true" aria-label="Su racha">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-[var(--radius-card)] bg-[var(--bg)] p-5 shadow-[var(--shadow-2)] sm:rounded-[var(--radius-card)]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Su racha</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex size-9 items-center justify-center text-[var(--text-tertiary)] [touch-action:manipulation]">
            <X size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <PlantaRacha dias={racha} className="size-20 shrink-0" />
          <div>
            <p className="flex items-center gap-1.5 text-[24px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
              <Flame size={20} strokeWidth={2.4} color="var(--accent)" aria-hidden="true" />
              {racha} {racha === 1 ? 'día' : 'días'}
            </p>
            <p className="text-[13px] leading-snug text-[var(--text-secondary)]">
              {etapa.nombre}.{' '}
              {etapa.faltan !== null
                ? `Faltan ${etapa.faltan} ${etapa.faltan === 1 ? 'día' : 'días'} para la siguiente etapa.`
                : 'Llegaron a lo más alto. Sigan cuidándola.'}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          Un día cuenta cuando <span className="font-semibold text-[var(--text-primary)]">los dos</span> responden la pregunta del día. Si uno la deja pasar, la racha vuelve a empezar.
        </p>

        <div className="mt-4 rounded-[var(--radius-card)] bg-[var(--accent-2)] p-4 text-[var(--bg)]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              aria-label="Mes anterior"
              className="flex size-9 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--bg)_15%,transparent)] [touch-action:manipulation]"
            >
              <ChevronLeft size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <p className="text-[15px] font-semibold capitalize">
              {MESES[vista.mes - 1]} {vista.anio}
            </p>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              disabled={esMesActual}
              aria-label="Mes siguiente"
              className="flex size-9 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--bg)_15%,transparent)] disabled:opacity-30 [touch-action:manipulation]"
            >
              <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex justify-between text-[12px] font-medium uppercase tracking-[0.04em] opacity-70">
              {DIAS_SEMANA.map((d, i) => (
                <span key={i} className="w-8 text-center">
                  {d}
                </span>
              ))}
            </div>
            {semanas.map((semana, i) => (
              <div key={i} className="flex justify-between">
                {semana.map((dia, j) => {
                  if (dia === null) return <span key={j} className="size-8" aria-hidden="true" />;
                  const clave = `${vista.anio}-${pad2(vista.mes)}-${pad2(dia)}`;
                  const activo = conectados.has(clave);
                  const esHoy = clave === hoyClave;
                  const futuro = clave > hoyClave;
                  const nombreDia = new Date(vista.anio, vista.mes - 1, dia).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
                  return (
                    <span
                      key={j}
                      title={nombreDia}
                      aria-label={`${nombreDia}${esHoy ? ', hoy' : ''}: ${futuro ? 'todavía no llega' : activo ? 'día conectado' : 'sin registrar'}`}
                      className={`flex size-8 items-center justify-center rounded-[10px] text-[12px] font-semibold tabular-nums ${
                        activo ? 'bg-[var(--bg)] text-[var(--accent-2)]' : futuro ? 'opacity-35' : 'bg-[color-mix(in_oklab,var(--bg)_15%,transparent)]'
                      } ${esHoy ? 'ring-2 ring-[var(--bg)] ring-offset-2 ring-offset-[var(--accent-2)]' : ''}`}
                    >
                      {dia}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
