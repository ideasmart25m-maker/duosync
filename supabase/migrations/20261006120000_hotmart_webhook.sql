-- Webhook de Hotmart: suscripciones por correo del comprador, dedupe de eventos, bitácora y ledger.
-- Todo se escribe SOLO desde el servidor (clave secreta); ninguna tabla es legible por clientes.
-- `couples.plan` sigue siendo lo que lee toda la app: se DERIVA de estas suscripciones.

create table public.subscriptions (
  email text primary key check (email = lower(email)),
  provider text not null default 'hotmart',
  subscriber_code text,
  status text not null check (status in ('trialing', 'active', 'past_due', 'cancelled', 'expired', 'refunded', 'chargeback')),
  plan_interval text check (plan_interval in ('mensual', 'anual')),
  offer_code text,
  last_transaction text,
  trial_ends_at timestamptz,
  first_paid_at timestamptz,
  access_until timestamptz not null,
  welcome_sent_at timestamptz,
  last_event_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create index subscriptions_subscriber_code_idx on public.subscriptions(subscriber_code) where subscriber_code is not null;
alter table public.subscriptions enable row level security;

create table public.processed_events (
  event_id text primary key,
  event_type text not null,
  payload_hash text,
  status text not null default 'processing' check (status in ('processing', 'completed')),
  processed_at timestamptz not null default now()
);
alter table public.processed_events enable row level security;

create table public.webhook_log (
  id bigserial primary key,
  event_id text,
  type text,
  result text not null check (result in ('applied', 'duplicate', 'ignored', 'illegal', 'unauthorized', 'error')),
  detail text,
  payload jsonb,
  received_at timestamptz not null default now()
);
create index webhook_log_received_idx on public.webhook_log (received_at desc);
create index webhook_log_result_idx on public.webhook_log (result, received_at desc);
alter table public.webhook_log enable row level security;

-- Un ingreso económico se cuenta UNA sola vez aunque lleguen APPROVED y COMPLETE (event_id distintos).
create table public.payment_transactions (
  provider text not null,
  transaction_id text not null,
  economic_kind text not null check (economic_kind in ('sale', 'refund', 'chargeback')),
  product_id text,
  offer_id text,
  amount_minor bigint not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  occurred_at timestamptz not null,
  raw_event_id text not null,
  primary key (provider, transaction_id, economic_kind)
);
alter table public.payment_transactions enable row level security;

revoke all on public.subscriptions, public.processed_events, public.webhook_log, public.payment_transactions from anon, authenticated;
revoke all on sequence public.webhook_log_id_seq from anon, authenticated;

-- ¿Alguien de la pareja tiene una suscripción con acceso vigente? → premium; si no → gratis.
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
  select
    exists (
      select 1
      from public.couple_members cm
      join auth.users u on u.id = cm.user_id
      join public.subscriptions s on s.email = lower(u.email)
      where cm.couple_id = p_couple_id
        and s.status not in ('expired', 'refunded', 'chargeback')
        and s.access_until > now()
    ),
    (
      select max(s.trial_ends_at)
      from public.couple_members cm
      join auth.users u on u.id = cm.user_id
      join public.subscriptions s on s.email = lower(u.email)
      where cm.couple_id = p_couple_id and s.status = 'trialing' and s.access_until > now()
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
    select distinct cm.couple_id
    from public.couple_members cm
    join auth.users u on u.id = cm.user_id
    where lower(u.email) = lower(p_email)
  loop
    perform public.recalcular_plan_pareja(v_couple);
  end loop;
end;
$$;

-- Para el cron diario: baja a gratis las parejas cuyo acceso ya venció (sin depender de un evento).
create or replace function public.recalcular_planes_vencidos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple uuid;
  v_n integer := 0;
begin
  for v_couple in select id from public.couples where plan = 'premium' loop
    perform public.recalcular_plan_pareja(v_couple);
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

revoke execute on function public.recalcular_plan_pareja(uuid) from public, anon, authenticated;
revoke execute on function public.recalcular_plan_por_email(text) from public, anon, authenticated;
revoke execute on function public.recalcular_planes_vencidos() from public, anon, authenticated;
grant execute on function public.recalcular_plan_pareja(uuid) to service_role;
grant execute on function public.recalcular_plan_por_email(text) to service_role;
grant execute on function public.recalcular_planes_vencidos() to service_role;

-- Quien pagó antes de crear su cuenta (o entra a una pareja nueva) recibe premium apenas queda en la pareja.
create or replace function public.recalcular_plan_al_unirse()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalcular_plan_pareja(new.couple_id);
  return new;
end;
$$;

drop trigger if exists recalcular_plan_al_unirse on public.couple_members;
create trigger recalcular_plan_al_unirse
  after insert on public.couple_members
  for each row execute function public.recalcular_plan_al_unirse();
