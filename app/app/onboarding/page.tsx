'use client';

// Onboarding de DuoSync — 8 pasos de alto rendimiento (categoría "consumo personalizado/
// finanzas del hogar" de 02B: 4-8 pasos). Cada pregunta traza a un dolor/deseo de
// FICHA-AVATAR.md (ver docs/copy/onboarding.md). Modelo onboarding-first (02C): el registro
// llega DESPUÉS de la primera victoria (vincular con el código de pareja), nunca antes.
// Auth/backend real se conectan en Sesión 6 — hoy es la experiencia completa con estado local.

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react';
import {
  Home,
  Receipt,
  ShoppingCart,
  Sunrise,
  Sun,
  Moon,
  Plane,
  PiggyBank,
  Heart,
  KeyRound,
  Copy,
  Check,
  Sparkles,
  PartyPopper,
  MessageCircle,
} from 'lucide-react';
import { FunnelHeader, FunnelShell, PasoTransition, Chip, CtaFijo, SalidaLimpia } from '@/components/onboarding/ui';

type Respuestas = {
  frecuenciaDiscusion?: string;
  quienLleva?: string;
  gastoDificil?: string;
  meta?: string;
  momentoDia?: string;
};

const TOTAL_PASOS = 9; // 0-8, usado para el % de la barra (arranca en 8%, nunca 0 — efecto Zeigarnik)

function pct(paso: number): number {
  return Math.round(8 + (paso / (TOTAL_PASOS - 1)) * 92);
}

export default function OnboardingPage() {
  const [paso, setPaso] = useState(0);
  const [r, setR] = useState<Respuestas>({});
  const [otroGasto, setOtroGasto] = useState('');
  const [metaTexto, setMetaTexto] = useState('');
  const [codigo] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [tengoCodigo, setTengoCodigo] = useState(false);
  const [codigoIngresado, setCodigoIngresado] = useState('');

  const avanzar = () => setPaso((p) => Math.min(p + 1, TOTAL_PASOS - 1));
  const atras = () => setPaso((p) => Math.max(p - 1, 0));

  // Bloqueo de doble-tap (defecto real detectado por el revisor-visual): sin esto, un doble-tap
  // rápido dispara dos avances y el quiz salta una pregunta en silencio.
  const bloqueadoRef = useRef(false);
  const seleccionar = (campo: keyof Respuestas, valor: string) => {
    if (bloqueadoRef.current) return;
    bloqueadoRef.current = true;
    setR((prev) => ({ ...prev, [campo]: valor }));
    setTimeout(() => {
      avanzar();
      bloqueadoRef.current = false;
    }, 300); // pausa 300ms visible antes de auto-avanzar (A3)
  };

  // Numeración "Pregunta N de 5" — solo los pasos que son preguntas reales la muestran
  // (el reconocimiento en paso 2 no cuenta, sigue la barra pero sin número).
  const numeroPregunta: Record<number, number> = { 0: 1, 1: 2, 3: 3, 4: 4, 5: 5 };

  return (
    <FunnelShell>
      <FunnelHeader
        onBack={paso > 0 && paso < 7 ? atras : undefined}
        progreso={paso < 6 ? pct(paso) : undefined}
        contador={numeroPregunta[paso] ? `Pregunta ${numeroPregunta[paso]} de 5` : undefined}
        salida={paso !== 7}
      />
      <AnimatePresence mode="wait">
        <PasoTransition stepKey={paso}>
          {paso === 0 && (
            <PasoPregunta
              titulo="¿Qué tan seguido discuten por dinero?"
              opciones={[
                { label: 'Casi nunca' },
                { label: 'A veces' },
                { label: 'Con frecuencia' },
                { label: 'Todo el tiempo' },
              ]}
              onElegir={(v) => seleccionar('frecuenciaDiscusion', v)}
              valorActual={r.frecuenciaDiscusion}
            />
          )}

          {paso === 1 && (
            <PasoPregunta
              titulo="¿Quién termina llevando las cuentas del hogar?"
              opciones={[
                { label: 'Yo' },
                { label: 'Mi pareja' },
                { label: 'Los dos, pero sin orden' },
                { label: 'Nadie — por eso estamos aquí' },
              ]}
              onElegir={(v) => seleccionar('quienLleva', v)}
              valorActual={r.quienLleva}
            />
          )}

          {paso === 2 && <PasoReconocimiento respuestas={r} onContinuar={avanzar} />}

          {paso === 3 && (
            <PasoPregunta
              titulo="¿Cuál es su gasto más difícil de repartir?"
              opciones={[
                { label: 'Arriendo o hipoteca', icon: Home },
                { label: 'Servicios', icon: Receipt },
                { label: 'Mercado', icon: ShoppingCart },
              ]}
              otraCosa
              onElegir={(v) => seleccionar('gastoDificil', v)}
              valorOtro={otroGasto}
              onCambiarOtro={setOtroGasto}
              valorActual={r.gastoDificil}
            />
          )}

          {paso === 4 && (
            <PasoMeta
              valor={metaTexto}
              onCambiar={setMetaTexto}
              onContinuar={() => {
                setR((prev) => ({ ...prev, meta: metaTexto.trim() || 'su meta juntos' }));
                avanzar();
              }}
            />
          )}

          {paso === 5 && (
            <PasoPregunta
              titulo="¿En qué momento revisan mejor sus cuentas?"
              opciones={[
                { label: 'En la mañana', icon: Sunrise },
                { label: 'Al almuerzo', icon: Sun },
                { label: 'En la noche', icon: Moon },
              ]}
              onElegir={(v) => seleccionar('momentoDia', v)}
              valorActual={r.momentoDia}
            />
          )}

          {paso === 6 && (
            <PasoVinculacion
              codigo={codigo}
              tengoCodigo={tengoCodigo}
              setTengoCodigo={setTengoCodigo}
              codigoIngresado={codigoIngresado}
              setCodigoIngresado={setCodigoIngresado}
              onContinuar={avanzar}
            />
          )}

          {paso === 7 && <PasoLoading respuestas={r} onListo={avanzar} onCancelar={() => setPaso(6)} />}

          {paso === 8 && (
            <PasoResultado
              respuestas={r}
              modo={tengoCodigo ? 'unirse' : 'crear'}
              codigo={tengoCodigo ? codigoIngresado : codigo}
            />
          )}
        </PasoTransition>
      </AnimatePresence>
    </FunnelShell>
  );
}

/* ── Pregunta de selección única ─────────────────────────────────────────── */

function PasoPregunta({
  titulo,
  opciones,
  onElegir,
  otraCosa,
  valorOtro,
  onCambiarOtro,
  valorActual,
  eyebrow,
}: {
  titulo: string;
  opciones: { label: string; icon?: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }> }[];
  onElegir: (v: string) => void;
  otraCosa?: boolean;
  valorOtro?: string;
  onCambiarOtro?: (v: string) => void;
  /** Respuesta ya guardada (si vuelven con "Atrás") — el chip nace marcado, no en blanco. */
  valorActual?: string;
  eyebrow?: string;
}) {
  const reducido = useReducedMotion();
  const [seleccion, setSeleccion] = useState<string | null>(valorActual ?? null);
  const [mostrarOtro, setMostrarOtro] = useState(false);
  // Bloqueo LOCAL (además del bloqueadoRef del padre): evita que un segundo tap en OTRO chip,
  // dentro de la ventana de 300ms antes de avanzar, muestre un chip resaltado que no coincide
  // con la respuesta ya guardada (defecto real detectado por el revisor-visual).
  const [bloqueado, setBloqueado] = useState(false);

  const elegir = (valor: string) => {
    if (bloqueado) return;
    setBloqueado(true);
    setSeleccion(valor);
    onElegir(valor);
  };

  return (
    // Centrado vertical: estos pasos auto-avanzan (sin CTA fijo al fondo), así que el bloque
    // completo se centra como una composición — antes el contenido quedaba pegado arriba con
    // ~25% del viewport en blanco sin balancear debajo (defecto real detectado por el
    // revisor-visual; anclar la nota al fondo con mt-auto solo trasladaba el mismo vacío).
    <div className="flex flex-1 flex-col justify-center">
      {/* Dispositivo ownable: la misma tarjeta-hero de color sólido de FICHA-ARTE.md
          ("Pregunta de hoy" del HeroVisual) — la pregunta del onboarding vive en el
          mismo lenguaje visual que la pregunta diaria de la app, no en un chip genérico. */}
      <div className="mb-8 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--accent-2)_92%,white)] p-5 text-[var(--bg)] shadow-[var(--shadow-2)]">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] opacity-80">
          {eyebrow ?? 'Para ustedes dos'}
        </p>
        <p className="text-balance text-[24px] font-bold leading-[1.25] [font-family:var(--font-display)]">
          {titulo}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {opciones.map((o, i) => (
          <motion.div
            key={o.label}
            initial={reducido ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducido ? 0 : 0.25, delay: reducido ? 0 : i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            <Chip label={o.label} icon={o.icon} seleccionado={seleccion === o.label} onClick={() => elegir(o.label)} />
          </motion.div>
        ))}
        {otraCosa && (
          <>
            <Chip
              label="Otra cosa (escríbanla)"
              seleccionado={mostrarOtro}
              onClick={() => setMostrarOtro(true)}
            />
            {mostrarOtro && (
              <form
                className="mt-1 flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (valorOtro?.trim()) onElegir(valorOtro.trim());
                }}
              >
                <input
                  autoFocus
                  value={valorOtro}
                  onChange={(e) => onCambiarOtro?.(e.target.value)}
                  placeholder="Escriban su gasto"
                  className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
                <CtaFijo disabled={!valorOtro?.trim()} onClick={() => valorOtro && onElegir(valorOtro.trim())}>
                  Continuar
                </CtaFijo>
              </form>
            )}
          </>
        )}
      </div>
      <p className="mt-8 text-center text-[12px] text-[var(--text-tertiary)]">
        Cada respuesta ajusta el plan que arman al final — no es un formulario, es su sistema.
      </p>
    </div>
  );
}

/* ── Reconocimiento (fórmula A5: nombra el patrón, quita la culpa, nombra el mecanismo) ── */

function PasoReconocimiento({ respuestas, onContinuar }: { respuestas: Respuestas; onContinuar: () => void }) {
  const texto = useMemo(() => {
    const quien = respuestas.quienLleva;
    if (quien === 'Nadie — por eso estamos aquí') {
      return 'Que nadie lleve las cuentas no es desorganización: es que hasta hoy no tenían un lugar donde los dos vieran lo mismo al mismo tiempo. El Código de Pareja arregla exactamente eso — en un minuto, sus cuentas quedan conectadas.';
    }
    if (quien === 'Los dos, pero sin orden') {
      return 'Cuando los dos meten mano pero sin un sistema, cada uno termina con su propia versión de las cuentas — y ahí nace la desconfianza. No es falta de comunicación: es falta de un lugar único donde mirar. Por eso existe el Código de Pareja.';
    }
    return 'Cuando uno solo lleva las cuentas, el otro no se desentiende por falta de interés — es que nunca tuvo un lugar claro donde ver lo mismo. El Código de Pareja termina con eso: conecta sus cuentas en un minuto, para que dejen de ser trabajo de una sola persona.';
  }, [respuestas.quienLleva]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-6 flex justify-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent-2)_12%,transparent)]">
          <Sparkles size={28} strokeWidth={1.8} color="var(--accent-2)" aria-hidden="true" />
        </span>
      </div>
      <h1 className="mt-6 text-balance text-center text-[24px] font-bold leading-[1.2] text-[var(--text-primary)] [font-family:var(--font-display)]">
        Esto no es falta de amor
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-[var(--text-secondary)]">{texto}</p>
      <div className="mt-auto pt-8">
        <CtaFijo onClick={onContinuar}>Continuar</CtaFijo>
      </div>
    </div>
  );
}

/* ── Meta de ahorro: input libre con sugerencias que rellenan (patrón Tiimo) ── */

function PasoMeta({
  valor,
  onCambiar,
  onContinuar,
}: {
  valor: string;
  onCambiar: (v: string) => void;
  onContinuar: () => void;
}) {
  const sugerencias = [
    { label: 'Viaje juntos', icon: Plane },
    { label: 'Mudarse juntos', icon: Home },
    { label: 'Fondo de emergencia', icon: PiggyBank },
    { label: 'Su boda', icon: Heart },
  ];
  return (
    <div className="flex flex-1 flex-col">
      {/* Mismo dispositivo ownable que las preguntas de selección — consistencia con
          FICHA-ARTE.md (defecto real: antes esta pantalla usaba un tratamiento distinto). */}
      <div className="mt-4 mb-6 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--accent-2)_92%,white)] p-5 text-[var(--bg)] shadow-[var(--shadow-2)]">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] opacity-80">Para ustedes dos</p>
        <p className="text-balance text-[24px] font-bold leading-[1.25] [font-family:var(--font-display)]">
          ¿Para qué están ahorrando juntos?
        </p>
      </div>
      <p className="mb-4 text-[12px] text-[var(--text-secondary)]">
        Elijan una sugerencia para completar el campo, o escriban la suya.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {sugerencias.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onCambiar(s.label)}
            className="flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] px-3 py-2 text-[12px] font-medium text-[var(--text-primary)] [touch-action:manipulation]"
          >
            <s.icon size={14} strokeWidth={2} color="var(--accent-2)" aria-hidden="true" />
            {s.label}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valor.trim()) onContinuar();
        }}
      >
        <input
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          placeholder="Ej. Viaje a Cartagena"
          className="h-14 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
      </form>
      <div className="mt-auto pt-8">
        <CtaFijo disabled={!valor.trim()} onClick={onContinuar}>
          Continuar
        </CtaFijo>
      </div>
    </div>
  );
}

/* ── Vinculación: el Código de Pareja — la primera victoria real (ACTIVAR) ── */

function PasoVinculacion({
  codigo,
  tengoCodigo,
  setTengoCodigo,
  codigoIngresado,
  setCodigoIngresado,
  onContinuar,
}: {
  codigo: string;
  tengoCodigo: boolean;
  setTengoCodigo: (v: boolean) => void;
  codigoIngresado: string;
  setCodigoIngresado: (v: string) => void;
  onContinuar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  // Único error que SÍ podemos validar de verdad sin backend: no pueden ingresar su propio
  // código (nadie se empareja consigo mismo). El resto de la validación real llega en Sesión 6.
  const codigoInvalido = tengoCodigo && codigoIngresado.length === 4 && codigoIngresado === codigo;
  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-6 flex justify-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
          <KeyRound size={28} strokeWidth={1.8} color="var(--accent)" aria-hidden="true" />
        </span>
      </div>
      <h1 className="mt-6 text-balance text-center text-[24px] font-bold leading-[1.2] text-[var(--text-primary)] [font-family:var(--font-display)]">
        El Código de Pareja
      </h1>

      {!tengoCodigo ? (
        <>
          <p className="mt-3 text-center text-[16px] leading-relaxed text-[var(--text-secondary)]">
            Compártanlo para conectar sus cuentas. Su pareja lo ingresa en su celular y quedan sincronizados.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-3 rounded-[var(--radius-card)] border-2 border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_8%,var(--surface))] px-6 py-4">
              <span className="text-[32px] font-bold tabular-nums tracking-[0.15em] text-[var(--text-primary)] [font-family:var(--font-display)]">
                {codigo}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(codigo);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 1500);
                }}
                aria-label="Copiar código"
                className="flex size-10 items-center justify-center rounded-full bg-[var(--surface)] [touch-action:manipulation]"
              >
                {copiado ? (
                  <Check size={18} strokeWidth={2.4} color="var(--accent)" aria-hidden="true" />
                ) : (
                  <Copy size={18} strokeWidth={2} color="var(--text-secondary)" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Compartir por WhatsApp — el canal #1 en LATAM; forzar solo "copiar y pegar en
              otro lado" es fricción evitable (defecto real detectado al comparar el flujo
              contra apps líderes del nicho). */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Vamos a organizar nuestras cuentas juntos en DuoSync. Este es nuestro código de pareja: ${codigo}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] text-[15px] font-semibold text-[var(--text-primary)] [touch-action:manipulation]"
          >
            <MessageCircle size={18} strokeWidth={2} aria-hidden="true" />
            Enviar código por WhatsApp
          </a>

          {/* Tranquilidad asincrónica: que su pareja tarde en unirse NUNCA debe sentirse como
              un bloqueo — defecto real detectado al comparar contra el manejo async de
              Splitwise/Honeydue (no forzar a esperar). */}
          <p className="mt-4 text-center text-[12px] leading-relaxed text-[var(--text-tertiary)]">
            No hace falta esperar a que se una para seguir: pueden armar su plan ahora y ella se
            conecta con este mismo código cuando quiera.
          </p>

          {/* Diferenciado del párrafo informativo de arriba: es la ruta ALTERNA, real y
              tapeable — antes competía en el mismo peso visual que la nota de tranquilidad,
              sin distinguirse como acción (defecto real detectado por el revisor-visual). */}
          <button
            type="button"
            onClick={() => setTengoCodigo(true)}
            className="mt-4 text-center text-[12px] font-semibold text-[var(--text-secondary)] underline underline-offset-2"
          >
            Mi pareja ya generó un código — voy a ingresarlo
          </button>
        </>
      ) : (
        <>
          <p className="mt-3 text-center text-[16px] leading-relaxed text-[var(--text-secondary)]">
            Ingresen el código de 4 dígitos que les compartió su pareja.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (codigoIngresado.length === 4 && !codigoInvalido) onContinuar();
            }}
          >
            <div className="mt-6 flex justify-center">
              <input
                autoFocus
                inputMode="numeric"
                maxLength={4}
                value={codigoIngresado}
                onChange={(e) => setCodigoIngresado(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                aria-invalid={codigoInvalido}
                className={`h-16 w-40 rounded-[var(--radius-button)] border-2 bg-[var(--surface)] text-center text-[32px] font-bold tabular-nums tracking-[0.2em] text-[var(--text-primary)] outline-none ${
                  codigoInvalido
                    ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                    : 'border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] focus:border-[var(--accent)]'
                }`}
              />
            </div>
          </form>
          {codigoInvalido ? (
            <p className="mt-3 text-center text-[12px] font-medium text-[var(--danger)]">
              Ese es SU propio código. Pídanle a su pareja el que le apareció a ella.
            </p>
          ) : (
            <p className="mt-3 text-center text-[12px] text-[var(--text-tertiary)]">
              Lo verificamos apenas los dos queden conectados.
            </p>
          )}
          <button
            type="button"
            onClick={() => setTengoCodigo(false)}
            className="mt-6 text-center text-[12px] font-medium text-[var(--text-tertiary)]"
          >
            Mejor genero mi propio código
          </button>
        </>
      )}

      <div className="mt-auto pt-8">
        <CtaFijo disabled={tengoCodigo && (codigoIngresado.length < 4 || codigoInvalido)} onClick={onContinuar}>
          {tengoCodigo ? 'Conectar cuentas' : 'Ya lo compartí, continuar'}
        </CtaFijo>
      </div>
    </div>
  );
}

/* ── Loading "Construyendo su Plan de Pareja" — el argumento de apertura del paywall ── */

function PasoLoading({
  respuestas,
  onListo,
  onCancelar,
}: {
  respuestas: Respuestas;
  onListo: () => void;
  /** ~4s de animación con progreso visible ya cumple la mitad de la regla "3s+ →
      progreso + cancelar" (15-PATRONES-UX) — esto cierra la otra mitad sin interrumpir
      el ritmo de la pantalla (defecto real detectado por el revisor-visual). */
  onCancelar: () => void;
}) {
  const reducido = useReducedMotion();
  const lineas = [
    `Guardando su Código de Pareja`,
    `Ajustando categorías para: ${respuestas.gastoDificil ?? 'su gasto principal'}`,
    `Preparando su meta: ${respuestas.meta ?? 'su meta juntos'}`,
    `Activando su ritual: ${respuestas.momentoDia ?? 'revisión diaria'}`,
  ];
  const [activa, setActiva] = useState(0);
  const [porcentaje, setPorcentaje] = useState(reducido ? 100 : Math.round((1 / lineas.length) * 100));

  // eslint-disable-next-line react-hooks/exhaustive-deps -- corre una sola vez al montar; onListo/lineas son estables para este paso
  useEffect(() => {
    if (reducido) {
      onListo();
      return;
    }
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const avanzarLinea = () => {
      i += 1;
      if (i < lineas.length) {
        setActiva(i);
        timers.push(setTimeout(avanzarLinea, 850));
      } else {
        timers.push(setTimeout(onListo, 700));
      }
    };
    timers.push(setTimeout(avanzarLinea, 850));
    return () => timers.forEach(clearTimeout);
  }, []);

  // El número CUENTA hacia el nuevo valor en vez de saltar (baseline obligatoria de
  // conteo animado — defecto real detectado: antes saltaba 0→25→50… sin transición).
  useEffect(() => {
    const objetivo = Math.round(((activa + 1) / lineas.length) * 100);
    if (reducido) {
      setPorcentaje(objetivo);
      return;
    }
    const controls = animate(porcentaje, objetivo, {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setPorcentaje(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo re-corre cuando cambia `activa`
  }, [activa]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center" aria-live="polite" aria-busy="true">
      <div className="relative flex size-28 items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke="color-mix(in oklab, var(--text-tertiary) 15%, transparent)" strokeWidth="8" />
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={276.5}
            initial={{ strokeDashoffset: 276.5 }}
            animate={{ strokeDashoffset: 276.5 * (1 - porcentaje / 100) }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <span className="text-[24px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
          {porcentaje}%
        </span>
      </div>
      <h1 className="mt-6 text-[24px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
        Armando su Plan de Pareja…
      </h1>
      <ul className="mt-8 w-full max-w-xs space-y-3">
        {lineas.map((l, i) => (
          <li key={l} className="flex items-center gap-3 text-[16px]">
            {i < activa ? (
              <Check size={18} strokeWidth={2.5} color="var(--accent)" aria-hidden="true" />
            ) : i === activa ? (
              <span className="size-2 shrink-0 animate-pulse rounded-full bg-[var(--accent)]" aria-hidden="true" />
            ) : (
              <span className="size-4 shrink-0 rounded-full border border-[color-mix(in_oklab,var(--text-tertiary)_40%,transparent)]" aria-hidden="true" />
            )}
            <span className={i <= activa ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] opacity-60'}>
              {l}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <SalidaLimpia onClick={onCancelar}>Cancelar</SalidaLimpia>
      </div>
    </div>
  );
}

/* ── Resultado: recap del valor personalizado, "el Plan [meta]" ── */

function PasoResultado({
  respuestas,
  modo,
  codigo,
}: {
  respuestas: Respuestas;
  modo: 'crear' | 'unirse';
  codigo: string;
}) {
  const reducido = useReducedMotion();
  const nombreMeta = respuestas.meta ?? 'su meta juntos';
  // El código y el modo (crear pareja / unirse con el código de alguien más) viajan
  // por la URL hasta el login — recién ahí, con sesión real, se llama a la RPC que
  // de verdad crea o une la pareja en la base de datos (antes esto era 100% estado
  // local que se perdía al recargar — hallazgo crítico de la auditoría).
  const siguiente = `/paywall?meta=${encodeURIComponent(nombreMeta)}&modo=${modo}&codigo=${codigo}`;
  return (
    <div className="flex flex-1 flex-col">
      {/* El bloque de recap se centra en el espacio disponible ARRIBA del CTA fijo — mismo
          arreglo que en PasoPregunta: antes quedaba pegado arriba con ~35-40% del viewport
          en blanco antes del botón (defecto real detectado por el revisor-visual, reaparecido
          aquí porque el fix original solo tocó los pasos de pregunta). */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex justify-center">
          <motion.span
            initial={reducido ? { scale: 1 } : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={reducido ? { duration: 0 } : { type: 'spring', bounce: 0.55, duration: 0.7, delay: 0.1 }}
            className="flex size-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]"
          >
            <PartyPopper size={28} strokeWidth={1.8} color="var(--accent)" aria-hidden="true" />
          </motion.span>
        </div>
        <h1 className="mt-5 text-balance text-center text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
          El Plan {nombreMeta} está listo
        </h1>
        {/* "Sus 5 respuestas" — el objeto Respuestas tiene 5 campos (antes decía "6", un
            número que no cuadraba con nada del flujo — defecto real de integridad detectado
            por el revisor-visual: una cifra que no cierra resta confianza antes de pagar). */}
        <p className="mt-2 text-center text-[16px] text-[var(--text-secondary)]">Hecho con sus 5 respuestas</p>

        <div className="mt-6 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] bg-[color-mix(in_oklab,var(--accent)_5%,var(--surface))] p-5">
          <ul className="flex flex-col gap-3 text-[16px] text-[var(--text-primary)]">
            <li className="flex items-start gap-3">
              <Check size={20} strokeWidth={2.4} color="var(--accent)" aria-hidden="true" className="mt-0.5 shrink-0" />
              Código de Pareja listo para conectarlos a los dos
            </li>
            <li className="flex items-start gap-3">
              <Check size={20} strokeWidth={2.4} color="var(--accent)" aria-hidden="true" className="mt-0.5 shrink-0" />
              Categorías ajustadas a {respuestas.gastoDificil ?? 'su gasto principal'}
            </li>
            <li className="flex items-start gap-3">
              <Check size={20} strokeWidth={2.4} color="var(--accent)" aria-hidden="true" className="mt-0.5 shrink-0" />
              Ritual diario activado: {respuestas.momentoDia ?? 'la hora que eligieron'}
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <CtaFijo href={siguiente}>Ver el Plan {nombreMeta}</CtaFijo>
      </div>
    </div>
  );
}
