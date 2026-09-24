-- Un viaje puede ser a cualquier país: la moneda deja de limitarse a USD/EUR/GBP (cualquier código
-- ISO de 3 letras) y las subcategorías de gasto de viaje pueden ser propias (texto libre corto).

alter table public.viajes drop constraint if exists viajes_moneda_check;
alter table public.viajes add constraint viajes_moneda_check check (moneda ~ '^[A-Z]{3}$');

alter table public.expenses drop constraint if exists expenses_moneda_check;
alter table public.expenses add constraint expenses_moneda_check check (moneda is null or moneda ~ '^[A-Z]{3}$');

alter table public.settlements drop constraint if exists settlements_moneda_check;
alter table public.settlements add constraint settlements_moneda_check check (moneda is null or moneda ~ '^[A-Z]{3}$');

alter table public.expenses drop constraint if exists expenses_subcategoria_check;
alter table public.expenses add constraint expenses_subcategoria_check
  check (subcategoria is null or length(btrim(subcategoria)) between 1 and 40);
