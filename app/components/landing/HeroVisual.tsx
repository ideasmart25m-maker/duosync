// Vista previa del producto para el Hero: captura REAL de la pantalla "Hoy" a 375px, con datos de
// ejemplo (Mateo y Sofía), dentro del mismo marco de teléfono del carrusel "La app por dentro".
// Para actualizarla, volver a tomar public/landing/app-hoy.png con la app sembrada (ver ESTADO.md).

import Image from 'next/image';

export function HeroVisual() {
  return (
    <div className="relative mx-auto flex w-full flex-col items-center gap-4 overflow-hidden rounded-[var(--radius-card)] bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_oklab,var(--accent-2)_16%,var(--surface-2)),var(--surface-2)_70%)] px-6 pb-0 pt-6 sm:px-10">
      {/* Dispositivo firma (FICHA-ARTE): el par de avatares M/S ancla que la pantalla es DE una pareja concreta */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          <span className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--surface-2)] bg-[var(--accent-2)] text-[13px] font-bold text-[var(--bg)]">M</span>
          <span className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--surface-2)] bg-[var(--accent)] text-[13px] font-bold text-[var(--bg)]">S</span>
        </div>
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">Mateo &amp; Sofía, a su manera</span>
      </div>
      <div
        className="relative aspect-[9/16.1] w-[250px] overflow-hidden rounded-t-[30px] border-[5px] border-b-0 shadow-[var(--shadow-2)]"
        style={{ borderColor: 'color-mix(in oklab, var(--text-primary) 90%, var(--accent))' }}
      >
        <Image
          src="/landing/app-hoy.png"
          alt="Pantalla de inicio de Fairsy: el mensaje del día, la planta que crece con la racha de 12 días y la pregunta para los dos"
          width={375}
          height={812}
          priority
          className="h-full w-full object-cover object-top"
        />
      </div>
    </div>
  );
}
