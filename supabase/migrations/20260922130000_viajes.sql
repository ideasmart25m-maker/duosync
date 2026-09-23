-- Viajes con nombre propio (pedido del usuario: hoy un "viaje" es solo "gastos en otra
-- moneda", sin nombre ni identidad — quiere poder llamarlo "Viaje New York" y ver sus gastos
-- agrupados ahí, siempre separados de las cuentas locales).
--
-- Diseño deliberadamente liviano: NO se toca `calcular_saldo_pareja`/`liquidar_saldo` (siguen
-- agrupando por `expenses.moneda`, que sigue siendo la fuente de verdad para plata/saldos —
-- tocar esa función es alto riesgo). `viaje_id` es solo para AGRUPAR Y NOMBRAR en pantalla; el
-- dinero se sigue calculando exactamente igual que antes.

create table public.viajes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  nombre text not null check (length(nombre) between 1 and 60),
  moneda text not null check (moneda in ('USD', 'EUR', 'GBP')),
  created_at timestamptz not null default now()
);
create index viajes_couple_idx on public.viajes(couple_id);

alter table public.viajes enable row level security;

create policy "select_couple_viajes" on public.viajes for select
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
create policy "insert_couple_viajes" on public.viajes for insert
  with check ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );

alter table public.expenses add column if not exists viaje_id uuid references public.viajes(id) on delete set null;
create index if not exists expenses_viaje_idx on public.expenses(viaje_id) where viaje_id is not null;
