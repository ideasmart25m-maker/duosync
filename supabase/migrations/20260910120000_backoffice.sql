-- Backoffice del dueño (pedido real del usuario, 2026-09-10): panel privado en /admin, solo
-- para el dueño de la app, con ventas/negocio, usuarios, salud y uso — siguiendo la doctrina de
-- docs/sistema/21-BACKOFFICE.md. Esta migración pone la base: rol de administrador, y las 4
-- tablas de soporte (event_log, error_log, ai_calls, acquisition_spend).

-- ── 1) Rol de administrador ──────────────────────────────────────────────────
alter table public.profiles add column if not exists role text not null default 'user'
  check (role in ('user', 'admin'));
-- Origen del cliente (afiliado/ads/orgánico/directo) — se llenará cuando el checkout capture
-- el UTM/código de afiliado (36-ANALITICA-Y-EVENTOS.md); por ahora queda nulo = "sin dato".
alter table public.profiles add column if not exists source text;

create or replace function public.es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- Marca la cuenta del dueño como admin (si ya existe). Y si la cuenta se crea DESPUÉS de esta
-- migración, `handle_new_user` (redefinida abajo) la marca admin automáticamente al registrarse
-- — así funciona sin importar el orden en que pase.
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'ideasmart.25m@gmail.com');

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    case when new.email = 'ideasmart.25m@gmail.com' then 'admin' else 'user' end
  );
  insert into public.event_log (tipo, user_id, metadata) values ('signup', new.id, '{}'::jsonb);
  return new;
end;
$$;

-- ── 2) event_log — para medir activación, retención y la acción principal ────
create table public.event_log (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  user_id uuid references auth.users(id) on delete set null,
  couple_id uuid references public.couples(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index event_log_tipo_fecha_idx on public.event_log(tipo, created_at desc);
create index event_log_user_idx on public.event_log(user_id);

alter table public.event_log enable row level security;
create policy "insert_own_events" on public.event_log for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "admin_reads_events" on public.event_log for select to authenticated
  using (public.es_admin());

-- ── 3) error_log — errores reales de la app, en lenguaje que el dueño entiende ──
create table public.error_log (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  context text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index error_log_fecha_idx on public.error_log(created_at desc);

alter table public.error_log enable row level security;
create policy "insert_own_errors" on public.error_log for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "admin_reads_errors" on public.error_log for select to authenticated
  using (public.es_admin());

-- ── 4) ai_calls — costo REAL de cada llamada a la IA (no un conteo, un costo en dólares) ────
-- Separada de `ai_usage` (que solo cuenta para el tope de uso) — esta guarda tokens y costo
-- real, se escribe desde el servidor (BFF) justo después de la respuesta de Anthropic, nunca
-- desde el cliente.
create table public.ai_calls (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete set null,
  tipo text not null check (tipo in ('escaneo', 'asistente')),
  modelo text not null,
  tokens_entrada integer not null default 0,
  tokens_salida integer not null default 0,
  costo_usd numeric(10, 6) not null default 0,
  created_at timestamptz not null default now()
);
create index ai_calls_fecha_idx on public.ai_calls(created_at desc);

alter table public.ai_calls enable row level security;
-- Sin insert para authenticated: se escribe solo con la clave de servicio desde las rutas de IA.
create policy "admin_reads_ai_calls" on public.ai_calls for select to authenticated
  using (public.es_admin());

-- ── 5) acquisition_spend — el dueño anota a mano lo que gasta en cada canal ──
create table public.acquisition_spend (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  created_at timestamptz not null default now()
);

alter table public.acquisition_spend enable row level security;
create policy "admin_all_acquisition_spend" on public.acquisition_spend for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

revoke execute on function public.es_admin() from anon;
grant execute on function public.es_admin() to authenticated;
