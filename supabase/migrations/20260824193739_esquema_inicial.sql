-- ============================================================================
-- DuoSync — esquema inicial
-- Patrón: cada dato pertenece a una PAREJA (couple_id), no a un usuario suelto —
-- ambos miembros ven y editan las mismas filas. Es el patrón "organization_id +
-- memberships" de 25-BASE-DE-DATOS.md, adaptado a couples/couple_members.
-- RLS activo en TODA tabla, política envuelta en (select auth.uid()) para que
-- Postgres la evalúe una sola vez por consulta (25 §RLS DE ALTO RENDIMIENTO).
-- ============================================================================

create schema if not exists private;

-- ── PROFILES ────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null check (length(nombre) between 1 and 60),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "select_own_profile" on public.profiles for select
  using ( (select auth.uid()) = id );
create policy "update_own_profile" on public.profiles for update
  using ( (select auth.uid()) = id ) with check ( (select auth.uid()) = id );

-- Crea el perfil automáticamente al registrarse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── COUPLES + COUPLE_MEMBERS ────────────────────────────────────────────────
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  codigo_invitacion text not null unique check (codigo_invitacion ~ '^[0-9]{4}$'),
  plan text not null default 'gratis' check (plan in ('gratis', 'premium')),
  trial_termina_en timestamptz,
  created_at timestamptz not null default now()
);

create table public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);
create index couple_members_user_idx on public.couple_members(user_id);

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;

create policy "select_own_couple" on public.couples for select
  using ( id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );

create policy "select_own_membership" on public.couple_members for select
  using (
    user_id = (select auth.uid())
    or couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid()))
  );

-- Sin políticas de INSERT/UPDATE/DELETE directas: crear pareja y unirse con
-- código son operaciones privilegiadas vía RPC (abajo), nunca un insert libre
-- desde el cliente — así nadie se une a una pareja adivinando un couple_id.

create or replace function private.check_couple_max_2()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if (select count(*) from public.couple_members where couple_id = new.couple_id) >= 2 then
    raise exception 'COUPLE_FULL' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger couple_members_max_2
  before insert on public.couple_members
  for each row execute function private.check_couple_max_2();

-- RPC: crea una pareja con código de invitación de 4 dígitos único y agrega a
-- quien la crea como primer miembro. Atómico.
create or replace function public.crear_pareja()
returns public.couples
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_codigo text;
  v_row public.couples;
  v_intentos int := 0;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  loop
    v_codigo := lpad((floor(random() * 10000))::int::text, 4, '0');
    begin
      insert into public.couples (codigo_invitacion) values (v_codigo) returning * into v_row;
      exit;
    exception when unique_violation then
      v_intentos := v_intentos + 1;
      if v_intentos > 20 then raise exception 'NO_SE_PUDO_GENERAR_CODIGO' using errcode = 'P0001'; end if;
    end;
  end loop;

  insert into public.couple_members (couple_id, user_id) values (v_row.id, v_uid);

  -- Categorías por defecto (mismas de la demo: seed-datos.ts) — personalizables después.
  insert into public.categories (couple_id, nombre, icono, color) values
    (v_row.id, 'Arriendo', 'home', 'accent-2'),
    (v_row.id, 'Servicios', 'receipt', 'accent-2'),
    (v_row.id, 'Mercado', 'shopping-cart', 'accent'),
    (v_row.id, 'Transporte', 'car', 'accent'),
    (v_row.id, 'Ocio', 'popcorn', 'accent');

  insert into public.streaks (couple_id) values (v_row.id);

  return v_row;
end;
$$;
revoke execute on function public.crear_pareja() from anon;
grant execute on function public.crear_pareja() to authenticated;

-- RPC: unirse a una pareja existente con su código de 4 dígitos. Idempotente
-- (si ya es miembro, no falla). ⚠️ Sin límite de intentos todavía — un código de
-- 4 dígitos es adivinable por fuerza bruta; falta agregar throttling antes de
-- lanzar (anotado en ESTADO.md).
create or replace function public.unirse_con_codigo(p_codigo text)
returns public.couples
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_row public.couples;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  select * into v_row from public.couples where codigo_invitacion = p_codigo;
  if not found then raise exception 'CODIGO_INVALIDO' using errcode = 'P0001'; end if;

  if exists (select 1 from public.couple_members where couple_id = v_row.id and user_id = v_uid) then
    return v_row;
  end if;

  insert into public.couple_members (couple_id, user_id) values (v_row.id, v_uid);
  return v_row;
end;
$$;
revoke execute on function public.unirse_con_codigo(text) from anon;
grant execute on function public.unirse_con_codigo(text) to authenticated;

-- ── CATEGORIES ──────────────────────────────────────────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  nombre text not null check (length(nombre) between 1 and 40),
  icono text not null default 'circle',
  color text not null default 'accent' check (color in ('accent', 'accent-2')),
  created_at timestamptz not null default now()
);
create index categories_couple_idx on public.categories(couple_id);

alter table public.categories enable row level security;

create policy "select_couple_categories" on public.categories for select
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
create policy "insert_couple_categories" on public.categories for insert
  with check ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
create policy "update_couple_categories" on public.categories for update
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) )
  with check ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
create policy "delete_couple_categories" on public.categories for delete
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );

-- ── RECEIPT_SCANS (antes de expenses para poder referenciarla) ─────────────
create table public.receipt_scans (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  subido_por uuid not null references auth.users(id),
  imagen_path text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'procesando', 'listo', 'error')),
  monto_detectado numeric(12, 2),
  categoria_sugerida_id uuid references public.categories(id) on delete set null,
  error_mensaje text,
  created_at timestamptz not null default now(),
  procesado_at timestamptz
);
create index receipt_scans_couple_idx on public.receipt_scans(couple_id);

alter table public.receipt_scans enable row level security;

create policy "select_couple_receipt_scans" on public.receipt_scans for select
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
create policy "insert_couple_receipt_scans" on public.receipt_scans for insert
  with check (
    couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid()))
    and subido_por = (select auth.uid())
  );
-- Sin policy de update para authenticated: el estado/monto_detectado los escribe
-- el worker de IA vía service_role (servidor), nunca el cliente.

-- ── EXPENSES ────────────────────────────────────────────────────────────────
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  monto numeric(12, 2) not null check (monto > 0),
  fecha date not null default current_date,
  registrado_por uuid not null references auth.users(id),
  nota text check (nota is null or length(nota) <= 140),
  receipt_scan_id uuid references public.receipt_scans(id) on delete set null,
  created_at timestamptz not null default now()
);
create index expenses_couple_idx on public.expenses(couple_id);
create index expenses_couple_fecha_idx on public.expenses(couple_id, fecha desc);

alter table public.expenses enable row level security;

create policy "select_couple_expenses" on public.expenses for select
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
create policy "insert_couple_expenses" on public.expenses for insert
  with check (
    couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid()))
    and registrado_por = (select auth.uid())
  );
create policy "update_couple_expenses" on public.expenses for update
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) )
  with check ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
create policy "delete_couple_expenses" on public.expenses for delete
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );

-- ── SAVINGS_GOALS ───────────────────────────────────────────────────────────
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  nombre text not null check (length(nombre) between 1 and 60),
  monto_objetivo numeric(12, 2) not null check (monto_objetivo > 0),
  monto_actual numeric(12, 2) not null default 0 check (monto_actual >= 0),
  created_at timestamptz not null default now()
);
create index savings_goals_couple_idx on public.savings_goals(couple_id);

alter table public.savings_goals enable row level security;

create policy "select_couple_goals" on public.savings_goals for select
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
create policy "insert_couple_goals" on public.savings_goals for insert
  with check ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
create policy "update_couple_goals" on public.savings_goals for update
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) )
  with check ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
create policy "delete_couple_goals" on public.savings_goals for delete
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );

-- ── DAILY_QUESTIONS (catálogo global) + DAILY_ANSWERS ──────────────────────
create table public.daily_questions (
  id uuid primary key default gen_random_uuid(),
  texto text not null check (length(texto) between 1 and 200),
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.daily_questions enable row level security;

create policy "select_active_questions" on public.daily_questions for select
  using ( activa = true );
-- Sin insert/update/delete para authenticated: el catálogo se administra por
-- service_role (seed + panel interno futuro).

create table public.daily_answers (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  question_id uuid not null references public.daily_questions(id),
  fecha date not null default current_date,
  user_id uuid not null references auth.users(id),
  respuesta text not null check (length(respuesta) between 1 and 300),
  created_at timestamptz not null default now(),
  unique (couple_id, question_id, fecha, user_id)
);
create index daily_answers_couple_fecha_idx on public.daily_answers(couple_id, fecha);

alter table public.daily_answers enable row level security;

-- NOTA DE PRODUCTO: la mecánica "no ver la respuesta del otro hasta que ambos
-- respondan" es lógica de REVELADO (qué columnas mostrar), no de acceso a la
-- fila — RLS decide QUÉ FILAS existen para el usuario, no puede ocultar
-- selectivamente el contenido de una fila ya visible. Por eso aquí RLS solo
-- garantiza "solo tu pareja ve estas respuestas"; el "ocultar hasta que ambos
-- respondan" se resuelve con una vista o función RPC en la capa de API cuando
-- se conecten las pantallas reales (pendiente, anotado en ESTADO.md).
create policy "select_couple_answers" on public.daily_answers for select
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
create policy "insert_own_answer" on public.daily_answers for insert
  with check (
    couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid()))
    and user_id = (select auth.uid())
  );
create policy "update_own_answer" on public.daily_answers for update
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );

-- ── STREAKS ─────────────────────────────────────────────────────────────────
create table public.streaks (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  dias integer not null default 0 check (dias >= 0),
  ultima_fecha date,
  updated_at timestamptz not null default now()
);

alter table public.streaks enable row level security;

create policy "select_couple_streak" on public.streaks for select
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
-- Sin update para authenticated: la racha la actualiza una función de servidor
-- cuando ambos responden la pregunta del día (Sesión 6, pendiente de conectar).

-- ── DASHBOARD_LAYOUT (por usuario — cada quien ordena su panel) ────────────
create table public.dashboard_layout (
  user_id uuid primary key references auth.users(id) on delete cascade,
  orden jsonb not null default '["hoy", "gastos", "metas", "nosotros"]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_layout enable row level security;

create policy "select_own_layout" on public.dashboard_layout for select
  using ( (select auth.uid()) = user_id );
create policy "upsert_own_layout" on public.dashboard_layout for insert
  with check ( (select auth.uid()) = user_id );
create policy "update_own_layout" on public.dashboard_layout for update
  using ( (select auth.uid()) = user_id ) with check ( (select auth.uid()) = user_id );
