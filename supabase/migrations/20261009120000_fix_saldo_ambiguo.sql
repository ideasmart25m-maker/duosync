-- Arreglo: calcular_saldo_pareja fallaba con "column reference "moneda" is ambiguous" apenas la pareja tenía DOS
-- integrantes (el nombre de la columna que devuelve chocaba con un `moneda` sin calificar dentro de la consulta),
-- lo que rompía toda la pantalla de Gastos. Nunca se había probado con una pareja completa.

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
  select null, 0 where not exists (select 1 from agregados ag where ag.moneda is null);
end;
$$;

revoke execute on function public.calcular_saldo_pareja(uuid) from public, anon;
grant execute on function public.calcular_saldo_pareja(uuid) to authenticated;
