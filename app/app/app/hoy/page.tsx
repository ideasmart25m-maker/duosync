'use client';

// Pantalla HOY — protagonista de la app interna (Sesión 5, SECUENCIA-MAESTRA §Paso 5).
// Objeto principal: la pregunta diaria de conexión (el gancho de retención — loop en ESTADO.md:
// Gatillo → Acción → Recompensa → Inversión). Mecánica: la respuesta de cada uno queda oculta
// hasta que AMBOS respondan (revelar coincidencia) — nunca se ve la respuesta del otro antes.
// Dispositivo ownable: mismo hero-card sólido de onboarding/HeroVisual (FICHA-ARTE.md).

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { animate, motion, useReducedMotion } from 'motion/react';
import { GearSix, Sparkle, Plus, ArrowRight, PencilSimple, X, Check, CircleNotch, Camera } from '@phosphor-icons/react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { obtenerCoupleId, obtenerPaisPareja, obtenerPresupuestoPareja, actualizarPresupuestoPareja, obtenerGastadoDelMes } from '@/lib/gastos';
import {
  obtenerPreguntaDeHoy,
  obtenerRespuestasDeHoy,
  responderPreguntaHoy,
  obtenerRachaPareja,
  obtenerNombresPareja,
  subirAvatar,
  type PreguntaDB,
} from '@/lib/preguntas';
import { nombreLegible, listarMetas, listarAportesDelMes, obtenerMostrarAhorro, guardarMostrarAhorro, type MetaDB } from '@/lib/metas';
import { formatoMoneda } from '@/lib/paises';
import { InvitarPareja } from '@/components/app/InvitarPareja';
import { GuardarAcceso } from '@/components/app/GuardarAcceso';
import { MomentoFairsy } from '@/components/app/MomentoFairsy';
import { GuiaPagina } from '@/components/app/GuiaPagina';
import type { SupabaseClient } from '@supabase/supabase-js';
import { InputMonto } from '@/components/ui/InputMonto';
import { AlertaPresupuesto } from '@/components/app/AlertaPresupuesto';
import { evaluarPresupuesto } from '@/lib/presupuesto';

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

function PreguntaDelDia({
  supabase,
  miUserId,
  nombreOtro,
  onRachaActualizada,
}: {
  supabase: SupabaseClient;
  miUserId: string;
  nombreOtro: string | null;
  onRachaActualizada: (dias: number) => void;
}) {
  const [cargando, setCargando] = useState(true);
  const [pregunta, setPregunta] = useState<PreguntaDB | null>(null);
  const [respuestaPropia, setRespuestaPropia] = useState<string | null>(null);
  const [respuestaOtro, setRespuestaOtro] = useState<string | null>(null);
  const [borrador, setBorrador] = useState('');
  const [vacio, setVacio] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ambosRespondieron = respuestaOtro !== null;

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const p = await obtenerPreguntaDeHoy(supabase);
        if (cancelado) return;
        setPregunta(p);
        const respuestas = await obtenerRespuestasDeHoy(supabase, p.id);
        if (cancelado) return;
        setRespuestaPropia(respuestas.find((r) => r.userId === miUserId)?.respuesta ?? null);
        setRespuestaOtro(respuestas.find((r) => r.userId !== miUserId)?.respuesta ?? null);
      } catch {
        setError('No pudimos cargar la pregunta de hoy.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [supabase, miUserId]);

  const enviar = async () => {
    if (!borrador.trim()) {
      setVacio(true);
      return;
    }
    if (!pregunta || enviando) return;
    setVacio(false);
    setError(null);
    setEnviando(true);
    try {
      const resultado = await responderPreguntaHoy(supabase, pregunta.id, borrador.trim());
      setRespuestaPropia(borrador.trim());
      onRachaActualizada(resultado.rachaDias);
      if (resultado.ambosRespondieron) {
        const respuestas = await obtenerRespuestasDeHoy(supabase, pregunta.id);
        setRespuestaOtro(respuestas.find((r) => r.userId !== miUserId)?.respuesta ?? null);
      }
    } catch {
      setError('No pudimos guardar tu respuesta. Intenten de nuevo en un momento.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div id="pregunta-del-dia" className="scroll-mt-4 rounded-[var(--radius-card)] bg-[var(--accent-2)] p-4 text-[var(--bg)] shadow-[var(--shadow-hero)]">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] opacity-80">Pregunta para los dos</p>

      {cargando || !pregunta ? (
        <div className="mt-1 h-16 animate-pulse rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--bg)_15%,transparent)]" />
      ) : (
        <p className="text-balance text-[22px] font-bold leading-snug [font-family:var(--font-display)]">{pregunta.texto}</p>
      )}

      {respuestaPropia === null && !ambosRespondieron && !cargando && pregunta && (
        <p className="mt-2 text-[13px] leading-snug opacity-85">Cada uno responde aparte; al terminar los dos, se revelan.</p>
      )}

      {error && <p className="mt-2 text-[12px] font-medium opacity-90">{error}</p>}

      {!cargando && pregunta && (
        <>
          {ambosRespondieron ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 flex flex-col gap-2"
            >
              <div className="rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--bg)_24%,transparent)] p-3 shadow-[0_2px_6px_rgba(0,0,0,0.18)]">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] opacity-70">{nombreOtro ?? 'La otra persona'}</p>
                <p className="mt-0.5 text-[15px] leading-snug">{respuestaOtro}</p>
              </div>
              <div className="rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--bg)_24%,transparent)] p-3 shadow-[0_2px_6px_rgba(0,0,0,0.18)]">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] opacity-70">Tú</p>
                <p className="mt-0.5 text-[15px] leading-snug">{respuestaPropia}</p>
              </div>
            </motion.div>
          ) : respuestaPropia !== null ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-[15px] leading-relaxed opacity-85">
                Ya respondiste. En cuanto {nombreOtro ?? 'la otra persona'} conteste, se revelan las dos respuestas.
              </p>
              {/* Un typo antes quedaba irrecuperable hasta que ambos respondían — defecto real
                  detectado por el revisor-visual. Editar reescribe la misma fila (la función
                  `responder_pregunta_hoy` hace upsert), no crea una respuesta duplicada. */}
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
                disabled={enviando}
                className="flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--bg)_26%,transparent)] text-[15px] font-semibold text-[var(--bg)] [touch-action:manipulation] disabled:opacity-70"
              >
                {enviando && <CircleNotch size={16} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />}
                {enviando ? 'Enviando…' : 'Responder'}
              </motion.button>
            </form>
          )}
        </>
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
  const disponibleMostrado = useCountUp(Math.abs(presupuesto !== null ? presupuesto - gastado : 0));

  // Identidad real de la pareja (pedido real del usuario, hallazgo de la auditoría 2026-09-08):
  // antes "Mateo & Sofía" y la racha eran datos de ejemplo fijos en el código.
  const [supabase] = useState(() => crearClienteNavegador());
  const [userId, setUserId] = useState<string | null>(null);
  const [nombrePropio, setNombrePropio] = useState('Tú');
  const [emailPropio, setEmailPropio] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreDescartado, setNombreDescartado] = useState(false);
  const [borradorNombre, setBorradorNombre] = useState('');
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [nombreOtro, setNombreOtro] = useState<string | null>(null);
  const [avatarPropio, setAvatarPropio] = useState<string | null>(null);
  const [avatarOtro, setAvatarOtro] = useState<string | null>(null);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [errorAvatar, setErrorAvatar] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [racha, setRacha] = useState(0);

  // País/moneda — antes vivía solo al fondo de Nosotros; el usuario pidió subirlo a esta
  // tarjeta, donde de verdad se usa (define en qué moneda se ven presupuesto/gastado/saldo).

  // Meta real (primera de la pareja) para la tarjeta de vista previa — antes mostraba siempre
  // el dato de ejemplo fijo "Viaje a Cartagena, 31%" (defecto real reportado por el usuario:
  // ya no coincidía con las metas reales de Metas, conectada desde el 2026-09-07). `null` =
  // todavía no crearon ninguna meta.
  const [metaPrincipal, setMetaPrincipal] = useState<MetaDB | null>(null);
  const [cargandoMeta, setCargandoMeta] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [intentoCarga, setIntentoCarga] = useState(0);
  const [avisoVinculacion, setAvisoVinculacion] = useState<string | null>(null);
  const [ahorrado, setAhorrado] = useState(0);
  const [mostrarAhorro, setMostrarAhorro] = useState(true);

  useEffect(() => {
    const motivo = new URLSearchParams(window.location.search).get('vinculacion');
    const mensajes: Record<string, string> = {
      codigo: 'Ese código de conexión no existe. Pídele a la otra persona que te lo envíe de nuevo.',
      intentos: 'Probaste demasiados códigos seguidos. Espera 15 minutos y vuelve a intentarlo.',
      ya_tienes_pareja: 'Esta cuenta ya tiene su propio espacio con datos, así que no puede unirse a otro. Usa otro correo para unirte.',
      error: 'No pudimos unirte. Pídele a la otra persona que te envíe el código otra vez.',
    };
    if (motivo) setAvisoVinculacion(mensajes[motivo] ?? mensajes.error);
    setSaludo(saludoDelDia());
    setMesLabel(mesActualLabel());
    // Presupuesto/gastado real de Supabase (pedido real del usuario) — antes esta tarjeta
    // mostraba "Gastado este mes" con datos de EJEMPLO fijos que nunca coincidían con lo que
    // de verdad registraban en Gastos, y no había forma de definir un presupuesto.
    (async () => {
      try {
      const {
        data: { user },
        error: errorSesion,
      } = await supabase.auth.getUser();
      if (!user) {
        console.error('[hoy] sin sesión', errorSesion);
        setErrorCarga('Tu sesión no está activa. Vuelve a entrar con tu correo.');
        return;
      }
      setUserId(user.id);
      setEmailPropio(user.email ?? null);

      const cid = await obtenerCoupleId(supabase);
      if (!cid) {
        setErrorCarga('No encontramos tu espacio compartido en esta cuenta.');
        return;
      }
      setCoupleId(cid);
      const ahora = new Date();
      const prefijoMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
      // Cada dato carga por separado: antes un solo fallo (por ejemplo la foto o la racha)
      // tumbaba TODA la tarjeta y parecía que el presupuesto y los gastos no se habían guardado
      // (reporte real de la usuaria, 2026-09-23).
      const [rPais, rPresupuesto, rGastado, rNombres, rRacha, rMetas, rAhorro, rMostrar] = await Promise.allSettled([
        obtenerPaisPareja(supabase, cid),
        obtenerPresupuestoPareja(supabase, cid),
        obtenerGastadoDelMes(supabase, cid, prefijoMes),
        obtenerNombresPareja(supabase, cid, user.id),
        obtenerRachaPareja(supabase, cid),
        listarMetas(supabase, cid),
        listarAportesDelMes(supabase, cid, prefijoMes),
        obtenerMostrarAhorro(supabase, user.id),
      ]);
      if (rPais.status === 'fulfilled') setPais(rPais.value);
      if (rPresupuesto.status === 'fulfilled') setPresupuesto(rPresupuesto.value);
      if (rGastado.status === 'fulfilled') setGastado(rGastado.value);
      if (rNombres.status === 'fulfilled') {
        setNombrePropio(rNombres.value.propio);
        setNombreOtro(rNombres.value.otro);
        setAvatarPropio(rNombres.value.avatarPropio);
        setAvatarOtro(rNombres.value.avatarOtro);
      }
      if (rRacha.status === 'fulfilled') setRacha(rRacha.value);
      if (rMetas.status === 'fulfilled') setMetaPrincipal(rMetas.value[0] ?? null);
      if (rMostrar.status === 'fulfilled') setMostrarAhorro(rMostrar.value);
      if (rAhorro.status === 'fulfilled') setAhorrado(rAhorro.value.reduce((a, x) => a + x.total, 0));
      const fallos = [rPais, rPresupuesto, rGastado, rNombres, rRacha, rMetas, rAhorro, rMostrar].filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
      if (fallos.length > 0) {
        console.error('[hoy] no cargó:', fallos.map((f) => (f.reason instanceof Error ? f.reason.message : JSON.stringify(f.reason))).join(' | '));
        setErrorCarga('Revisa tu conexión e inténtalo de nuevo.');
      }
      setCargandoMeta(false);
      } catch (e) {
        console.error('[hoy] error inesperado', e);
        setErrorCarga('Revisa tu conexión e inténtalo de nuevo.');
        setCargandoMeta(false);
      }
    })();
  }, [supabase, intentoCarga]);

  const elegirFotoDePerfil = async (archivo: File | undefined) => {
    if (!archivo || !userId) return;
    setSubiendoAvatar(true);
    setErrorAvatar(null);
    try {
      const url = await subirAvatar(supabase, userId, archivo);
      setAvatarPropio(url);
    } catch {
      // Antes era silencioso y quien lo intentaba creía que la app no dejaba subir fotos.
      setErrorAvatar('No pudimos subir la foto. Prueba con otra imagen (JPG o PNG) o inténtalo de nuevo.');
    } finally {
      setSubiendoAvatar(false);
    }
  };

  const cambiarMostrarAhorro = (mostrar: boolean) => {
    setMostrarAhorro(mostrar);
    if (userId) guardarMostrarAhorro(supabase, userId, mostrar).catch(() => setMostrarAhorro(!mostrar));
  };

  const guardarPresupuesto = async () => {
    const valor = Number(borradorPresupuesto);
    if (!valor || valor <= 0) {
      setErrorPresupuesto('Escribe un valor mayor que cero.');
      return;
    }
    setGuardandoPresupuesto(true);
    setErrorPresupuesto(null);
    try {
      await actualizarPresupuestoPareja(supabase, valor);
      setPresupuesto(valor);
      setEditandoPresupuesto(false);
    } catch {
      setErrorPresupuesto('No pudimos guardar el presupuesto. Intenten de nuevo en un momento.');
    } finally {
      setGuardandoPresupuesto(false);
    }
  };

  // Si todavía se llama como el inicio de su correo (así se crea la cuenta), se le pregunta cómo se llama.
  // (o 'Invitado': el nombre provisional de quien entró con el enlace, sin correo).
  const nombreAutomatico = nombrePropio === 'Invitado' || nombrePropio === 'Tu pareja' || (!!emailPropio && nombrePropio.trim().toLowerCase() === emailPropio.split('@')[0].toLowerCase());
  const mostrarPreguntaNombre = editandoNombre || (nombreAutomatico && !nombreDescartado && !cargandoMeta);

  const guardarNombre = async () => {
    const nombre = borradorNombre.trim();
    if (!nombre || nombre.length > 60 || !userId || guardandoNombre) return;
    setGuardandoNombre(true);
    setErrorNombre(null);
    const { error } = await supabase.from('profiles').update({ nombre }).eq('id', userId);
    setGuardandoNombre(false);
    if (error) {
      setErrorNombre('No pudimos guardar tu nombre. Intenta de nuevo en un momento.');
      return;
    }
    setNombrePropio(nombre);
    setEditandoNombre(false);
  };

  const disponible = presupuesto !== null ? presupuesto - gastado : null;
  const pctMeta = metaPrincipal ? Math.min(100, Math.round((metaPrincipal.montoActual / metaPrincipal.montoObjetivo) * 100)) : 0;

  const entrada = (delay: number) => ({
    initial: reducido ? { opacity: 0 } : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reducido ? 0.2 : 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    // gap-4 (no gap-5): la tarjeta de Meta quedaba cortada de golpe contra el velo del nav sin
    // llegar a mostrar su título ni el % en la vista inicial sin scroll (defecto real detectado
    // por el revisor-visual) — este ajuste libera ~16px para que se note más de esa tarjeta.
    <div className="flex flex-col gap-3">
      <motion.div {...entrada(0)} className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          {/* Antes repetía el nombre en las dos líneas ("Buenas tardes, Sofía" + "Mateo &
              Sofía") sin sumar información nueva — defecto real detectado por el revisor-visual.
              El saludo solo, los nombres quedan una única vez, en el título. */}
          {/* Con presupuesto definido, la línea del dinero ocupa el lugar del saludo (más abajo), para no restarle altura al botón de registrar gasto. */}
          {!(presupuesto !== null && disponible !== null) && <p className="text-[12px] font-medium text-[var(--text-tertiary)]">{saludo}</p>}
          <h1 className="flex min-w-0 items-center gap-1.5 text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">
            <span className="min-w-0 truncate">{nombreOtro ? `${nombrePropio} & ${nombreOtro}` : nombrePropio}</span>
            <button
              type="button"
              onClick={() => {
                setBorradorNombre(nombrePropio);
                setErrorNombre(null);
                setEditandoNombre(true);
              }}
              aria-label="Cambiar mi nombre"
              className="-mx-2 -my-2 flex size-11 shrink-0 items-center justify-center text-[var(--text-tertiary)] [touch-action:manipulation]"
            >
              <PencilSimple size={13} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </h1>
          {/* Lo que más importa del dinero, a la vista desde el primer pantallazo sin cambiar el orden de las tarjetas. */}
          {presupuesto !== null && disponible !== null && (
            <p className={`mt-0.5 text-[13px] font-semibold tabular-nums ${disponible < 0 ? 'text-[var(--danger)]' : 'text-[var(--accent-2)]'}`}>
              {disponible < 0 ? 'Se pasaron por' : 'Les quedan'} {formatoMoneda(Math.abs(disponible), pais)} este mes
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/app/cuenta"
            aria-label="Mi cuenta"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] [touch-action:manipulation]"
          >
            <GearSix size={20} strokeWidth={2} aria-hidden="true" />
          </Link>
          <div className="flex -space-x-2">
          {/* Burbuja propia: sube/cambia la foto de perfil real (pedido del usuario) — antes
              solo mostraba la inicial, sin forma de ponerle una foto de verdad. */}
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            aria-label="Cambiar tu foto de perfil"
            disabled={subiendoAvatar}
            className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--bg)] bg-[var(--accent-2)] text-[12px] font-bold text-[var(--bg)] shadow-[var(--shadow-1)] [touch-action:manipulation] disabled:opacity-70"
          >
            {avatarPropio ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL pública dinámica del bucket, no un asset local
              <img src={avatarPropio} alt="" className="size-full object-cover" />
            ) : (
              nombrePropio[0]?.toUpperCase() ?? '?'
            )}
            <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border border-[var(--bg)] bg-[var(--surface)] shadow-[var(--shadow-1)]">
              {subiendoAvatar ? (
                <CircleNotch size={10} strokeWidth={2.4} className="animate-spin" color="var(--accent-2)" aria-hidden="true" />
              ) : (
                <Camera size={10} strokeWidth={2.4} color="var(--accent-2)" aria-hidden="true" />
              )}
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              elegirFotoDePerfil(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {nombreOtro && (
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--bg)] bg-[var(--accent)] text-[12px] font-bold text-[var(--bg)] shadow-[var(--shadow-1)]">
              {avatarOtro ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL pública dinámica del bucket
                <img src={avatarOtro} alt="" className="size-full object-cover" />
              ) : (
                nombreOtro[0]?.toUpperCase() ?? '?'
              )}
            </span>
          )}
          </div>
        </div>
      </motion.div>

      {errorAvatar && (
        <p role="alert" className="text-[13px] font-medium text-[var(--danger)]">
          {errorAvatar}
        </p>
      )}

      {avisoVinculacion && (
        <div role="alert" className="rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] p-4 text-[14px] text-[var(--danger)]">
          <p className="font-semibold">No pudimos unirte</p>
          <p className="mt-1">{avisoVinculacion}</p>
        </div>
      )}

      {coupleId && userId && !cargandoMeta ? (
        <motion.div {...entrada(0.07)}>
          <MomentoFairsy supabase={supabase} coupleId={coupleId} racha={racha} tienePresupuesto={presupuesto !== null && presupuesto > 0} tieneMeta={metaPrincipal !== null} />
        </motion.div>
      ) : (
        <div className="h-[236px] animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)]" aria-hidden="true" />
      )}

      {mostrarPreguntaNombre && !editandoNombre && (
        <div className="flex items-center gap-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--accent)_30%,transparent)] bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))] pl-3">
          <button
            type="button"
            onClick={() => {
              setBorradorNombre(nombrePropio);
              setErrorNombre(null);
              setEditandoNombre(true);
            }}
            className="flex min-h-11 flex-1 items-center gap-2 text-left text-[14px] text-[var(--text-primary)] [touch-action:manipulation]"
          >
            <PencilSimple size={14} strokeWidth={2.2} color="var(--accent)" aria-hidden="true" />
            <span>
              <span className="font-semibold">¿Cómo te llamas?</span> Toca para escribir tu nombre
            </span>
          </button>
          <button
            type="button"
            onClick={() => setNombreDescartado(true)}
            aria-label="Ahora no"
            className="flex size-11 shrink-0 items-center justify-center text-[var(--text-tertiary)] [touch-action:manipulation]"
          >
            <X size={16} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      )}

      {mostrarPreguntaNombre && editandoNombre && (
        <form
          className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--accent)_30%,transparent)] bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))] p-4"
          onSubmit={(e) => {
            e.preventDefault();
            guardarNombre();
          }}
        >
          <label htmlFor="mi-nombre" className="text-[15px] font-semibold text-[var(--text-primary)]">
            ¿Cómo te llamas?
          </label>
          <p className="text-[12px] text-[var(--text-secondary)]">Es el nombre que verá la otra persona en la app.</p>
          <input
            id="mi-nombre"
            value={borradorNombre}
            onChange={(e) => setBorradorNombre(e.target.value)}
            placeholder="Tu nombre"
            maxLength={60}
            autoComplete="given-name"
            className="h-12 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-[16px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
          {errorNombre && <p className="text-[12px] font-medium text-[var(--danger)]">{errorNombre}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEditandoNombre(false);
                setNombreDescartado(true);
              }}
              className="flex h-11 flex-1 items-center justify-center rounded-[var(--radius-button)] text-[14px] font-medium text-[var(--text-tertiary)] [touch-action:manipulation]"
            >
              Ahora no
            </button>
            <button
              type="submit"
              disabled={!borradorNombre.trim() || guardandoNombre}
              className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)] disabled:opacity-50 [touch-action:manipulation]"
            >
              {guardandoNombre && <CircleNotch size={15} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />}
              Guardar mi nombre
            </button>
          </div>
        </form>
      )}

      {/* Invitar a la pareja es parte central de lo que ofrece la app: se ve aquí hasta que la otra
          persona se une, y desaparece sola cuando eso pasa (el componente se oculta con 2 integrantes). */}
      {coupleId && <InvitarPareja supabase={supabase} coupleId={coupleId} />}

      <GuardarAcceso supabase={supabase} />

      <motion.div {...entrada(0.14)}>
        {userId ? (
          <PreguntaDelDia supabase={supabase} miUserId={userId} nombreOtro={nombreOtro} onRachaActualizada={setRacha} />
        ) : (
          <div className="h-[220px] animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
        )}
      </motion.div>

      <MotionLink
        {...entrada(0.21)}
        whileTap={{ scale: 0.98 }}
        href="/app/gastos?nuevo=1"
        className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_24px_color-mix(in_oklab,var(--accent)_28%,transparent)] [touch-action:manipulation]"
      >
        <Plus size={20} strokeWidth={2.4} aria-hidden="true" />
        Registrar gasto
      </MotionLink>

      <motion.div
        id="presupuesto-mensual"
        {...entrada(0.28)}
        className="scroll-mt-4 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4 shadow-[var(--shadow-2)]"
      >
        {errorCarga && (
          <div className="mb-3 rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] p-3 text-[12px] text-[var(--danger)]">
            <p className="font-semibold">No pudimos cargar todos tus datos.</p>
            <p className="mt-0.5 break-words opacity-90">{errorCarga}</p>
            <button
              type="button"
              onClick={() => {
                setErrorCarga(null);
                setCargandoMeta(true);
                setIntentoCarga((n) => n + 1);
              }}
              className="mt-1.5 flex min-h-11 items-center font-semibold underline [touch-action:manipulation]"
            >
              Reintentar
            </button>
          </div>
        )}
        {editandoPresupuesto ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              guardarPresupuesto();
            }}
          >
            <label className="text-[12px] font-medium text-[var(--text-tertiary)]">Nuestro presupuesto mensual</label>
            <InputMonto
              autoFocus
              value={borradorPresupuesto}
              onValueChange={setBorradorPresupuesto}
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
            {/* Presupuesto en su propio recuadro (fondo neutro) y el ahorro aparte, en verde — son
                cosas distintas: el ahorro NO es un gasto y no debe confundirse con el saldo. */}
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setBorradorPresupuesto(presupuesto ? String(presupuesto) : '');
                  setEditandoPresupuesto(true);
                }}
                className="-my-2 flex min-h-11 items-center gap-1.5 [touch-action:manipulation]"
              >
                <p className="text-[12px] font-medium text-[var(--text-secondary)]">Nuestro presupuesto del mes</p>
                <PencilSimple size={12} strokeWidth={2.2} color="var(--text-secondary)" aria-hidden="true" />
              </button>
              <Link href="/app/gastos" className="-my-2 flex min-h-11 shrink-0 items-center gap-1 text-[13px] font-semibold text-[var(--accent)]">
                Ver todo
                <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </div>

            {presupuesto === null ? (
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Aún no lo han definido — toquen el lápiz para ponerlo.</p>
            ) : (
              <>
                {/* Lo que importa de un vistazo: cuánto les queda. Es el número héroe de la tarjeta; lo demás
                    (presupuesto y gastado) va como apoyo, una sola capa y una sola barra. */}
                <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{(disponible ?? 0) < 0 ? 'Se pasaron por' : 'Les quedan este mes'}</p>
                <p
                  className={`text-[32px] font-bold leading-tight [font-variant-numeric:lining-nums_proportional-nums] [font-family:var(--font-display)] ${(disponible ?? 0) < 0 ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}
                >
                  {formatoMoneda(disponibleMostrado, pais)}
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)]">
                  <motion.div
                    className={`h-full rounded-full ${gastado > presupuesto ? 'bg-[var(--danger)]' : gastado / presupuesto >= 0.8 ? 'bg-[var(--cat-amber)]' : 'bg-[var(--accent-2)]'}`}
                    initial={{ width: reducido ? `${Math.min(100, (gastado / presupuesto) * 100)}%` : 0 }}
                    animate={{ width: `${Math.min(100, (gastado / presupuesto) * 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <p className="mt-1.5 text-[13px] text-[var(--text-secondary)]">
                  Gastado <span className="font-semibold tabular-nums text-[var(--text-primary)]">{formatoMoneda(gastadoMostrado, pais)}</span> de{' '}
                  <span className="font-semibold tabular-nums text-[var(--text-primary)]">{formatoMoneda(presupuesto, pais)}</span>
                </p>
                <div className="mt-3 empty:hidden">
                  <AlertaPresupuesto estado={evaluarPresupuesto(gastado, presupuesto)} formatear={(n) => formatoMoneda(n, pais)} sinRestante />
                </div>
              </>
            )}

          </>
        )}
      </motion.div>

      {ahorrado > 0 && mostrarAhorro && (
        <motion.div {...entrada(0.31)} className="rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--accent-2)_10%,var(--surface))] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-[var(--accent-2)]">Ahorro en metas este mes</p>
            <button
              type="button"
              onClick={() => cambiarMostrarAhorro(false)}
              aria-label="Ocultar el ahorro de Inicio"
              className="-my-2 flex min-h-11 shrink-0 items-center px-1 text-[13px] font-semibold text-[var(--text-secondary)] underline underline-offset-2 [touch-action:manipulation]"
            >
              Ocultar
            </button>
          </div>
          <p className="mt-0.5 text-[20px] font-bold [font-variant-numeric:lining-nums_proportional-nums] text-[var(--accent-2)] [font-family:var(--font-display)]">
            {formatoMoneda(ahorrado, pais)}
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">No cuenta como gasto.</p>
        </motion.div>
      )}
      {ahorrado > 0 && !mostrarAhorro && (
        <button
          type="button"
          onClick={() => cambiarMostrarAhorro(true)}
          className="flex min-h-11 w-fit items-center text-[13px] font-semibold text-[var(--accent)] [touch-action:manipulation]"
        >
          Mostrar mi ahorro aquí
        </button>
      )}

      {cargandoMeta ? (
        <div className="h-[72px] animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
      ) : metaPrincipal ? (
        <MotionLink
          {...entrada(0.35)}
          whileTap={{ scale: 0.98 }}
          href="/app/metas"
          className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] [touch-action:manipulation]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
            <Sparkle size={18} strokeWidth={2} color="var(--accent)" aria-hidden="true" />
          </span>
          <span className="flex-1">
            <span className="flex items-baseline justify-between">
              {/* Meta real (la primera de la pareja) — antes era el dato de ejemplo fijo
                  "Viaje a Cartagena, 31%", que ya no coincidía con las metas reales creadas en
                  Metas (defecto real reportado por el usuario). */}
              <span className="text-[15px] font-semibold text-[var(--text-primary)]">{nombreLegible(metaPrincipal.nombre)}</span>
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
      ) : (
        <MotionLink
          {...entrada(0.35)}
          whileTap={{ scale: 0.98 }}
          href="/app/metas"
          className="flex items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_oklab,var(--accent)_35%,transparent)] p-4 [touch-action:manipulation]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
            <Sparkle size={18} strokeWidth={2} color="var(--accent)" aria-hidden="true" />
          </span>
          <span className="flex-1 text-[14px] font-semibold text-[var(--accent)]">Pongan su primera meta juntos</span>
          <ArrowRight size={16} strokeWidth={2.2} color="var(--accent)" aria-hidden="true" />
        </MotionLink>
      )}

      <GuiaPagina
        id="hoy"
        abrirPrimeraVez={false}
        items={[
          { titulo: 'Tu momento Fairsy', texto: 'Un mensaje y una acción pequeña cada día. La planta crece con los días seguidos en que los dos responden la pregunta.' },
          { titulo: 'La pregunta para los dos', texto: 'Cada uno responde por separado; cuando terminan los dos, se muestran las respuestas. Sirve para hablar de dinero sin tensión.' },
          { titulo: 'Presupuesto del mes', texto: 'Cuánto llevan gastado frente a lo que definieron, y cuánto les queda. Con un aviso cuando se acercan al límite.' },
          { titulo: 'Registrar gasto y metas', texto: 'Desde aquí anotan un gasto en segundos y ven cómo va su meta de ahorro.' },
        ]}
      />

    </div>
  );
}
