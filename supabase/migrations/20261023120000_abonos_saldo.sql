-- Abonos al saldo: cuando quien debe no puede pagar todo de una vez, va anotando lo que paga y el saldo
-- baja en ese valor. "Ya nos pusimos al día" sigue cerrando el período (la liquidación ignora los abonos
-- anteriores a ella, igual que ignora los gastos anteriores).

create table public.abonos (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  -- null = moneda normal de la casa; un viaje en otra moneda se abona aparte, igual que se liquida aparte
  moneda text check (moneda is null or moneda ~ '^[A-Z]{3}$'),
  monto numeric(12, 2) not null check (monto > 0),
  pagado_por uuid not null references auth.users(id),
  registrado_por uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index abonos_couple_idx on public.abonos(couple_id, created_at desc);

alter table public.abonos enable row level security;

create policy "select_couple_abonos" on public.abonos for select
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
-- Sin policy de INSERT/UPDATE/DELETE directa: se crea únicamente con `registrar_abono()`, que decide ella
-- misma quién paga (el que debe) y que el abono no supere el saldo — nunca se confía en el cliente para eso.

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

  select least(m1.user_id, m2.user_id), greatest(m1.user_id, m2.user_id)
    into v_member_a, v_member_b
  from public.couple_members m1
  join public.couple_members m2 on m1.couple_id = m2.couple_id
  where m1.couple_id = p_couple_id
  limit 1;

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

-- Registra un abono del que debe a quien le debe. El que paga lo decide el signo del saldo actual: no se
-- puede abonar con el saldo en 0 ni abonar más de lo que se debe.
create or replace function public.registrar_abono(p_monto numeric, p_moneda text default null)
returns public.abonos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_couple_id uuid;
  v_member_a uuid;
  v_member_b uuid;
  v_saldo numeric;
  v_deudor uuid;
  v_row public.abonos;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;
  if p_monto is null or p_monto <= 0 then raise exception 'MONTO_INVALIDO'; end if;

  select couple_id into v_couple_id from public.couple_members where user_id = v_uid limit 1;
  if v_couple_id is null then raise exception 'SIN_PAREJA'; end if;

  select min(user_id), max(user_id) into v_member_a, v_member_b
  from public.couple_members where couple_id = v_couple_id;
  if v_member_a = v_member_b then raise exception 'SIN_OTRA_PERSONA'; end if;

  select r.saldo into v_saldo
  from public.calcular_saldo_pareja(v_couple_id) r
  where r.moneda is not distinct from p_moneda;

  if v_saldo is null or abs(v_saldo) < 0.01 then raise exception 'SIN_SALDO'; end if;
  if p_monto > abs(v_saldo) + 0.005 then raise exception 'MAYOR_AL_SALDO'; end if;

  v_deudor := case when v_saldo > 0 then v_member_b else v_member_a end;

  insert into public.abonos (couple_id, moneda, monto, pagado_por, registrado_por)
  values (v_couple_id, p_moneda, round(p_monto, 2), v_deudor, v_uid)
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.registrar_abono(numeric, text) from public, anon;
grant execute on function public.registrar_abono(numeric, text) to authenticated;
