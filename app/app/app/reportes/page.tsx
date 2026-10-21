'use client';

// REPORTES — en qué se va el dinero, en una sola mirada. Pedido de la encuesta a usuarios (la pantalla Nosotros no se
// entendía). Un bloque héroe con el mes frente al presupuesto, en qué se va el dinero, quién registró qué, los
// últimos 6 meses y el ahorro en metas. Solo cuentan los gastos en la moneda de la casa; los de viajes van aparte.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { animate, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Inbox, Plus, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { obtenerCoupleId, obtenerPaisPareja, obtenerPresupuestoPareja, listarCategorias } from '@/lib/gastos';
import { listarAportesDelMes } from '@/lib/metas';
import { obtenerNombresPareja } from '@/lib/preguntas';
import { type CategoriaDB } from '@/lib/categorias';
import { formatoMoneda } from '@/lib/paises';
import { evaluarPresupuesto } from '@/lib/presupuesto';
import { claveMes, listarGastosDeRango, porcentajeDe, resumirMes, resumirMesHasta, totalesPorMes, ultimosMeses, variacionPorcentual, type GastoSimple } from '@/lib/reportes';
import { GuiaPagina } from '@/components/app/GuiaPagina';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const tarjeta =
  'rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]';
// Cifras con numerales proporcionales: con los de ancho fijo los puntos de miles se veían muy abiertos.
const cifra = '[font-variant-numeric:lining-nums_proportional-nums]';
const VERDE_2 = 'var(--verde-claro)';

// Cuenta animada del número héroe (de 0 al valor); con "reducir movimiento" aparece directo.
function Contador({ valor, formatear }: { valor: number; formatear: (n: number) => string }) {
  const reducido = useReducedMotion();
  const anterior = useRef(0);
  const [mostrado, setMostrado] = useState(reducido ? valor : 0);
  useEffect(() => {
    if (reducido) {
      setMostrado(valor);
      anterior.current = valor;
      return;
    }
    // La primera vez cuenta desde 0; al cambiar de mes parte del valor que ya se veía (sin saltar a 0).
    const c = animate(anterior.current, valor, { duration: 0.6, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setMostrado(Math.round(v)) });
    anterior.current = valor;
    return () => c.stop();
  }, [valor, reducido]);
  return <>{formatear(mostrado)}</>;
}

// Cifra corta para las barras: 2,2 M · 350 mil.
function compacto(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} mil`;
  return String(Math.round(n));
}

export default function ReportesPage() {
  const supabase = useMemo(() => crearClienteNavegador(), []);
  const reducido = useReducedMotion();

  const [vista, setVista] = useState(() => {
    const h = new Date();
    return { anio: h.getFullYear(), mes: h.getMonth() + 1 };
  });
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [miId, setMiId] = useState<string | null>(null);
  const [inicial, setInicial] = useState(true); // primera carga: skeleton; después, el contenido se atenúa mientras cambia el mes
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gastos, setGastos] = useState<GastoSimple[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDB[]>([]);
  const [pais, setPais] = useState<string | null>(null);
  const [presupuesto, setPresupuesto] = useState<number | null>(null);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [iniciales, setIniciales] = useState<Record<string, string>>({});
  const [ahorroMes, setAhorroMes] = useState<{ total: number; filas: { nombreMeta: string; total: number }[] }>({ total: 0, filas: [] });
  const [intento, setIntento] = useState(0);

  const ahora = new Date();
  const esMesActual = vista.anio === ahora.getFullYear() && vista.mes === ahora.getMonth() + 1;
  const clave = claveMes(vista.anio, vista.mes);
  const meses = useMemo(() => ultimosMeses(vista.anio, vista.mes, 6), [vista]);

  // Datos fijos de la casa.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const cid = await obtenerCoupleId(supabase);
        if (!user || !cid) throw new Error('sin-casa');
        const [cats, paisCasa, presu, nom] = await Promise.all([
          listarCategorias(supabase, cid),
          obtenerPaisPareja(supabase, cid).catch(() => null),
          obtenerPresupuestoPareja(supabase, cid).catch(() => null),
          obtenerNombresPareja(supabase, cid, user.id).catch(() => null),
        ]);
        if (cancelado) return;
        setCategorias(cats);
        setPais(paisCasa);
        setPresupuesto(presu);
        setMiId(user.id);
        const mapa: Record<string, string> = { [user.id]: nom?.propio ? `${nom.propio} (tú)` : 'Tú' };
        if (nom?.idOtro) mapa[nom.idOtro] = nom.otro ?? 'La otra persona';
        setNombres(mapa);
        const ini: Record<string, string> = { [user.id]: (nom?.propio ?? 'T').trim().charAt(0).toUpperCase() || 'T' };
        if (nom?.idOtro) ini[nom.idOtro] = (nom.otro ?? 'O').trim().charAt(0).toUpperCase() || 'O';
        setIniciales(ini);
        setCoupleId(cid);
      } catch (e) {
        console.error('[reportes] datos de la casa', e);
        if (!cancelado) {
          setError('No pudimos cargar sus reportes. Revisa tu conexión e inténtalo de nuevo.');
          setCargando(false);
          setInicial(false);
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [supabase, intento]);

  // Gastos de los 6 meses que terminan en el mes visible, y el ahorro de ese mes.
  useEffect(() => {
    if (!coupleId) return;
    let cancelado = false;
    setCargando(true);
    const siguiente = new Date(vista.anio, vista.mes, 1);
    (async () => {
      try {
        const [lista, aportes] = await Promise.all([
          listarGastosDeRango(supabase, coupleId, meses[0].clave, claveMes(siguiente.getFullYear(), siguiente.getMonth() + 1)),
          listarAportesDelMes(supabase, coupleId, clave).catch(() => []),
        ]);
        if (cancelado) return;
        setGastos(lista);
        setAhorroMes({ total: aportes.reduce((a, x) => a + x.total, 0), filas: aportes });
        setError(null);
      } catch (e) {
        console.error('[reportes] gastos', e);
        if (!cancelado) setError('No pudimos cargar los gastos. Revisa tu conexión e inténtalo de nuevo.');
      } finally {
        if (!cancelado) {
          setCargando(false);
          setInicial(false);
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [supabase, coupleId, vista, clave, meses, intento]);

  const cambiarMes = useCallback(
    (delta: number) =>
      setVista((v) => {
        const d = new Date(v.anio, v.mes - 1 + delta, 1);
        return { anio: d.getFullYear(), mes: d.getMonth() + 1 };
      }),
    []
  );

  const resumen = useMemo(() => resumirMes(gastos, clave), [gastos, clave]);
  // El mes en curso todavía no termina: se compara con el mismo tramo del mes anterior (no con el mes entero).
  const anterior = useMemo(
    () => (esMesActual ? resumirMesHasta(gastos, meses[4].clave, ahora.getDate()) : resumirMes(gastos, meses[4].clave)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `ahora` cambia solo al día siguiente
    [gastos, meses, esMesActual]
  );
  const variacion = variacionPorcentual(resumen.total, anterior.total);
  const totales = useMemo(() => totalesPorMes(gastos, meses), [gastos, meses]);
  const maximo = Math.max(1, presupuesto ?? 0, ...totales.map((t) => t.total));
  const estado = evaluarPresupuesto(resumen.total, presupuesto);
  const dinero = (n: number) => formatoMoneda(n, pais);
  const categoriaPorId = (id: string) => categorias.find((c) => c.id === id);
  const nombreMes = MESES[vista.mes - 1];
  const nombreAnterior = MESES[(vista.mes + 10) % 12];
  // Si el mes anterior tuvo muy poco en el mismo tramo, el porcentaje se dispara (3443 %) y no dice nada útil: ahí se dice en dinero.
  const diferencia = resumen.total - anterior.total;
  const altura = esMesActual ? ' a esta altura' : '';
  const textoVariacion =
    variacion === null
      ? null
      : variacion === 0
        ? `Igual que en ${nombreAnterior}${altura}`
        : Math.abs(variacion) > 100
          ? `${dinero(Math.abs(diferencia))} ${diferencia > 0 ? 'más' : 'menos'} que en ${nombreAnterior}${altura}`
          : `${Math.abs(variacion)}% ${variacion > 0 ? 'más' : 'menos'} que en ${nombreAnterior}${altura}`;
  const hayPresupuesto = presupuesto !== null && presupuesto > 0;
  const mesesConGastos = totales.filter((t, i) => t.total > 0 && !(esMesActual && i === totales.length - 1));
  const promedio = mesesConGastos.length > 0 ? Math.round(mesesConGastos.reduce((a, t) => a + t.total, 0) / mesesConGastos.length) : 0;
  const colorBarra = estado.nivel === 'pasado' ? 'color-mix(in oklab, var(--danger) 70%, var(--bg))' : estado.nivel === 'cerca' ? 'var(--cat-amber)' : 'var(--bg)';
  const crecer = (pct: number) => ({
    initial: reducido ? { width: `${pct}%` } : { width: 0 },
    animate: { width: `${pct}%` },
    transition: { duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const },
  });
  const entrada = (i: number) => ({
    initial: reducido ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay: 0.07 * i, ease: [0.16, 1, 0.3, 1] as const },
  });

  const flechaMes = 'flex size-11 items-center justify-center rounded-full bg-[var(--surface-2)] disabled:opacity-30 [touch-action:manipulation]';

  return (
    <div className="relative flex flex-col gap-4">
      <h1 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Reportes</h1>

      <div className="flex items-center justify-between">
        <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => cambiarMes(-1)} aria-label="Mes anterior" className={flechaMes}>
          <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
        </motion.button>
        <p className="text-[17px] font-semibold capitalize text-[var(--text-primary)]">
          {nombreMes} {vista.anio}
        </p>
        <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => cambiarMes(1)} disabled={esMesActual} aria-label="Mes siguiente" className={flechaMes}>
          <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
        </motion.button>
      </div>

      {error && (
        <div role="alert" className="rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] p-4">
          <p className="text-[14px] font-medium text-[var(--danger)]">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setInicial(true);
              setCargando(true);
              setIntento((n) => n + 1);
            }}
            className="mt-2 min-h-11 text-[14px] font-semibold text-[var(--danger)] underline underline-offset-2 [touch-action:manipulation]"
          >
            Reintentar
          </button>
        </div>
      )}

      {inicial && !error ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          <div className="h-44 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
          <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
        </div>
      ) : !error ? (
        <div className={`flex flex-col gap-4 transition-opacity duration-200 ${cargando ? 'opacity-50' : 'opacity-100'}`}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-20 -z-10 h-72" style={{ background: 'radial-gradient(360px 220px at 50% 30%, color-mix(in oklab, var(--accent-2) 24%, transparent), transparent 70%)' }} />
          {/* 1. Héroe: el mes frente al presupuesto (bloque sólido, el mismo lenguaje que la pregunta de Inicio) */}
          <motion.section
            {...entrada(0)}
            aria-label={`Gastado en ${nombreMes}`}
            className="rounded-[var(--radius-card)] bg-[var(--accent-2)] p-5 text-[var(--bg)] shadow-[var(--shadow-hero)]"
          >
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] opacity-80">Gastado en {nombreMes}</p>
            <p className={`mt-1 text-[32px] font-bold leading-tight [font-family:var(--font-display)] ${cifra}`}>
              <span aria-hidden="true">
                <Contador valor={resumen.total} formatear={dinero} />
              </span>
              <span className="sr-only" aria-live="polite">{`Gastado en ${nombreMes}: ${dinero(resumen.total)}`}</span>
            </p>
            {hayPresupuesto && (
              <>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className={`text-[14px] opacity-85 ${cifra}`}>de {dinero(presupuesto)} de presupuesto</p>
                  <span className="shrink-0 rounded-full bg-[color-mix(in_oklab,var(--bg)_20%,transparent)] px-2.5 py-0.5 text-[14px] font-bold">{estado.porcentaje}%</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--bg)_30%,transparent)]">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: colorBarra }} {...crecer(Math.min(100, estado.porcentaje))} />
                </div>
                <p className={`mt-2 text-[13px] opacity-90 ${cifra}`}>
                  {estado.nivel === 'pasado' ? `Se pasaron por ${dinero(estado.excedido)}` : `Les quedan ${dinero(estado.restante)} este mes`}
                </p>
              </>
            )}
            {variacion !== null && (
              <p className="mt-2 flex items-center gap-1.5 text-[13px] opacity-90">
                {variacion > 0 ? <TrendingUp size={15} strokeWidth={2.2} aria-hidden="true" /> : variacion < 0 ? <TrendingDown size={15} strokeWidth={2.2} aria-hidden="true" /> : <Minus size={15} strokeWidth={2.2} aria-hidden="true" />}
                {textoVariacion}
              </p>
            )}
            {!hayPresupuesto && (
              <p className="mt-2 text-[13px] opacity-90">
                Definan su presupuesto en{' '}
                <Link href="/app/hoy#presupuesto-mensual" className="font-semibold underline underline-offset-2">
                  Inicio
                </Link>{' '}
                para ver aquí cuánto les queda.
              </p>
            )}
          </motion.section>

          <GuiaPagina
            id="reportes"
            abrirPrimeraVez={false}
            items={[
              { titulo: 'Resumen del mes', texto: 'Cuánto gastaron frente a su presupuesto y cómo van frente al mes anterior.' },
              { titulo: 'En qué se va el dinero', texto: 'Las categorías que más pesan este mes.' },
              { titulo: 'Quién registró qué', texto: 'Lo que anotó cada uno, para ver si el aporte está equilibrado.' },
              { titulo: 'Últimos 6 meses', texto: 'Para ver si el gasto sube o baja con el tiempo. Cambien de mes con las flechas.' },
            ]}
          />

          {resumen.cantidad === 0 ? (
            <motion.div {...entrada(1)} className={`${tarjeta} flex flex-col items-center gap-3 py-8 text-center`}>
              <span className="flex size-14 items-center justify-center rounded-full bg-[var(--surface-2)]">
                <Inbox size={24} strokeWidth={1.8} color="var(--text-tertiary)" aria-hidden="true" />
              </span>
              <p className="text-[17px] font-semibold text-[var(--text-primary)]">{esMesActual ? `Todavía no hay gastos en ${nombreMes}` : `No hubo gastos en ${nombreMes}`}</p>
              <p className="max-w-[260px] text-[14px] text-[var(--text-secondary)]">
                {esMesActual ? 'Apenas anoten el primero, aquí van a ver en qué se va el dinero.' : 'Prueben con otro mes con las flechas de arriba.'}
              </p>
              {esMesActual && (
                <Link
                  href="/app/gastos?nuevo=1"
                  className="flex h-11 items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[15px] font-semibold text-[var(--bg)] [touch-action:manipulation]"
                >
                  <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
                  Registrar gasto
                </Link>
              )}
            </motion.div>
          ) : (
            <>
              {/* 2. En qué se va el dinero: un solo color, la intensidad marca el orden */}
              <motion.section {...entrada(1)} className={tarjeta} aria-label="En qué se va el dinero">
                <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">En qué se va el dinero</h2>
                <ul className="mt-3 flex flex-col gap-3">
                  {resumen.porCategoria.slice(0, 5).map((f, i) => {
                    const c = categoriaPorId(f.id);
                    const pct = porcentajeDe(f.total, resumen.total);
                    const ancho = resumen.porCategoria[0].total > 0 ? Math.round((f.total / resumen.porCategoria[0].total) * 100) : 0;
                    return (
                      <li key={f.id}>
                        <div className="flex items-baseline justify-between gap-2 text-[14px]">
                          <span className="truncate font-medium text-[var(--text-primary)]">{c?.nombre ?? 'Otra'}</span>
                          <span className={`shrink-0 text-[var(--text-secondary)] ${cifra}`}>
                            {dinero(f.total)} · {pct}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                          <motion.div className="h-full rounded-full" style={{ backgroundColor: i === 0 ? 'var(--accent-2)' : VERDE_2 }} {...crecer(ancho)} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {resumen.porCategoria.length > 5 && (
                  <p className="mt-3 text-[13px] text-[var(--text-secondary)]">
                    y {resumen.porCategoria.length - 5} {resumen.porCategoria.length - 5 === 1 ? 'categoría más' : 'categorías más'}
                  </p>
                )}
              </motion.section>

              {/* 3. Quién registró qué: color fijo por persona (tú, siempre verde oscuro) */}
              <motion.section {...entrada(2)} className={tarjeta} aria-label="Quién registró qué">
                <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">Quién registró qué</h2>
                <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                  {resumen.porPersona.map((f) => (
                    <motion.div
                      key={f.id}
                      className="h-full"
                      style={{ backgroundColor: f.id === miId ? 'var(--accent-2)' : 'var(--accent)' }}
                      initial={reducido ? false : { width: 0 }}
                      animate={{ width: `${porcentajeDe(f.total, resumen.total)}%` }}
                      transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    />
                  ))}
                </div>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {resumen.porPersona.map((f) => (
                    <li key={f.id} className="flex items-center justify-between text-[14px]">
                      <span className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                        <span
                          className="flex size-7 items-center justify-center rounded-full text-[12px] font-bold text-[var(--bg)]"
                          style={{ backgroundColor: f.id === miId ? 'var(--accent-2)' : 'var(--accent)' }}
                          aria-hidden="true"
                        >
                          {iniciales[f.id] ?? '?'}
                        </span>
                        {nombres[f.id] ?? 'Otra persona'}
                      </span>
                      <span className={`text-[var(--text-secondary)] ${cifra}`}>
                        {dinero(f.total)} · {porcentajeDe(f.total, resumen.total)}%
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[13px] leading-snug text-[var(--text-secondary)]">
                  Es lo que anotó cada uno, no lo que le corresponde. Para saber quién le debe a quién, vean “Cuentas entre ustedes” en{' '}
                  <Link href="/app/gastos" className="font-semibold text-[var(--accent)] underline underline-offset-2">
                    Gastos
                  </Link>
                  .
                </p>
              </motion.section>
            </>
          )}

          {/* 4. Últimos 6 meses, con el valor sobre cada barra y una frase que lo interpreta */}
          <motion.section {...entrada(3)} className={`${tarjeta} bg-[color-mix(in_oklab,var(--accent-2)_5%,var(--surface))] p-5`} aria-label="Últimos 6 meses">
            <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">Últimos 6 meses</h2>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
              {promedio > 0
                ? `En los meses completos gastaron en promedio ${dinero(promedio)}${hayPresupuesto ? `; su presupuesto es de ${dinero(presupuesto)}` : ''}.`
                : 'Todavía no hay gastos en estos meses.'}
            </p>
            <div role="img" aria-label={`Gasto por mes: ${totales.map((t) => `${MESES[Number(t.clave.slice(5)) - 1]} ${dinero(t.total)}`).join(', ')}`}>
              <div className="relative mt-7 h-36">
                {hayPresupuesto && (
                  <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-[var(--text-secondary)]" style={{ bottom: `${(presupuesto / maximo) * 100}%` }} aria-hidden="true">
                    <span className="absolute -top-5 left-0 rounded bg-[var(--surface)] pr-1 text-[12px] font-medium text-[var(--text-secondary)]">Presupuesto · {compacto(presupuesto)}</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-end gap-2">
                  {totales.map((t, i) => {
                    const alto = Math.max(3, (t.total / maximo) * 100);
                    const actual = i === totales.length - 1;
                    return (
                      <div key={t.clave} className="relative h-full flex-1">
                        {t.total > 0 ? (
                          <>
                            <motion.div
                              className="absolute inset-x-0 bottom-0 rounded-t-[8px]"
                              style={{ backgroundColor: actual ? 'var(--accent-2)' : VERDE_2 }}
                              initial={reducido ? { height: `${alto}%` } : { height: 0 }}
                              animate={{ height: `${alto}%` }}
                              transition={{ duration: 0.6, delay: 0.05 * i + 0.15, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-1.5 flex gap-2">
                {totales.map((t, i) => {
                  const actual = i === totales.length - 1;
                  return (
                    <span key={t.clave} className="flex flex-1 flex-col items-center text-center">
                      <span className={`text-[12px] ${actual ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{MESES_CORTOS[Number(t.clave.slice(5)) - 1]}</span>
                      <span className={`text-[13px] ${actual ? 'font-bold' : 'font-semibold'} text-[var(--text-primary)] ${cifra}`}>{t.total > 0 ? compacto(t.total) : <span className="text-[12px] font-normal text-[var(--text-secondary)]">sin datos</span>}</span>
                    </span>
                  );
                })}
              </div>
            </div>
            <p className="mt-3 text-[13px] text-[var(--text-secondary)]">Gastos en la moneda de la casa. Los de viajes (otra moneda) están aparte, en{' '}<Link href="/app/metas" className="font-semibold text-[var(--accent)] underline underline-offset-2">Metas</Link>.</p>
          </motion.section>

          {/* 5. Ahorro en metas */}
          <motion.section {...entrada(4)} className={tarjeta} aria-label="Ahorro en metas">
            <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">Ahorro en metas</h2>
            {ahorroMes.total > 0 ? (
              <>
                <p className={`mt-1 text-[22px] font-bold text-[var(--accent-2)] [font-family:var(--font-display)] ${cifra}`}>{dinero(ahorroMes.total)}</p>
                <ul className="mt-2 flex flex-col gap-1">
                  {ahorroMes.filas.map((f) => (
                    <li key={f.nombreMeta} className="flex justify-between text-[14px] text-[var(--text-secondary)]">
                      <span className="truncate">{f.nombreMeta}</span>
                      <span className={cifra}>{dinero(f.total)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[13px] text-[var(--text-secondary)]">El ahorro no cuenta como gasto.</p>
              </>
            ) : (
              <p className="mt-1 text-[14px] leading-snug text-[var(--text-secondary)]">
                Este mes no hubo aportes. Un aporte pequeño también suma:{' '}
                <Link href="/app/metas" className="font-semibold text-[var(--accent)] underline underline-offset-2">
                  ir a Metas
                </Link>
                .
              </p>
            )}
          </motion.section>
        </div>
      ) : null}
    </div>
  );
}
