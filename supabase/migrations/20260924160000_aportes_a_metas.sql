-- Historial de aportes a metas de ahorro: hasta ahora solo se guardaba el total acumulado, así que
-- no se podía mostrar "cuánto ahorraron este mes y en qué meta". Cada aporte queda registrado aparte
-- (no cuenta como gasto: ahorrar no es gastar).

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  meta_id uuid not null references public.savings_goals(id) on delete cascade,
  monto numeric not null check (monto > 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index goal_contributions_couple_fecha_idx on public.goal_contributions(couple_id, created_at desc);
create index goal_contributions_meta_idx on public.goal_contributions(meta_id);

alter table public.goal_contributions enable row level security;

-- Solo lectura para la pareja: los aportes se escriben únicamente desde aportar_a_meta (security definer).
create policy "select_couple_goal_contributions" on public.goal_contributions for select
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );

-- Lo ya ahorrado antes de esta migración entra como un aporte inicial por meta (no hay historial anterior).
insert into public.goal_contributions (couple_id, meta_id, monto, created_at)
select couple_id, id, monto_actual, now()
from public.savings_goals
where monto_actual > 0;

create or replace function public.aportar_a_meta(p_meta_id uuid, p_monto numeric)
returns public.savings_goals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.savings_goals;
  v_couple_id uuid;
begin
  if p_monto is null or p_monto <= 0 then
    raise exception 'MONTO_INVALIDO';
  end if;

  v_couple_id := public.mi_couple_id();

  update public.savings_goals
  set monto_actual = monto_actual + p_monto
  where id = p_meta_id
    and couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid()))
  returning * into v_row;

  if v_row.id is null then
    raise exception 'META_NO_ENCONTRADA';
  end if;

  insert into public.goal_contributions (couple_id, meta_id, monto, created_by)
  values (v_row.couple_id, v_row.id, p_monto, (select auth.uid()));

  insert into public.event_log (tipo, user_id, couple_id, metadata)
  values ('meta_aporte', (select auth.uid()), v_couple_id, jsonb_build_object('meta_id', p_meta_id, 'monto', p_monto));

  return v_row;
end;
$$;
revoke execute on function public.aportar_a_meta(uuid, numeric) from anon;
grant execute on function public.aportar_a_meta(uuid, numeric) to authenticated;
