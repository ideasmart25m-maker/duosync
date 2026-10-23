-- Arreglo de dinero: calcular_saldo_pareja elegía A y B con un join sin orden (limit 1), así que según el orden físico de las
-- filas A podía ser quien creó la pareja y no el UUID menor; la app asume el UUID menor, y en ~la mitad de las parejas el
-- "quién le debe a quién" salía invertido. Ahora el orden es explícito.

-- Saldo por moneda desde la última liquidación, ahora restando los abonos hechos después de ella.
-- Positivo = el integrante de user_id MAYOR le debe al MENOR (igual que antes).
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

  -- Orden determinístico por UUID: A = el menor, B = el mayor (la app usa el mismo criterio para mostrar el saldo).
  -- Antes esto salía de un join con limit 1 sin orden, así que A podía ser quien creó la pareja en vez del menor.
  select m.user_id into v_member_a from public.couple_members m where m.couple_id = p_couple_id order by m.user_id asc limit 1;
  select m.user_id into v_member_b from public.couple_members m where m.couple_id = p_couple_id order by m.user_id desc limit 1;

  if v_member_a is null then return; end if;

  return query
  with ultima_liquidacion as (
    select s.moneda as mon, max(s.created_at) as desde
    from public.settlements s
    where s.couple_id = p_couple_id
    group by s.moneda
  ),
  por_gastos as (
    select
      e.moneda as mon,
      sum(
        case
          when e.registrado_por = v_member_a then e.monto * (100 - coalesce(e.split_percent, c.split_percent)) / 100.0
          else -1 * e.monto * (100 - coalesce(e.split_percent, c.split_percent)) / 100.0
        end
      ) as val
    from public.expenses e
    join public.categories c on c.id = e.category_id
    left join ultima_liquidacion ul on ul.mon is not distinct from e.moneda
    where e.couple_id = p_couple_id
      and (ul.desde is null or e.created_at > ul.desde)
    group by e.moneda
  ),
  por_abonos as (
    -- si paga el integrante mayor (el que debe cuando el saldo es positivo) el saldo baja; si paga el menor, sube hacia 0
    select
      a.moneda as mon,
      sum(case when a.pagado_por = v_member_b then -a.monto else a.monto end) as val
    from public.abonos a
    left join ultima_liquidacion ul on ul.mon is not distinct from a.moneda
    where a.couple_id = p_couple_id
      and (ul.desde is null or a.created_at > ul.desde)
    group by a.moneda
  ),
  juntos as (
    select g.mon, g.val from por_gastos g
    union all
    select b.mon, b.val from por_abonos b
  ),
  neto as (
    select j.mon, sum(j.val) as val from juntos j group by j.mon
  )
  select n.mon, n.val from neto n
  union all
  select null::text, 0::numeric where not exists (select 1 from neto nn where nn.mon is null);
end;
$$;

revoke execute on function public.calcular_saldo_pareja(uuid) from public, anon;
grant execute on function public.calcular_saldo_pareja(uuid) to authenticated;

