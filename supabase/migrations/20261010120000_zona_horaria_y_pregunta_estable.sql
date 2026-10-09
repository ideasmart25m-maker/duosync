-- 1) El "día" de la app cambiaba a las 7 p. m. en Colombia (la base cuenta los días en UTC). Una pareja que
--    respondía la pregunta de hoy por la noche la veía "de hoy" hasta las 7 p. m. del día siguiente, y los
--    gastos de la noche se anotaban con la fecha de mañana. Ahora los días cambian a medianoche de Colombia
--    (mismo huso para Perú, Ecuador y Panamá; México queda 1 hora adelantado; un huso por pareja queda como mejora).
alter database postgres set timezone to 'America/Bogota';
alter role authenticator set timezone to 'America/Bogota';

-- Lo ya guardado con el día UTC (cuando el día UTC y el de Colombia difieren) pasa al día de Colombia.
update public.daily_answers
set fecha = (created_at at time zone 'America/Bogota')::date
where fecha = (created_at at time zone 'UTC')::date
  and fecha <> (created_at at time zone 'America/Bogota')::date;

update public.expenses
set fecha = (created_at at time zone 'America/Bogota')::date
where fecha = (created_at at time zone 'UTC')::date
  and fecha <> (created_at at time zone 'America/Bogota')::date;

update public.streaks
set ultima_fecha = (updated_at at time zone 'America/Bogota')::date
where ultima_fecha = (updated_at at time zone 'UTC')::date
  and ultima_fecha <> (updated_at at time zone 'America/Bogota')::date;

-- 2) Las 7 preguntas tienen el mismo created_at: sin desempate, el orden (y la "pregunta de hoy") podía cambiar.
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
    extract(doy from current_date)::int %
    greatest((select count(*) from public.daily_questions where activa = true), 1)
  )
  limit 1;
$$;

-- Diagnóstico: qué huso y qué día ve la API (para comprobar que el cambio llegó a las conexiones de la app).
create or replace function public.zona_horaria_actual()
returns table(huso text, hoy date)
language sql
stable
as $$
  select current_setting('TimeZone'), current_date;
$$;
grant execute on function public.zona_horaria_actual() to authenticated;
