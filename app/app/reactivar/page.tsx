'use client';

// Pantalla que ve quien NO tiene un plan activo (la prueba o la suscripción terminó y ya pasaron los 2 días de gracia):
// la app interna está bloqueada, pero sus datos siguen guardados. Desde aquí reactiva el plan, conecta una compra hecha con
// otro correo, cierra sesión o escribe a soporte. Si el plan se activa (el pago llega con unos segundos de retraso), entra solo.

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, LogOut, Loader2 } from 'lucide-react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { obtenerCoupleId } from '@/lib/gastos';
import { TuPlan } from '@/components/app/TuPlan';
import { FunnelShell } from '@/components/onboarding/ui';

export default function ReactivarPage() {
  const router = useRouter();
  const [supabase] = useState(() => crearClienteNavegador());
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [saliendo, setSaliendo] = useState(false);

  const revisar = useCallback(async () => {
    const cid = coupleId ?? (await obtenerCoupleId(supabase));
    if (!cid) return;
    setCoupleId(cid);
    const { data } = await supabase.from('couples').select('plan').eq('id', cid).maybeSingle();
    if (data?.plan === 'premium') router.replace('/app/hoy');
  }, [supabase, coupleId, router]);

  // Mira el plan al abrir, cada pocos segundos mientras la pantalla está visible (por si el pago acaba de llegar) y al volver a la pestaña.
  useEffect(() => {
    void revisar();
    const cada = setInterval(() => {
      if (document.visibilityState === 'visible') void revisar();
    }, 6000);
    const alVolver = () => void revisar();
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      clearInterval(cada);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [revisar]);

  const cerrarSesion = async () => {
    setSaliendo(true);
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <FunnelShell>
      <div className="flex flex-1 flex-col gap-5 pb-6 pt-4">
        <Image src="/logo-fairsy.png" alt="Fairsy" width={233} height={128} className="h-8 w-auto self-start" />

        <div>
          <span className="flex size-12 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
            <Lock size={22} strokeWidth={2} color="var(--accent)" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-balance text-[28px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Reactiven su plan para seguir
          </h1>
          <p className="mt-2 text-[16px] leading-snug text-[var(--text-secondary)]">
            Su plan terminó, así que la app está en pausa. <span className="font-semibold text-[var(--text-primary)]">Sus gastos, metas y reportes siguen guardados</span>:
            apenas reactiven, todo queda como lo dejaron.
          </p>
        </div>

        {coupleId ? (
          <TuPlan supabase={supabase} coupleId={coupleId} />
        ) : (
          <div className="flex h-40 items-center justify-center" aria-live="polite">
            <Loader2 size={22} className="animate-spin text-[var(--text-tertiary)]" aria-hidden="true" />
          </div>
        )}

        <section aria-label="¿Ya pagaron?" className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
          <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">¿Ya pagaron y todavía no entran?</h2>
          <p className="mt-1 text-[14px] leading-snug text-[var(--text-secondary)]">Depende del correo que usaron al pagar en Hotmart:</p>
          <ul className="mt-3 flex flex-col gap-3 text-[14px] leading-snug text-[var(--text-secondary)]">
            <li>
              <span className="font-semibold text-[var(--text-primary)]">Pagaron con el mismo correo con el que entran a Fairsy.</span> No tienen que hacer
              nada: el pago puede tardar unos segundos en llegar y esta pantalla los deja entrar sola.
            </li>
            <li>
              <span className="font-semibold text-[var(--text-primary)]">Pagaron con otro correo</span> (por ejemplo, el de la otra persona o uno distinto).
              Toquen <span className="font-semibold text-[var(--text-primary)]">“Conectar mi compra”</span> más arriba, escriban el correo con el que pagaron y
              les enviamos un código de 6 números a ese correo. Lo escriben ahí y listo: entran a su espacio.
            </li>
          </ul>
          <p className="mt-3 text-[13px] leading-snug text-[var(--text-secondary)]">
            ¿Pasaron varios minutos y nada? Escriban a{' '}
            <a href="mailto:soporte@fairsy.lat" className="font-semibold text-[var(--accent)] underline underline-offset-2">
              soporte@fairsy.lat
            </a>{' '}
            con el correo del pago y los ayudamos.
          </p>
        </section>

        <button
          type="button"
          onClick={cerrarSesion}
          disabled={saliendo}
          className="mt-auto flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] text-[15px] font-medium text-[var(--text-secondary)] disabled:opacity-60 [touch-action:manipulation]"
        >
          {saliendo ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
          Cerrar sesión
        </button>
      </div>
    </FunnelShell>
  );
}
