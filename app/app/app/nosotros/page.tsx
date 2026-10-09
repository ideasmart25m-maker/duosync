'use client';

// Pantalla NOSOTROS — protagonista: la racha de días conectados (inversión del loop de
// retención, ESTADO.md) + vista previa honesta del catálogo de dinámicas. Los ítems sin
// función real llevan "Próximamente" (regla UX 11: nada tapable sin acción, o se marca así).

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Sparkles, MessageCircleHeart, Utensils, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { InvitarPareja } from '@/components/app/InvitarPareja';
import { obtenerCoupleId } from '@/lib/gastos';
import { obtenerRachaPareja, obtenerConexionDelMes, obtenerNombresPareja } from '@/lib/preguntas';

const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const pad2 = (x: number) => String(x).padStart(2, '0');

const DINAMICAS = [
  { titulo: 'Cena a ciegas', detalle: 'Elige el menú de esta semana sin que tu pareja sepa qué es', icon: Utensils },
  { titulo: '5 preguntas rápidas', detalle: 'Una ronda corta para conocerse un poco más cada día', icon: MessageCircleHeart },
];

export default function NosotrosPage() {
  const [racha, setRacha] = useState(0);
  const [conectados, setConectados] = useState<Set<string>>(new Set());
  // Mes que se está viendo (el de hoy al abrir); se puede ir a meses anteriores y volver.
  const [vista, setVista] = useState(() => {
    const h = new Date();
    return { anio: h.getFullYear(), mes: h.getMonth() + 1 };
  });
  const [nombrePropio, setNombrePropio] = useState('Tú');
  const [nombreOtro, setNombreOtro] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  const supabase = useMemo(() => crearClienteNavegador(), []);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelado) return;

      const cid = await obtenerCoupleId(supabase);
      if (!cid || cancelado) return;
      setCoupleId(cid);

      // Racha, historial de 28 días y nombres reales — antes eran datos de ejemplo fijos
      // (hallazgo de la auditoría 2026-09-08: "X y Y llevan N días" nunca reflejaba lo que la
      // pareja de verdad hacía).
      const [rachaReal, nombres] = await Promise.all([obtenerRachaPareja(supabase, cid), obtenerNombresPareja(supabase, cid, user.id)]);
      if (cancelado) return;
      setRacha(rachaReal);
      setNombrePropio(nombres.propio);
      setNombreOtro(nombres.otro);
    })();
    return () => {
      cancelado = true;
    };
  }, [supabase]);

  // Conexiones del mes visible: se recarga al cambiar de mes.
  useEffect(() => {
    if (!coupleId) return;
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

  // Calendario del mes real: columnas D L M M J V S, con los huecos antes del día 1 y después del último.
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

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Nosotros</h1>

      {coupleId && <InvitarPareja supabase={supabase} coupleId={coupleId} />}

      <div className="rounded-[var(--radius-card)] bg-[var(--accent-2)] p-5 text-[var(--bg)] shadow-[var(--shadow-hero)]">
        <div className="flex items-center gap-2">
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <Flame size={22} strokeWidth={2.4} aria-hidden="true" />
          </motion.span>
          <p className="text-[32px] font-bold tabular-nums [font-family:var(--font-display)]">{racha} días</p>
        </div>
        <p className="mt-1 text-[15px] opacity-85">
          {nombreOtro ? `${nombrePropio} y ${nombreOtro} han` : `${nombrePropio} ha`} respondido su pregunta diaria sin cortar la racha.
        </p>

        <div className="mt-4 flex items-center justify-between">
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
                      activo
                        ? 'bg-[var(--bg)] text-[var(--accent-2)]'
                        : futuro
                          ? 'opacity-35'
                          : 'bg-[color-mix(in_oklab,var(--bg)_15%,transparent)]'
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

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={16} strokeWidth={2.2} color="var(--accent)" aria-hidden="true" />
          <h2 className="text-[19px] font-semibold text-[var(--text-primary)]">Catálogo de dinámicas</h2>
        </div>
        <div className="flex flex-col gap-2.5">
          {DINAMICAS.map((d) => (
            <motion.div
              key={d.titulo}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4 opacity-80 [touch-action:manipulation]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
                <d.icon size={18} strokeWidth={2} color="var(--accent)" aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-semibold text-[var(--text-primary)]">{d.titulo}</span>
                <span className="block text-[12px] text-[var(--text-tertiary)]">{d.detalle}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)] px-2 py-1 text-[12px] font-semibold text-[var(--text-tertiary)]">
                <Lock size={11} strokeWidth={2.2} aria-hidden="true" />
                Próximamente
              </span>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
