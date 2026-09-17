import type { LucideIcon } from 'lucide-react';

// Chip circular + ícono, mismo dispositivo visual ya usado en toda la app (Hoy, Gastos, Metas)
// — antes las secciones del panel eran solo texto plano, indistinguibles de cualquier backoffice
// genérico (defecto real detectado por el revisor-visual: "sin dispositivo ownable de marca").
export function TituloSeccion({
  icono: Icono,
  children,
  nivel = 'h2',
}: {
  icono: LucideIcon;
  children: React.ReactNode;
  /** Nivel semántico del encabezado — h2 para el título de página, h3 para subsecciones bajo ese h2. */
  nivel?: 'h2' | 'h3';
}) {
  const Encabezado = nivel;
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
        <Icono size={14} strokeWidth={2.2} color="var(--accent)" aria-hidden="true" />
      </span>
      <Encabezado className="text-[15px] font-semibold text-[var(--text-primary)]">{children}</Encabezado>
    </div>
  );
}
