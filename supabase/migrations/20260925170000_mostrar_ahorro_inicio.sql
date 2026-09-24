-- Preferencia personal: mostrar u ocultar el recuadro de ahorro en Inicio (no a todos les interesa
-- ver esas cifras ahí). Es por persona, no por pareja.
alter table public.profiles add column if not exists mostrar_ahorro_inicio boolean not null default true;
