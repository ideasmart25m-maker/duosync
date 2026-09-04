-- Parte 1 (pedido real del usuario): dividir cada gasto en un % configurable (no siempre
-- 50/50) y llevar un saldo acumulado de quién le debe a quién, liquidable con un botón.

-- % de reparto por defecto de la categoría — representa cuánto le corresponde a quien
-- REGISTRA el gasto (`expenses.registrado_por`); el resto (100-split_percent) es lo que le
-- corresponde a su pareja. Arranca en 50 (mitad y mitad) y se puede cambiar por categoría.
alter table public.categories add column if not exists split_percent smallint not null default 50
  check (split_percent between 0 and 100);

-- Override puntual por gasto (nullable = usa el % de su categoría). Pedido real: "un gasto
-- puntual se puede repartir distinto sin cambiar el % de toda la categoría".
alter table public.expenses add column if not exists split_percent smallint
  check (split_percent is null or split_percent between 0 and 100);

-- Liquidaciones — cada fila es un "ya nos pusimos al día": el saldo pendiente se calcula
-- SIEMPRE desde la última liquidación (o desde el inicio si no hay ninguna), nunca se borra
-- el historial de gastos para "limpiar" el saldo.
create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  monto numeric(12, 2) not null,
  creado_por uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index settlements_couple_idx on public.settlements(couple_id, created_at desc);

alter table public.settlements enable row level security;

create policy "select_couple_settlements" on public.settlements for select
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
-- Sin policy de INSERT directa: se crea únicamente vía la función `liquidar_saldo()` de
-- abajo, que calcula el monto server-side — nunca se confía en un monto que mande el cliente.

-- Calcula el saldo pendiente de la pareja desde la última liquidación (o desde siempre).
-- Positivo = el usuario con el user_id MAYOR (member_b, orden determinístico por UUID, no
-- importa quién se unió primero) le debe al MENOR (member_a). Negativo = al revés.
create or replace function public.calcular_saldo_pareja(p_couple_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_a uuid;
  v_member_b uuid;
  v_desde timestamptz;
  v_saldo numeric := 0;
begin
  -- security definer se salta RLS a propósito (para sumar sin fricción), así que la
  -- verificación de pertenencia se hace A MANO aquí — sin esto, cualquier usuario autenticado
  -- podría pasar el couple_id de otra pareja y leer su saldo (IDOR).
  if not exists (
    select 1 from public.couple_members where couple_id = p_couple_id and user_id = (select auth.uid())
  ) then
    raise exception 'NO_PERTENECE_A_LA_PAREJA';
  end if;

  select least(m1.user_id, m2.user_id), greatest(m1.user_id, m2.user_id)
    into v_member_a, v_member_b
  from public.couple_members m1
  join public.couple_members m2 on m1.couple_id = m2.couple_id
  where m1.couple_id = p_couple_id
  limit 1;

  if v_member_a is null then return 0; end if;

  select max(created_at) into v_desde from public.settlements where couple_id = p_couple_id;

  select coalesce(sum(
    case
      when e.registrado_por = v_member_a then e.monto * (100 - coalesce(e.split_percent, c.split_percent)) / 100.0
      else -1 * e.monto * (100 - coalesce(e.split_percent, c.split_percent)) / 100.0
    end
  ), 0)
  into v_saldo
  from public.expenses e
  join public.categories c on c.id = e.category_id
  where e.couple_id = p_couple_id
    and (v_desde is null or e.created_at > v_desde);

  return v_saldo;
end;
$$;

-- Liquida el saldo actual (lo calcula ella misma, nunca confía en el monto del cliente) y
-- verifica que quien llama pertenece a esa pareja.
create or replace function public.liquidar_saldo()
returns public.settlements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_couple_id uuid;
  v_saldo numeric;
  v_row public.settlements;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  select couple_id into v_couple_id from public.couple_members where user_id = v_uid limit 1;
  if v_couple_id is null then raise exception 'SIN_PAREJA'; end if;

  v_saldo := public.calcular_saldo_pareja(v_couple_id);

  insert into public.settlements (couple_id, monto, creado_por)
  values (v_couple_id, v_saldo, v_uid)
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.calcular_saldo_pareja(uuid) from anon;
grant execute on function public.calcular_saldo_pareja(uuid) to authenticated;
revoke execute on function public.liquidar_saldo() from anon;
grant execute on function public.liquidar_saldo() to authenticated;
