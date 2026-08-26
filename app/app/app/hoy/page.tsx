'use client';

// Pantalla HOY — protagonista de la app interna (Sesión 5, SECUENCIA-MAESTRA §Paso 5).
// Objeto principal: la pregunta diaria de conexión (el gancho de retención — loop en ESTADO.md:
// Gatillo → Acción → Recompensa → Inversión). Mecánica: la respuesta de cada uno queda oculta
// hasta que AMBOS respondan (revelar coincidencia) — nunca se ve la respuesta del otro antes.
// Dispositivo ownable: mismo hero-card sólido de onboarding/HeroVisual (FICHA-ARTE.md).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { animate, motion, useReducedMotion } from 'motion/react';
import { Flame, Sparkles, Plus, ArrowRight, Pencil } from 'lucide-react';
import { CATEGORIAS, GASTOS, SALDO_MES, META_AHORRO, PAREJA, PREGUNTA_HOY, RACHA, formatoCOP } from '@/lib/seed-datos';

// Enlaces internos animados: `motion.a` nativo disparaba una recarga completa del navegador
// en cada tap (flash blanco, se pierde el estado de la app) — defecto real detectado por el
// revisor-visual. `motion.create(Link)` conserva la navegación cliente-a-cliente de Next.
const MotionLink = motion.create(Link);

function saludoDelDia(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// Número héroe animado — motion signature de esta pantalla (FICHA-ARTE.md), antes se
// renderizaba estático (defecto real detectado por el revisor-visual).
function useCountUp(target: number): number {
  const reducido = useReducedMotion();
  const [valor, setValor] = useState(reducido ? target : 0);
  useEffect(() => {
    if (reducido) return;
    const controls = animate(0, target, { duration: 0.9, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setValor(Math.round(v)) });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- corre una vez al montar
  }, []);
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
    <div className="rounded-[var(--radius-card)] bg-[var(--accent-2)] p-5 text-[var(--bg)]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] font-bold uppercase tracking-[0.08em] opacity-80">Pregunta de hoy</p>
        <span className="flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--bg)_18%,transparent)] px-2 py-1 text-[12px] font-bold">
          <Flame size={11} strokeWidth={2.5} aria-hidden="true" />
          {RACHA.dias} días
        </span>
      </div>
      <p className="text-balance text-[20px] font-bold leading-snug [font-family:var(--font-display)]">
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
          <p className="text-[14px] leading-relaxed opacity-85">
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
            <Pencil size={12} strokeWidth={2.2} aria-hidden="true" />
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
            className="flex h-11 items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--bg)_45%,transparent)] text-[15px] font-semibold text-[var(--bg)] [touch-action:manipulation]"
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
  const saldoMostrado = useCountUp(SALDO_MES);
  // El saludo depende de la hora LOCAL del navegador, pero este componente también
  // se renderiza en el servidor (Next.js sigue haciendo SSR de 'use client') — el
  // servidor y el navegador pueden estar en zonas horarias distintas y calcular un
  // saludo diferente, lo que React ve como un error de hidratación (bug real
  // detectado en producción: no aparecía en localhost porque ahí las dos "horas"
  // coinciden). Se arranca con un saludo neutro igual en ambos lados y se calcula
  // el real recién después de montar, solo en el cliente.
  const [saludo, setSaludo] = useState('Hola');
  useEffect(() => {
    setSaludo(saludoDelDia());
  }, []);
  const topCategorias = [...CATEGORIAS]
    .map((c) => ({ cat: c, total: GASTOS.filter((g) => g.categoriaId === c.id).reduce((a, g) => a + g.monto, 0) }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);
  const pctMeta = Math.round((META_AHORRO.montoActual / META_AHORRO.montoObjetivo) * 100);

  const entrada = (delay: number) => ({
    initial: reducido ? { opacity: 0 } : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reducido ? 0.2 : 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div className="flex flex-col gap-5">
      <motion.div {...entrada(0)} className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            {saludo}, {PAREJA.nombres.s}
          </p>
          <h1 className="text-[24px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
            {PAREJA.nombres.m} &amp; {PAREJA.nombres.s}
          </h1>
        </div>
        <div className="flex -space-x-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--bg)] bg-[var(--accent-2)] text-[12px] font-bold text-[var(--bg)] shadow-[var(--shadow-1)]">
            M
          </span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--bg)] bg-[var(--accent)] text-[12px] font-bold text-[var(--bg)] shadow-[var(--shadow-1)]">
            S
          </span>
        </div>
      </motion.div>

      <motion.div {...entrada(0.06)}>
        <PreguntaDelDia />
      </motion.div>

      <motion.div
        {...entrada(0.12)}
        className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]"
      >
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] text-[var(--text-tertiary)]">Gastado este mes</p>
          <Link href="/app/gastos" className="flex items-center gap-1 text-[12px] font-semibold text-[var(--accent)]">
            Ver todo
            <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-1 text-[28px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
          {formatoCOP(saldoMostrado)}
        </p>
        {topCategorias.length === 0 ? (
          <p className="mt-3 text-[13px] text-[var(--text-tertiary)]">Aún no registran gastos este mes.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {topCategorias.map(({ cat, total }) => (
              <div key={cat.id} className="flex items-center gap-2.5 text-[13px]">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-button)] ${
                    cat.color === 'accent' ? 'bg-[var(--accent)]' : 'bg-[var(--accent-2)]'
                  }`}
                >
                  <cat.icono size={14} strokeWidth={2.2} color="var(--bg)" aria-hidden="true" />
                </span>
                <span className="flex-1 text-[var(--text-primary)]">{cat.nombre}</span>
                <span className="tabular-nums font-semibold text-[var(--text-primary)]">{formatoCOP(total)}</span>
              </div>
            ))}
          </div>
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
          <Sparkles size={18} strokeWidth={2} color="var(--accent)" aria-hidden="true" />
        </span>
        <span className="flex-1">
          <span className="flex items-baseline justify-between">
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">{META_AHORRO.nombre}</span>
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
