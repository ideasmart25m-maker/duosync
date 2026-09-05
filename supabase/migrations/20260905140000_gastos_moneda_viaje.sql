-- Ajuste de enfoque (pedido real del usuario): gastos de viaje en otra moneda (dólares, euros,
-- libras). Se guardan SIN convertir (el usuario ya sabe cuánto pagó en esa moneda — con
-- efectivo, tarjeta o a cuotas, convertir a la fuerza no sería fiel a lo que pagó de verdad).
-- Siguen repartiéndose 50/50 (o el % que corresponda) y sumando al saldo, pero ese saldo se
-- lleva POR SEPARADO por moneda — nunca se mezcla con las cuentas normales de la casa.

alter table public.expenses add column if not exists moneda text
  check (moneda is null or moneda in ('USD', 'EUR', 'GBP'));

alter table public.settlements add column if not exists moneda text
  check (moneda is null or moneda in ('USD', 'EUR', 'GBP'));

drop function if exists public.liquidar_saldo();
drop function if exists public.calcular_saldo_pareja(uuid);

-- Ahora devuelve UNA fila por moneda (moneda null = la moneda normal de la casa) en vez de un
-- solo número — así el saldo de un viaje en euros no se mezcla con el de pesos colombianos.
create or replace function public.calcular_saldo_pareja(p_couple_id uuid)
returns table(moneda text, saldo numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_a uuid;
  v_member_b uuid;
begin
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

  if v_member_a is null then return; end if;

  return query
  with ultima_liquidacion as (
    select s.moneda, max(s.created_at) as desde
    from public.settlements s
    where s.couple_id = p_couple_id
    group by s.moneda
  ),
  agregados as (
    select
      e.moneda,
      sum(
        case
          when e.registrado_por = v_member_a then e.monto * (100 - coalesce(e.split_percent, c.split_percent)) / 100.0
          else -1 * e.monto * (100 - coalesce(e.split_percent, c.split_percent)) / 100.0
        end
      ) as saldo
    from public.expenses e
    join public.categories c on c.id = e.category_id
    left join ultima_liquidacion ul on ul.moneda is not distinct from e.moneda
    where e.couple_id = p_couple_id
      and (ul.desde is null or e.created_at > ul.desde)
    group by e.moneda
  )
  select a.moneda, a.saldo from agregados a
  union all
  select null, 0 where not exists (select 1 from agregados where moneda is null);
end;
$$;

-- Liquida el saldo de UNA moneda a la vez (p_moneda null = la moneda normal de la casa) — un
-- viaje en euros se liquida aparte, sin tocar el saldo de pesos.
create or replace function public.liquidar_saldo(p_moneda text default null)
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

  select r.saldo into v_saldo
  from public.calcular_saldo_pareja(v_couple_id) r
  where r.moneda is not distinct from p_moneda;

  insert into public.settlements (couple_id, monto, creado_por, moneda)
  values (v_couple_id, coalesce(v_saldo, 0), v_uid, p_moneda)
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.calcular_saldo_pareja(uuid) from anon;
grant execute on function public.calcular_saldo_pareja(uuid) to authenticated;
revoke execute on function public.liquidar_saldo(text) from anon;
grant execute on function public.liquidar_saldo(text) to authenticated;
