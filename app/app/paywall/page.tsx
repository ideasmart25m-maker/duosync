'use client';

// Paywall de DuoSync Wallet — blueprint C1 de 50-DISENO-ONBOARDING-PAYWALL.md (single-page, el
// default corto y escaneable). Copy derivado de FICHA-AVATAR.md (57 §9): headline = deseo
// tangible #1, subtítulo ancla el dolor #1 ("equipo, no administradores" — mismo eco que la
// landing), CTA = identidad aspiracional en 1ª persona PLURAL (es un plan de a dos, no de uno).
// Precio idéntico al de la landing (FICHA-MERCADO.md §1): $5.99/mes · $35.94/año ($3.00/mes,
// ahorro exacto del 50%). Garantía: 15 días (verificado en Hotmart, FICHA-MERCADO §4). Reusa
// CheckCustom/Hairline del kit de la landing (app/components/landing/ui.tsx) — mismo sistema de
// checks y bordes en toda la app. Dispositivo ownable: el par de avatares M/S del HeroVisual de
// la landing, repetido aquí — el plan es DE ESTA pareja, no una plantilla genérica.

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { animate, motion, useReducedMotion } from 'motion/react';
import { X, Lock, Loader2 } from 'lucide-react';
import { FunnelShell } from '@/components/onboarding/ui';
import { CheckCustom, Hairline } from '@/components/landing/ui';

function fechaEnDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
}

// Conteo animado del precio al montar (baseline obligatoria de movimiento — defecto real
// detectado: los montos aparecían estáticos, sin la animación de "número héroe" del sistema).
function PrecioAnimado({ valor }: { valor: number }) {
  const reducido = useReducedMotion();
  const [mostrado, setMostrado] = useState(reducido ? valor : 0);
  useEffect(() => {
    if (reducido) return;
    const controls = animate(0, valor, {
      duration: 0.7,
      delay: 0.3,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setMostrado(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- corre una vez al montar por cada card
  }, []);
  return <>${mostrado.toFixed(2)}</>;
}

function PaywallInner() {
  const router = useRouter();
  const params = useSearchParams();
  const meta = params.get('meta');
  // El código y el modo de vinculación viajan desde el onboarding hasta el login,
  // que es donde recién hay una sesión real para poder crear/unir la pareja de verdad.
  const modo = params.get('modo') ?? 'crear';
  const codigo = params.get('codigo') ?? '';
  const [plan, setPlan] = useState<'anual' | 'mensual'>('anual');
  const [cargando, setCargando] = useState(false);
  const [errorNav, setErrorNav] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const reducido = useReducedMotion();

  const nombrePlan = meta ? `Plan ${meta}` : 'plan';
  const fechaCobro = useMemo(() => fechaEnDias(7), []);
  const siguienteLogin = (planElegido: string) =>
    `/login?plan=${planElegido}&modo=${modo}&codigo=${encodeURIComponent(codigo)}`;

  // Mismo feedback de navegación que `elegir()` — antes "Cerrar"/"Ahora no" quedaban mudos
  // tras el tap mientras el CTA principal sí mostraba estado de carga (defecto real detectado
  // por el revisor-visual: inconsistencia entre las dos salidas de la misma pantalla).
  const salir = () => {
    if (saliendo) return;
    setSaliendo(true);
    router.push(siguienteLogin('free'));
  };
  const elegir = () => {
    if (cargando) return;
    setErrorNav(false);
    setCargando(true);
    router.push(siguienteLogin(plan));
    // Si la navegación no resolvió en 8s (conexión lenta/colgada), se lo decimos y
    // reactivamos el botón — nunca dejarlo muerto sin explicación (defecto real detectado).
    setTimeout(() => {
      setCargando(false);
      setErrorNav(true);
    }, 8000);
  };

  const entrada = (delay: number) => ({
    initial: reducido ? { opacity: 0 } : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reducido ? 0.2 : 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <FunnelShell>
      {/* Profundidad: mismo mesh del Hero de la landing. Centro DENTRO del viewport visible
          (antes -15%/-5% caía fuera de pantalla y el gradiente se apagaba antes de llegar al
          contenido — defecto real detectado por el revisor-visual en dos rondas seguidas). */}
      <div className="relative -mx-4 overflow-hidden px-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(480px 320px at 15% 8%, color-mix(in oklab, var(--accent) 38%, transparent) 0%, transparent 62%), ' +
              'radial-gradient(420px 300px at 100% 15%, color-mix(in oklab, var(--accent-2) 32%, transparent) 0%, transparent 58%)',
          }}
        />

        <div className="flex h-11 items-center justify-between">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={salir}
            disabled={saliendo}
            aria-label="Cerrar"
            className="flex size-11 items-center justify-center text-[var(--text-secondary)] [touch-action:manipulation] disabled:opacity-60"
          >
            <X size={20} strokeWidth={2.2} aria-hidden="true" />
          </motion.button>
        </div>

        <motion.div {...entrada(0)} className="mt-1">
          {/* Dispositivo ownable: el par de avatares CONECTADOS por un vínculo propio (no dos
              círculos apilados como cualquier UI de colaboración — defecto real detectado). */}
          <div className="mb-2 flex items-center gap-3">
            <div className="relative flex items-center">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--bg)] bg-[var(--accent-2)] text-[12px] font-bold text-[var(--bg)] shadow-[var(--shadow-1)]">
                M
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--bg)] bg-[var(--accent)] text-[12px] font-bold text-[var(--bg)] shadow-[var(--shadow-1)] -ml-2.5">
                S
              </span>
            </div>
            <span className="rounded-full bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] px-2.5 py-1 text-[12px] font-semibold text-[var(--accent)]">
              Conectados
            </span>
          </div>
          <h1 className="text-balance text-[32px] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Su {nombrePlan} <span className="text-[var(--accent)]">está listo</span>
          </h1>
          <p className="mt-1 text-[16px] leading-snug text-[var(--text-secondary)]">
            Se acabó sentirse <span className="font-semibold text-[var(--text-primary)]">&quot;el cobrador&quot;</span> —
            ahora son equipo, no administradores.
          </p>
        </motion.div>
      </div>

      <motion.div {...entrada(0.08)} className="mt-2 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
        <ul className="flex flex-col gap-2 text-[16px] text-[var(--text-primary)]">
          <li className="flex items-start gap-2">
            <CheckCustom />
            <span className="font-semibold">Un solo pago cubre a los dos</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCustom />
            Cuentas claras, sin pelear por dinero
          </li>
          <li className="flex items-start gap-2">
            <CheckCustom />
            Historial ilimitado de gastos
          </li>
          <li className="flex items-start gap-2">
            <CheckCustom />
            Escaneen recibos con IA, sin teclear
          </li>
        </ul>
      </motion.div>

      <motion.div {...entrada(0.16)} className="mt-3 flex flex-col gap-2">
        <Hairline emphasis={plan === 'anual'} surface="surface" className="relative">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPlan('anual')}
            className={`w-full rounded-[var(--radius-button)] p-4 text-left shadow-[var(--shadow-1)] [touch-action:manipulation] transition-colors duration-150 ${
              plan === 'anual' ? 'bg-[color-mix(in_oklab,var(--accent)_7%,var(--surface))]' : 'bg-[var(--surface)]'
            }`}
          >
            <span className="absolute -top-3 left-4 rounded-full bg-[var(--accent)] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--bg)]">
              Ahorran 50%
            </span>
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-semibold text-[var(--text-primary)]">Anual</span>
              <span className="flex items-baseline gap-1">
                <span className="text-[24px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
                  <PrecioAnimado valor={3} />
                </span>
                <span className="text-[12px] text-[var(--text-secondary)]">/mes</span>
              </span>
            </div>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Se cobra $35.94/año · 7 días gratis</p>
          </motion.button>
        </Hairline>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => setPlan('mensual')}
          className={`rounded-[var(--radius-button)] border p-4 text-left shadow-[var(--shadow-1)] [touch-action:manipulation] transition-colors duration-150 ${
            plan === 'mensual'
              ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_7%,var(--surface))]'
              : 'border-[color-mix(in_oklab,var(--text-tertiary)_22%,transparent)] bg-[var(--surface)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-semibold text-[var(--text-primary)]">Mensual</span>
            <span className="flex items-baseline gap-1">
              <span className="text-[24px] font-bold tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
                <PrecioAnimado valor={5.99} />
              </span>
              <span className="text-[12px] text-[var(--text-secondary)]">/mes</span>
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">7 días gratis · cancelan cuando quieran</p>
        </motion.button>
      </motion.div>

      <div className="mt-auto pt-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={elegir}
          disabled={cargando}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_24px_color-mix(in_oklab,var(--accent)_28%,transparent)] [touch-action:manipulation] disabled:opacity-80"
        >
          {cargando && <Loader2 size={18} strokeWidth={2.4} className="animate-spin" aria-hidden="true" />}
          {cargando ? 'Abriendo su plan…' : `Empezar nuestro ${nombrePlan}`}
        </motion.button>
        {errorNav ? (
          <p className="mt-2 text-center text-[12px] font-medium text-[var(--danger)]">
            Esto está tardando más de lo normal. Toquen de nuevo para reintentar.
          </p>
        ) : (
          // Única mención de la garantía en toda la pantalla (antes se repetía en un badge
          // aparte debajo — defecto real detectado: redundancia que sumaba altura sin sumar
          // claridad). Explícito que el cobro llega DESPUÉS del trial, no antes.
          <p className="mt-2 text-center text-[12px] text-[var(--text-secondary)]">
            Gratis 7 días, se cobra recién el {fechaCobro}. ¿No les convence? 15 días de garantía.
          </p>
        )}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={salir}
          disabled={saliendo}
          className="flex h-11 w-full items-center justify-center text-[16px] font-medium text-[var(--text-tertiary)] [touch-action:manipulation] disabled:opacity-60"
        >
          Ahora no, seguir con la versión gratis
        </motion.button>
        <div className="flex items-center justify-center text-[12px] text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1.5">
            <Lock size={14} strokeWidth={2} aria-hidden="true" />
            Pago seguro con Hotmart
          </span>
        </div>
      </div>
    </FunnelShell>
  );
}

export default function PaywallPage() {
  return (
    <Suspense fallback={null}>
      <PaywallInner />
    </Suspense>
  );
}
