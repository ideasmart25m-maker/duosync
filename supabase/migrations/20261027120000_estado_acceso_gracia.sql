-- Para avisar dentro de la app cuando el plan ya venció pero siguen en los 2 días de gracia: el cliente no puede leer
-- `subscriptions` (solo el servidor), así que esta función devuelve SOLO eso —si están en gracia y hasta cuándo—, y
-- únicamente para el espacio de quien pregunta.
create or replace function public.estado_acceso()
returns table(en_gracia boolean, gracia_hasta timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_couple uuid;
  v_manual boolean;
  v_fin timestamptz;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  select cm.couple_id into v_couple from public.couple_members cm where cm.user_id = v_uid limit 1;
  if v_couple is null then
    return query select false, null::timestamptz;
    return;
  end if;
  select c.acceso_manual into v_manual from public.couples c where c.id = v_couple;

  with correos as (
    select lower(u.email) as email
    from public.couple_members cm
    join auth.users u on u.id = cm.user_id
    where cm.couple_id = v_couple and u.email is not null
    union
    select l.email
    from public.couple_members cm
    join public.linked_purchase_emails l on l.user_id = cm.user_id
    where cm.couple_id = v_couple
  )
  select max(s.access_until) into v_fin
  from public.subscriptions s
  where s.email in (select email from correos)
    and s.status not in ('expired', 'refunded', 'chargeback');

  if coalesce(v_manual, false) or v_fin is null or v_fin > now() or v_fin + interval '2 days' <= now() then
    return query select false, null::timestamptz;
  else
    return query select true, v_fin + interval '2 days';
  end if;
end;
$$;

revoke execute on function public.estado_acceso() from public, anon;
grant execute on function public.estado_acceso() to authenticated;
