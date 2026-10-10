-- "Ya pagué, conectar mi compra": quien pagó con un correo distinto al de su cuenta lo conecta comprobando,
-- con un código enviado a ese correo, que es suyo. El plan de la pareja se deriva de las suscripciones de
-- los correos de entrada de sus integrantes MÁS los correos de compra conectados.
-- Todo se escribe desde el servidor (clave secreta); el navegador solo puede leer sus propios vínculos.

create table public.linked_purchase_emails (
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null check (email = lower(email)),
  linked_at timestamptz not null default now(),
  primary key (user_id, email)
);
create index linked_purchase_emails_email_idx on public.linked_purchase_emails (email);
alter table public.linked_purchase_emails enable row level security;
create policy "ver mis correos de compra conectados" on public.linked_purchase_emails
  for select using (user_id = (select auth.uid()));
revoke insert, update, delete on public.linked_purchase_emails from anon, authenticated;

-- Códigos de verificación (solo el hash; nunca el código). Sin políticas: ningún cliente los lee.
create table public.purchase_link_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null check (email = lower(email)),
  code_hash text not null,
  attempts smallint not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index purchase_link_codes_user_idx on public.purchase_link_codes (user_id, created_at desc);
alter table public.purchase_link_codes enable row level security;
revoke all on public.purchase_link_codes from anon, authenticated;

-- El plan de la pareja ahora cuenta también los correos de compra conectados por sus integrantes.
create or replace function public.recalcular_plan_pareja(p_couple_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vigente boolean;
  v_trial timestamptz;
begin
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
    exists (
      select 1 from public.subscriptions s
      where s.email in (select email from correos)
        and s.status not in ('expired', 'refunded', 'chargeback')
        and s.access_until > now()
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

create or replace function public.recalcular_plan_por_email(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple uuid;
begin
  for v_couple in
    select cm.couple_id
    from public.couple_members cm
    join auth.users u on u.id = cm.user_id
    where lower(u.email) = lower(p_email)
    union
    select cm.couple_id
    from public.couple_members cm
    join public.linked_purchase_emails l on l.user_id = cm.user_id
    where l.email = lower(p_email)
  loop
    perform public.recalcular_plan_pareja(v_couple);
  end loop;
end;
$$;

-- Crea el código de verificación. Máximo 3 envíos por hora por persona (cuenten o no: la respuesta al
-- usuario es la misma exista o no la compra). Invalida los códigos anteriores.
create or replace function public.crear_codigo_vinculo_compra(p_user uuid, p_email text, p_code_hash text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.purchase_link_codes where user_id = p_user and created_at > now() - interval '1 hour') >= 3 then
    return 'demasiados_envios';
  end if;
  update public.purchase_link_codes set expires_at = now() where user_id = p_user and expires_at > now();
  insert into public.purchase_link_codes (user_id, email, code_hash, expires_at)
  values (p_user, lower(p_email), p_code_hash, now() + interval '10 minutes');
  return 'ok';
end;
$$;

-- Comprueba el código (máx. 5 intentos por código, 10 minutos). Si es correcto conecta el correo y recalcula
-- el plan de la pareja. Un correo de compra se puede conectar a lo sumo a 2 personas (una pareja).
create or replace function public.confirmar_vinculo_compra(p_user uuid, p_email text, p_code_hash text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(p_email);
  v_fila public.purchase_link_codes%rowtype;
begin
  select * into v_fila
  from public.purchase_link_codes
  where user_id = p_user and email = v_email and expires_at > now() and attempts < 5
  order by created_at desc
  limit 1
  for update;

  if not found then
    if exists (select 1 from public.purchase_link_codes where user_id = p_user and email = v_email and expires_at > now() and attempts >= 5) then
      return 'demasiados_intentos';
    end if;
    return 'vencido';
  end if;

  if v_fila.code_hash <> p_code_hash then
    update public.purchase_link_codes set attempts = attempts + 1 where id = v_fila.id;
    if v_fila.attempts + 1 >= 5 then
      return 'demasiados_intentos';
    end if;
    return 'codigo_incorrecto';
  end if;

  if not exists (select 1 from public.linked_purchase_emails where user_id = p_user and email = v_email)
     and (select count(*) from public.linked_purchase_emails where email = v_email) >= 2 then
    update public.purchase_link_codes set expires_at = now() where id = v_fila.id;
    return 'ya_conectada';
  end if;

  insert into public.linked_purchase_emails (user_id, email) values (p_user, v_email) on conflict do nothing;
  update public.purchase_link_codes set expires_at = now() where id = v_fila.id;
  perform public.recalcular_plan_por_email(v_email);
  return 'ok';
end;
$$;

-- Si alguien cambia el correo de su cuenta (p. ej. el invitado que guarda su acceso), su plan se recalcula
-- al instante en vez de esperar al siguiente evento o al cron diario.
create or replace function public.recalcular_plan_al_cambiar_correo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple uuid;
begin
  if new.email is distinct from old.email then
    for v_couple in select couple_id from public.couple_members where user_id = new.id loop
      perform public.recalcular_plan_pareja(v_couple);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists recalcular_plan_al_cambiar_correo on auth.users;
create trigger recalcular_plan_al_cambiar_correo
  after update of email on auth.users
  for each row execute function public.recalcular_plan_al_cambiar_correo();

revoke execute on function public.crear_codigo_vinculo_compra(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.confirmar_vinculo_compra(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.recalcular_plan_al_cambiar_correo() from public, anon, authenticated;
grant execute on function public.crear_codigo_vinculo_compra(uuid, text, text) to service_role;
grant execute on function public.confirmar_vinculo_compra(uuid, text, text) to service_role;
grant execute on function public.recalcular_plan_pareja(uuid) to service_role;
grant execute on function public.recalcular_plan_por_email(text) to service_role;
