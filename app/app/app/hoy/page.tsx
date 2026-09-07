'use client';

// Pantalla HOY — protagonista de la app interna (Sesión 5, SECUENCIA-MAESTRA §Paso 5).
// Objeto principal: la pregunta diaria de conexión (el gancho de retención — loop en ESTADO.md:
// Gatillo → Acción → Recompensa → Inversión). Mecánica: la respuesta de cada uno queda oculta
// hasta que AMBOS respondan (revelar coincidencia) — nunca se ve la respuesta del otro antes.
// Dispositivo ownable: mismo hero-card sólido de onboarding/HeroVisual (FICHA-ARTE.md).

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { animate, motion, useReducedMotion } from 'motion/react';
import { Fire, Sparkle, Plus, ArrowRight, PencilSimple, Check, CircleNotch } from '@phosphor-icons/react';
import { META_AHORRO, PAREJA, PREGUNTA_HOY, RACHA } from '@/lib/seed-datos';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { obtenerCoupleId, obtenerPaisPareja, obtenerPresupuestoPareja, actualizarPresupuestoPareja, obtenerGastadoDelMes } from '@/lib/gastos';
import { formatoMoneda } from '@/lib/paises';

// Enlaces internos animados: `motion.a` nativo disparaba una recarga completa del navegador
// en cada tap (flash blanco, se pierde el estado de la app) — defecto real detectado por el
// revisor-visual. `motion.create(Link)` conserva la navegación cliente-a-cliente de Next.
const MotionLink = motion.create(Link);

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Mes real visible junto al total (regla 13 del SO: toda vista con datos temporales necesita
// una fecha real, no solo "este mes") — la navegación entre meses YA existe en Gastos (el link
// "Ver todo" lleva justo ahí); aquí solo se nombra el mes actual, sin sumar estado nuevo.
function mesActualLabel(): string {
  const ahora = new Date();
  return `${MESES[ahora.getMonth()][0].toUpperCase()}${MESES[ahora.getMonth()].slice(1)} ${ahora.getFullYear()}`;
}

function saludoDelDia(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// Número héroe animado — motion signature de esta pantalla (FICHA-ARTE.md). Anima CADA VEZ que
// cambia `target` (desde el último valor mostrado, no siempre desde 0) — el gastado real llega
// async (arranca en 0 antes de que responda Supabase, mismo bug ya corregido en Metas: con
// deps [] solo animaba una vez al montar y se quedaba pegado si el dato llegaba después).
function useCountUp(target: number): number {
  const reducido = useReducedMotion();
  const [valor, setValor] = useState(reducido ? target : 0);
  const anteriorRef = useRef(reducido ? target : 0);
  useEffect(() => {
    if (reducido) {
      setValor(target);
      anteriorRef.current = target;
      return;
    }
    const desde = anteriorRef.current;
    const controls = animate(desde, target, { duration: 0.9, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setValor(Math.round(v)) });
    anteriorRef.current = target;
    return () => controls.stop();
  }, [target, reducido]);
  return valor;
}

function PreguntaDelDia() {
  const [respuestaPropia, setRespuestaPropia] = useState<string | null>(null);
  const [borrador, setBorrador] = useState('');
  const [vacio, setVacio] = useState(false);
  const ambosRespondieron = respuestaPropia !== null && PREGUNTA_HOY.respuestaM !== null;

  const enviar = () => {
    if (!borrador.trim()) {
      setVacio(true);
      return;
    }
    setVacio(false);
    setRespuestaPropia(borrador.trim());
  };

  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--accent-2)] p-5 text-[var(--bg)] shadow-[var(--shadow-hero)]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] opacity-80">Pregunta de hoy</p>
        <motion.span
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
          className="flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--bg)_18%,transparent)] px-2 py-1 text-[12px] font-semibold"
        >
          <Fire size={11} strokeWidth={2.5} aria-hidden="true" />
          {RACHA.dias} días
        </motion.span>
      </div>
      <p className="text-balance text-[28px] font-bold leading-snug [font-family:var(--font-display)]">
        {PREGUNTA_HOY.texto}
      </p>

      {ambosRespondieron ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 flex flex-col gap-2"
        >
          <div className="rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--bg)_24%,transparent)] p-3 shadow-[0_2px_6px_rgba(0,0,0,0.18)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] opacity-70">{PAREJA.nombres.m}</p>
            <p className="mt-0.5 text-[15px] leading-snug">{PREGUNTA_HOY.respuestaM}</p>
          </div>
          <div className="rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--bg)_24%,transparent)] p-3 shadow-[0_2px_6px_rgba(0,0,0,0.18)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] opacity-70">{PAREJA.nombres.s}</p>
            <p className="mt-0.5 text-[15px] leading-snug">{respuestaPropia}</p>
          </div>
        </motion.div>
      ) : respuestaPropia !== null ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[15px] leading-relaxed opacity-85">
            Ya respondiste. En cuanto {PAREJA.nombres.m} conteste, se revelan las dos respuestas.
          </p>
          {/* Un typo antes quedaba irrecuperable hasta que ambos respondían — defecto real
              detectado por el revisor-visual. */}
          <button
            type="button"
            onClick={() => {
              setBorrador(respuestaPropia);
              setRespuestaPropia(null);
            }}
            aria-label="Editar respuesta"
            className="flex shrink-0 items-center gap-1 text-[12px] font-semibold underline underline-offset-2 opacity-90 [touch-action:manipulation]"
          >
            <PencilSimple size={12} strokeWidth={2.2} aria-hidden="true" />
            Editar
          </button>
        </div>
      ) : (
        <form
          className="mt-4 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            enviar();
          }}
        >
          <input
            value={borrador}
            onChange={(e) => {
              setBorrador(e.target.value);
              if (vacio) setVacio(false);
            }}
            placeholder="Escribe tu respuesta…"
            aria-invalid={vacio}
            // Sin autoFocus: combinado con el borde propio del input, el anillo de foco se veía
            // como un doble borde pesado apenas se abría la pantalla (defecto real detectado por
            // el revisor-visual) — el foco solo aparece cuando el usuario toca el campo, como
            // cualquier otro input de la app. `--focus-ring` sigue en `--bg` (blanco) para que,
            // cuando sí aparezca por teclado, no se confunda con el rojo de error.
            style={{ '--focus-ring': 'var(--bg)' } as CSSProperties}
            className={`h-12 w-full rounded-[var(--radius-button)] border bg-[color-mix(in_oklab,var(--bg)_12%,transparent)] px-4 text-[15px] text-[var(--bg)] placeholder:text-[color-mix(in_oklab,var(--bg)_65%,transparent)] outline-none focus:border-[var(--bg)] ${
              vacio ? 'border-[color-mix(in_oklab,var(--danger)_65%,var(--bg))]' : 'border-[color-mix(in_oklab,var(--bg)_30%,transparent)]'
            }`}
          />
          {vacio && <p className="text-[12px] font-medium opacity-90">Escriban algo antes de enviar.</p>}
          {/* Outline, no relleno sólido: "Registrar gasto" es la acción primaria de TODA la
              pantalla — dos CTAs con el mismo peso visual competían por atención (defecto
              real detectado por el revisor-visual). Nunca disabled/opacity-50 por defecto:
              el botón queda siempre tapable, la validación se muestra al intentar enviar. */}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="flex h-11 items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--bg)_70%,transparent)] bg-[color-mix(in_oklab,var(--bg)_10%,transparent)] text-[15px] font-semibold text-[var(--bg)] [touch-action:manipulation]"
          >
            Responder
          </motion.button>
        </form>
      )}
    </div>
  );
}

export default function HoyPage() {
  const reducido = useReducedMotion();
  // El saludo depende de la hora LOCAL del navegador, pero este componente también
  // se renderiza en el servidor (Next.js sigue haciendo SSR de 'use client') — el
  // servidor y el navegador pueden estar en zonas horarias distintas y calcular un
  // saludo diferente, lo que React ve como un error de hidratación (bug real
  // detectado en producción: no aparecía en localhost porque ahí las dos "horas"
  // coinciden). Se arranca con un saludo neutro igual en ambos lados y se calcula
  // el real recién después de montar, solo en el cliente.
  const [saludo, setSaludo] = useState('Hola');
  const [pais, setPais] = useState<string | null>(null);
  const [mesLabel, setMesLabel] = useState('');
  const [presupuesto, setPresupuesto] = useState<number | null>(null);
  const [gastado, setGastado] = useState(0);
  const [editandoPresupuesto, setEditandoPresupuesto] = useState(false);
  const [borradorPresupuesto, setBorradorPresupuesto] = useState('');
  const [guardandoPresupuesto, setGuardandoPresupuesto] = useState(false);
  const [errorPresupuesto, setErrorPresupuesto] = useState<string | null>(null);
  const gastadoMostrado = useCountUp(gastado);

  useEffect(() => {
    setSaludo(saludoDelDia());
    setMesLabel(mesActualLabel());
    // Presupuesto/gastado real de Supabase (pedido real del usuario) — antes esta tarjeta
    // mostraba "Gastado este mes" con datos de EJEMPLO fijos que nunca coincidían con lo que
    // de verdad registraban en Gastos, y no había forma de definir un presupuesto.
    (async () => {
      const supabase = crearClienteNavegador();
      const cid = await obtenerCoupleId(supabase);
      if (!cid) return;
      const ahora = new Date();
      const prefijoMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
      const [paisPareja, presupuestoReal, gastadoReal] = await Promise.all([
        obtenerPaisPareja(supabase, cid),
        obtenerPresupuestoPareja(supabase, cid),
        obtenerGastadoDelMes(supabase, cid, prefijoMes),
      ]);
      setPais(paisPareja);
      setPresupuesto(presupuestoReal);
      setGastado(gastadoReal);
    })();
  }, []);

  const guardarPresupuesto = async () => {
    const valor = Number(borradorPresupuesto);
    if (!valor || valor <= 0) return;
    setGuardandoPresupuesto(true);
    setErrorPresupuesto(null);
    try {
      const supabase = crearClienteNavegador();
      await actualizarPresupuestoPareja(supabase, valor);
      setPresupuesto(valor);
      setEditandoPresupuesto(false);
    } catch {
      setErrorPresupuesto('No pudimos guardar el presupuesto. Intenten de nuevo en un momento.');
    } finally {
      setGuardandoPresupuesto(false);
    }
  };

  const disponible = presupuesto !== null ? presupuesto - gastado : null;
  const pctMeta = Math.round((META_AHORRO.montoActual / META_AHORRO.montoObjetivo) * 100);

  const entrada = (delay: number) => ({
    initial: reducido ? { opacity: 0 } : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reducido ? 0.2 : 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    // gap-4 (no gap-5): la tarjeta de Meta quedaba cortada de golpe contra el velo del nav sin
    // llegar a mostrar su título ni el % en la vista inicial sin scroll (defecto real detectado
    // por el revisor-visual) — este ajuste libera ~16px para que se note más de esa tarjeta.
    <div className="flex flex-col gap-4">
      <motion.div {...entrada(0)} className="flex items-center justify-between">
        <div>
          {/* Antes repetía el nombre en las dos líneas ("Buenas tardes, Sofía" + "Mateo &
              Sofía") sin sumar información nueva — defecto real detectado por el revisor-visual.
              El saludo solo, los nombres quedan una única vez, en el título. */}
          <p className="text-[12px] font-medium text-[var(--text-tertiary)]">{saludo}</p>
          <h1 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">
            {PAREJA.nombres.m} &amp; {PAREJA.nombres.s}
          </h1>
        </div>
        <Link href="/app/nosotros" aria-label="Ver Nosotros" className="flex -space-x-2 [touch-action:manipulation]">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--bg)] bg-[var(--accent-2)] text-[12px] font-bold text-[var(--bg)] shadow-[var(--shadow-1)]">
            M
          </span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--bg)] bg-[var(--accent)] text-[12px] font-bold text-[var(--bg)] shadow-[var(--shadow-1)]">
            S
          </span>
        </Link>
      </motion.div>

      <motion.div {...entrada(0.06)}>
        <PreguntaDelDia />
      </motion.div>

      <motion.div
        {...entrada(0.12)}
        className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4 shadow-[var(--shadow-2)]"
      >
        {editandoPresupuesto ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              guardarPresupuesto();
            }}
          >
            <label className="text-[12px] font-medium text-[var(--text-tertiary)]">Nuestro presupuesto mensual</label>
            <input
              autoFocus
              inputMode="numeric"
              value={borradorPresupuesto}
              onChange={(e) => setBorradorPresupuesto(e.target.value.replace(/\D/g, ''))}
              placeholder="¿Cuánto quieren gastar como máximo?"
              className="h-12 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[16px] tabular-nums text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
            {errorPresupuesto && <p className="text-[12px] font-medium text-[var(--danger)]">{errorPresupuesto}</p>}
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setEditandoPresupuesto(false)}
                disabled={guardandoPresupuesto}
                className="flex h-10 flex-1 items-center justify-center rounded-[var(--radius-button)] text-[14px] font-medium text-[var(--text-tertiary)] disabled:opacity-50 [touch-action:manipulation]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!borradorPresupuesto || guardandoPresupuesto}
                className="flex h-10 flex-[2] items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)] disabled:opacity-50 [touch-action:manipulation]"
              >
                {guardandoPresupuesto ? <CircleNotch size={15} strokeWidth={2.4} className="animate-spin" aria-hidden="true" /> : <Check size={15} strokeWidth={2.4} aria-hidden="true" />}
                {guardandoPresupuesto ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setBorradorPresupuesto(presupuesto ? String(presupuesto) : '');
                setEditandoPresupuesto(true);
              }}
              className="flex items-center gap-1.5 [touch-action:manipulation]"
            >
              <p className="text-[12px] font-medium text-[var(--text-tertiary)]">Nuestro presupuesto mensual</p>
              <PencilSimple size={12} strokeWidth={2.2} color="var(--text-tertiary)" aria-hidden="true" />
            </button>

            {presupuesto === null ? (
              <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">Aún no lo han definido — toquen arriba para ponerlo.</p>
            ) : (
              <>
                {/* 20px (título), no 32px (display) — la pregunta de arriba es el dispositivo
                    protagonista de esta pantalla (FICHA-ARTE.md), este monto es secundario. */}
                <p className="mt-1 text-[20px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
                  {formatoMoneda(presupuesto, pais)}
                </p>
                <div className="mt-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[15px]">
                    <span className="text-[var(--text-secondary)]">Gastado{mesLabel ? ` en ${mesLabel}` : ''}</span>
                    <span
                      className={`tabular-nums font-semibold ${gastado > presupuesto ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}
                    >
                      {formatoMoneda(gastadoMostrado, pais)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[15px]">
                    <span className="text-[var(--text-secondary)]">Disponible</span>
                    <span className={`tabular-nums font-semibold ${(disponible ?? 0) < 0 ? 'text-[var(--danger)]' : 'text-[var(--accent)]'}`}>
                      {formatoMoneda(disponible ?? 0, pais)}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="mt-3">
              <Link href="/app/gastos" className="flex w-fit items-center gap-1 text-[12px] font-semibold text-[var(--accent)]">
                Ver todo
                <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </motion.div>

      <MotionLink
        {...entrada(0.18)}
        whileTap={{ scale: 0.98 }}
        href="/app/gastos?nuevo=1"
        className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_24px_color-mix(in_oklab,var(--accent)_28%,transparent)] [touch-action:manipulation]"
      >
        <Plus size={20} strokeWidth={2.4} aria-hidden="true" />
        Registrar gasto
      </MotionLink>

      <MotionLink
        {...entrada(0.24)}
        whileTap={{ scale: 0.98 }}
        href="/app/metas"
        className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] [touch-action:manipulation]"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
          <Sparkle size={18} strokeWidth={2} color="var(--accent)" aria-hidden="true" />
        </span>
        <span className="flex-1">
          <span className="flex items-baseline justify-between">
            <span className="text-[15px] font-semibold text-[var(--text-primary)]">{META_AHORRO.nombre}</span>
            <span className="text-[12px] font-semibold tabular-nums text-[var(--accent)]">{pctMeta}%</span>
          </span>
          {/* Barra de progreso animada — antes el % era solo texto, sin señal visual
              (defecto real detectado por el revisor-visual, contradice FICHA-ARTE). */}
          <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)]">
            <motion.span
              className="block h-full rounded-full bg-[var(--accent)]"
              initial={{ width: reducido ? `${pctMeta}%` : 0 }}
              animate={{ width: `${pctMeta}%` }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </span>
        </span>
        <ArrowRight size={16} strokeWidth={2.2} color="var(--text-tertiary)" aria-hidden="true" />
      </MotionLink>
    </div>
  );
}
