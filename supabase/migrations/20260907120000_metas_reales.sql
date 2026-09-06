-- Conecta Metas a datos reales (pedido real del usuario): hoy la pantalla vivía enteramente en
-- datos de ejemplo — solo el nombre era "editable" porque era el único campo guardado en el
-- estado del componente; la fecha y el monto objetivo estaban fijos en el código, y "+ Nueva
-- meta juntos" no tenía ninguna acción conectada. La tabla `savings_goals` ya existía (con sus
-- 4 políticas RLS completas) pero nunca se usó desde el cliente.

alter table public.savings_goals add column if not exists fecha_objetivo date;

-- Aporta a una meta de forma atómica (UPDATE condicional, no "leer saldo en JS y sumar" — evita
-- que un aporte de cada integrante de la pareja, casi al mismo tiempo, se pise entre sí).
create or replace function public.aportar_a_meta(p_meta_id uuid, p_monto numeric)
returns public.savings_goals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.savings_goals;
begin
  if p_monto is null or p_monto <= 0 then
    raise exception 'MONTO_INVALIDO';
  end if;

  update public.savings_goals
  set monto_actual = monto_actual + p_monto
  where id = p_meta_id
    and couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid()))
  returning * into v_row;

  if v_row.id is null then
    raise exception 'META_NO_ENCONTRADA';
  end if;

  return v_row;
end;
$$;

revoke execute on function public.aportar_a_meta(uuid, numeric) from anon;
grant execute on function public.aportar_a_meta(uuid, numeric) to authenticated;
