-- Pagos fijos con valor mensual (pedido de la usuaria): cada categoría recurrente guarda cuánto
-- se paga cada mes (un valor por fecha de vencimiento, en el mismo orden que dias_vencimiento) y,
-- opcionalmente, quién lo paga siempre. Si paga_user_id es null, paga quien toque "Registrar pago".
--
-- No se toca calcular_saldo_pareja/liquidar_saldo: el pago se registra como un gasto normal.

alter table public.categories add column if not exists montos_mensuales numeric[];
alter table public.categories add column if not exists paga_user_id uuid references auth.users(id) on delete set null;

-- Quien paga debe ser integrante de la misma pareja (RLS de UPDATE no lo verifica por columna).
create or replace function public.validar_paga_user_categoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.paga_user_id is not null and not exists (
    select 1 from public.couple_members where couple_id = new.couple_id and user_id = new.paga_user_id
  ) then
    raise exception 'PAGA_USER_NO_ES_DE_LA_PAREJA';
  end if;
  return new;
end;
$$;

drop trigger if exists validar_paga_user_categoria on public.categories;
create trigger validar_paga_user_categoria
  before insert or update of paga_user_id on public.categories
  for each row execute function public.validar_paga_user_categoria();
