'use client';

// "Tu momento Fairsy": un mensaje del día, una acción pequeña y la planta que crece con la racha de los dos. El
// mensaje y la acción cambian cada día (mismos para los dos integrantes). La acción lee el estado real: mientras no
// tengan presupuesto o meta, propone crearlos; después rota. No se muestra aparte cuando la acción es "respondan la
// pregunta", porque la pregunta está justo debajo.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plant, Fire, CalendarCheck, CaretRight } from '@phosphor-icons/react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { consejoDelDia, HREF_DESTINO } from '@/lib/consejos';
import { PlantaRacha, etapaDeRacha } from '@/components/app/PlantaRacha';
import { CalendarioRacha } from '@/components/app/CalendarioRacha';

function fechaLocal(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}

export function MomentoFairsy({
  supabase,
  coupleId,
  racha,
  tienePresupuesto,
  tieneMeta,
}: {
  supabase: SupabaseClient;
  coupleId: string;
  racha: number;
  tienePresupuesto: boolean;
  tieneMeta: boolean;
}) {
  // Día de la casa (según su país); si la consulta falla se usa el del teléfono.
  const [fecha, setFecha] = useState(fechaLocal);
  const [verRacha, setVerRacha] = useState(false);

  useEffect(() => {
    let cancelado = false;
    supabase.rpc('fecha_de_hoy').then(({ data }) => {
      if (!cancelado && typeof data === 'string') setFecha(data);
    });
    return () => {
      cancelado = true;
    };
  }, [supabase]);

  const { mensaje, accion } = consejoDelDia(fecha, coupleId, { tienePresupuesto, tieneMeta });
  const etapa = etapaDeRacha(racha);
  const dias = `${racha} ${racha === 1 ? 'día' : 'días'}`;

  const contenidoAccion = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
        <CalendarCheck size={20} weight="bold" color="var(--accent)" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Acción de hoy</span>
        <span className="mt-0.5 block text-[14px] leading-snug text-[var(--text-primary)]">{accion.texto}</span>
      </span>
      {accion.destino && <CaretRight size={18} weight="bold" className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />}
    </>
  );
  const claseAccion = 'flex items-center gap-3 rounded-[var(--radius-button)] bg-[var(--surface)] p-3 shadow-[var(--shadow-1)]';

  return (
    <section
      aria-label="Tu momento Fairsy"
      className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--accent-2)_28%,transparent)] p-4 shadow-[var(--shadow-2)]"
      style={{ background: 'linear-gradient(160deg, color-mix(in oklab, var(--accent-2) 16%, var(--surface)) 0%, var(--surface) 62%)' }}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-2)]">
            <Plant size={16} weight="bold" aria-hidden="true" />
            Tu momento Fairsy
          </p>
          <h2 className="mt-2 text-balance text-[20px] font-bold leading-tight text-[var(--accent-2)] [font-family:var(--font-display)]">{mensaje.titulo}</h2>
          <p className="mt-1 text-[14px] leading-snug text-[var(--text-secondary)]">{mensaje.detalle}</p>
        </div>

        <button
          type="button"
          onClick={() => setVerRacha(true)}
          aria-label={`Ver su racha: ${dias}, ${etapa.nombre.toLowerCase()}`}
          className="flex min-h-11 shrink-0 flex-col items-center [touch-action:manipulation]"
        >
          <PlantaRacha dias={racha} className="size-[88px]" />
          <span className="-mt-1 flex items-center gap-1 rounded-full bg-[var(--surface)] py-1 pl-2 pr-1.5 text-[12px] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-1)]">
            <Fire size={12} weight="fill" color="var(--accent)" aria-hidden="true" />
            {dias}
            <CaretRight size={11} weight="bold" className="text-[var(--text-tertiary)]" aria-hidden="true" />
          </span>
          <span className="mt-0.5 text-[12px] text-[var(--text-secondary)]">{etapa.nombre}</span>
        </button>
      </div>

      {accion.destino !== 'pregunta' && (
        <div className="mt-3">
          {accion.destino === null ? (
            <div className={claseAccion}>{contenidoAccion}</div>
          ) : accion.destino === 'presupuesto' ? (
            <a href={HREF_DESTINO.presupuesto} className={`${claseAccion} [touch-action:manipulation]`}>
              {contenidoAccion}
            </a>
          ) : (
            <Link href={HREF_DESTINO[accion.destino]} className={`${claseAccion} [touch-action:manipulation]`}>
              {contenidoAccion}
            </Link>
          )}
        </div>
      )}

      {verRacha && <CalendarioRacha supabase={supabase} coupleId={coupleId} racha={racha} onCerrar={() => setVerRacha(false)} />}
    </section>
  );
}
