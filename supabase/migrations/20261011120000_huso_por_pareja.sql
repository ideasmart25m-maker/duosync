-- Un huso horario POR PAREJA (según su país), en vez de uno solo para toda la app: el "día" de la pregunta, las
-- respuestas, la racha y la fecha por defecto de los gastos cambian a medianoche HORA LOCAL de la pareja
-- (México, Argentina, Chile, Brasil, etc.). Antes todo seguía el huso de Colombia.

alter table public.couples add column if not exists zona_horaria text not null default 'America/Bogota';

create or replace function public.zona_de_pais(p_pais text)
returns text
language sql
immutable
as $$
  select case p_pais
    when 'AR' then 'America/Argentina/Buenos_Aires'
    when 'BO' then 'America/La_Paz'
    when 'BR' then 'America/Sao_Paulo'
    when 'CL' then 'America/Santiago'
    when 'CO' then 'America/Bogota'
    when 'CR' then 'America/Costa_Rica'
    when 'CU' then 'America/Havana'
    when 'DO' then 'America/Santo_Domingo'
    when 'EC' then 'America/Guayaquil'
    when 'SV' then 'America/El_Salvador'
    when 'GT' then 'America/Guatemala'
    when 'HN' then 'America/Tegucigalpa'
    when 'MX' then 'America/Mexico_City'
    when 'NI' then 'America/Managua'
    when 'PA' then 'America/Panama'
    when 'PY' then 'America/Asuncion'
    when 'PE' then 'America/Lima'
    when 'UY' then 'America/Montevideo'
    when 'VE' then 'America/Caracas'
    else 'America/Bogota'
  end;
$$;

-- El huso sigue al país de la pareja (cuando lo eligen o lo cambian).
create or replace function public.fijar_zona_horaria()
returns trigger
language plpgsql
as $$
begin
  new.zona_horaria := public.zona_de_pais(new.pais);
  return new;
end;
$$;
drop trigger if exists fijar_zona_horaria on public.couples;
create trigger fijar_zona_horaria before insert or update of pais on public.couples
  for each row execute function public.fijar_zona_horaria();

update public.couples set zona_horaria = public.zona_de_pais(pais);

-- La fecha de HOY de quien llama: según el huso de SU pareja (Bogotá si no tiene pareja o es el servidor).
-- p_ahora existe para poder probar con instantes concretos.
create or replace function public.fecha_de_hoy(p_ahora timestamptz default now())
returns date
language sql
stable
security definer
set search_path = public
as $$
  select (p_ahora at time zone coalesce(
    (select c.zona_horaria from public.couples c join public.couple_members m on m.couple_id = c.id where m.user_id = (select auth.uid()) limit 1),
    'America/Bogota'
  ))::date;
$$;
grant execute on function public.fecha_de_hoy(timestamptz) to authenticated;

alter table public.expenses alter column fecha set default public.fecha_de_hoy();
alter table public.daily_answers alter column fecha set default public.fecha_de_hoy();

-- Funciones del día, ahora con el huso de la pareja
create or replace function public.pregunta_de_hoy()
returns public.daily_questions
language sql
stable
set search_path = public
as $$
  select *
  from public.daily_questions
  where activa = true
  order by created_at, id
  offset (
    extract(doy from public.fecha_de_hoy())::int %
    greatest((select count(*) from public.daily_questions where activa = true), 1)
  )
  limit 1;
$$;

create or replace function public.respuestas_de_hoy(p_question_id uuid)
returns table(user_id uuid, respuesta text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_couple_id uuid;
  v_total_miembros int;
  v_total_respuestas int;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;
  v_couple_id := public.mi_couple_id();
  if v_couple_id is null then raise exception 'SIN_PAREJA'; end if;

  select count(*) into v_total_miembros from public.couple_members where couple_id = v_couple_id;
  select count(*) into v_total_respuestas
    from public.daily_answers
    where couple_id = v_couple_id and question_id = p_question_id and fecha = public.fecha_de_hoy();

  if v_total_respuestas >= v_total_miembros and v_total_miembros > 0 then
    return query
      select da.user_id, da.respuesta from public.daily_answers da
      where da.couple_id = v_couple_id and da.question_id = p_question_id and da.fecha = public.fecha_de_hoy();
  else
    return query
      select da.user_id, da.respuesta from public.daily_answers da
      where da.couple_id = v_couple_id and da.question_id = p_question_id and da.fecha = public.fecha_de_hoy() and da.user_id = v_uid;
  end if;
end;
$$;

create or replace function public.responder_pregunta_hoy(p_question_id uuid, p_respuesta text)
returns table(ambos_respondieron boolean, racha_dias int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_couple_id uuid;
  v_total_miembros int;
  v_total_respuestas int;
  v_racha public.streaks;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;
  if length(trim(p_respuesta)) = 0 or length(p_respuesta) > 300 then
    raise exception 'RESPUESTA_INVALIDA';
  end if;

  v_couple_id := public.mi_couple_id();
  if v_couple_id is null then raise exception 'SIN_PAREJA'; end if;

  insert into public.daily_answers (couple_id, question_id, fecha, user_id, respuesta)
  values (v_couple_id, p_question_id, public.fecha_de_hoy(), v_uid, trim(p_respuesta))
  on conflict (couple_id, question_id, fecha, user_id)
  do update set respuesta = excluded.respuesta;

  insert into public.event_log (tipo, user_id, couple_id, metadata)
  values ('pregunta_respondida', v_uid, v_couple_id, jsonb_build_object('question_id', p_question_id));

  select count(*) into v_total_miembros from public.couple_members where couple_id = v_couple_id;
  select count(*) into v_total_respuestas
    from public.daily_answers
    where couple_id = v_couple_id and question_id = p_question_id and fecha = public.fecha_de_hoy();

  if v_total_respuestas < v_total_miembros or v_total_miembros = 0 then
    return query select false, (select dias from public.streaks where couple_id = v_couple_id);
    return;
  end if;

  select * into v_racha from public.streaks where couple_id = v_couple_id;
  if v_racha.ultima_fecha is distinct from public.fecha_de_hoy() then
    update public.streaks
    set dias = case when v_racha.ultima_fecha = public.fecha_de_hoy() - 1 then v_racha.dias + 1 else 1 end,
        ultima_fecha = public.fecha_de_hoy(),
        updated_at = now()
    where couple_id = v_couple_id
    returning * into v_racha;
  end if;

  return query select true, v_racha.dias;
end;
$$;
