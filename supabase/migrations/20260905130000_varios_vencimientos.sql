-- Ajuste de enfoque (pedido real del usuario): una categoría como "Servicios públicos" agrupa
-- varias facturas con fechas distintas (acueducto, energía, gas) — antes solo admitía UN día
-- de vencimiento por categoría, obligando a crear una categoría separada por cada factura.
-- Ahora admite VARIOS días en la misma categoría.

alter table public.categories drop constraint if exists categories_recurrente_check;

alter table public.categories add column if not exists dias_vencimiento smallint[];

-- Migra el dato existente (una fila con un solo día) a la nueva forma (arreglo de un elemento).
update public.categories set dias_vencimiento = array[dia_vencimiento] where dia_vencimiento is not null;

alter table public.categories drop column if exists dia_vencimiento;

alter table public.categories add constraint categories_recurrente_check
  check (
    (es_recurrente and dias_vencimiento is not null and array_length(dias_vencimiento, 1) > 0)
    or (not es_recurrente and dias_vencimiento is null)
  );

-- Cada día vencido de cada categoría se avisa por separado (antes la idempotencia era por
-- categoría+mes, y bloqueaba el segundo aviso del mismo mes si había más de una fecha).
alter table public.recordatorios_enviados drop constraint if exists recordatorios_enviados_category_id_anio_mes_key;
alter table public.recordatorios_enviados add column if not exists dia smallint not null default 1;
alter table public.recordatorios_enviados add constraint recordatorios_enviados_unico
  unique (category_id, anio, mes, dia);
