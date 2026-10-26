-- Bloqueo total: sin plan activo no se entra a la app. Dos cosas nuevas:
--  1) 2 días de gracia después de que vence el acceso, para renovar sin quedarse afuera.
--  2) `acceso_manual`: el dueño puede dejar un espacio activo a mano (el suyo, los de prueba) sin pasar por Hotmart.

alter table public.couples add column if not exists acceso_manual boolean not null default false;

create or replace function public.recalcular_plan_pareja(p_couple_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vigente boolean;
  v_trial timestamptz;
  v_manual boolean;
begin
  select c.acceso_manual into v_manual from public.couples c where c.id = p_couple_id;

  with correos as (
    select lower(u.email) as email
    from public.couple_members cm
    join auth.users u on u.id = cm.user_id
    where cm.couple_id = p_couple_id and u.email is not null
    union
    select l.email
    from public.couple_members cm
    join public.linked_purchase_emails l on l.user_id = cm.user_id
    where cm.couple_id = p_couple_id
  )
  select
    coalesce(v_manual, false) or exists (
      select 1 from public.subscriptions s
      where s.email in (select email from correos)
        and s.status not in ('expired', 'refunded', 'chargeback')
        -- 2 días de gracia después del fin del acceso pagado
        and s.access_until + interval '2 days' > now()
    ),
    (
      select max(s.trial_ends_at) from public.subscriptions s
      where s.email in (select email from correos) and s.status = 'trialing' and s.access_until > now()
    )
  into v_vigente, v_trial;

  update public.couples
  set plan = case when v_vigente then 'premium' else 'gratis' end,
      trial_termina_en = v_trial
  where id = p_couple_id
    and (plan is distinct from (case when v_vigente then 'premium' else 'gratis' end) or trial_termina_en is distinct from v_trial);
end;
$$;

revoke execute on function public.recalcular_plan_pareja(uuid) from public, anon, authenticated;
grant execute on function public.recalcular_plan_pareja(uuid) to service_role;

-- Los espacios que ya existen hoy son del dueño y de pruebas: se dejan activos a mano para que el bloqueo no los saque.
-- Se pueden quitar uno por uno desde el panel de administración (Usuarios → "Quitar acceso manual").
update public.couples set acceso_manual = true;
do $$
declare v_id uuid;
begin
  for v_id in select id from public.couples loop
    perform public.recalcular_plan_pareja(v_id);
  end loop;
end $$;
