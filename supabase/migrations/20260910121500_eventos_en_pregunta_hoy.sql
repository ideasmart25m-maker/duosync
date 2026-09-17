-- Registra el evento 'pregunta_respondida' en event_log server-side, dentro de la misma
-- función que ya guarda la respuesta — más confiable que loguearlo desde el cliente (no se
-- pierde si el usuario cierra la app justo después de responder).
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
  values (v_couple_id, p_question_id, current_date, v_uid, trim(p_respuesta))
  on conflict (couple_id, question_id, fecha, user_id)
  do update set respuesta = excluded.respuesta;

  insert into public.event_log (tipo, user_id, couple_id, metadata)
  values ('pregunta_respondida', v_uid, v_couple_id, jsonb_build_object('question_id', p_question_id));

  select count(*) into v_total_miembros from public.couple_members where couple_id = v_couple_id;
  select count(*) into v_total_respuestas
    from public.daily_answers
    where couple_id = v_couple_id and question_id = p_question_id and fecha = current_date;

  if v_total_respuestas < v_total_miembros or v_total_miembros = 0 then
    return query select false, (select dias from public.streaks where couple_id = v_couple_id);
    return;
  end if;

  select * into v_racha from public.streaks where couple_id = v_couple_id;
  if v_racha.ultima_fecha is distinct from current_date then
    update public.streaks
    set dias = case when v_racha.ultima_fecha = current_date - 1 then v_racha.dias + 1 else 1 end,
        ultima_fecha = current_date,
        updated_at = now()
    where couple_id = v_couple_id
    returning * into v_racha;
  end if;

  return query select true, v_racha.dias;
end;
$$;
revoke execute on function public.responder_pregunta_hoy(uuid, text) from anon;
grant execute on function public.responder_pregunta_hoy(uuid, text) to authenticated;

-- Igual para aportar_a_meta: registra 'meta_aporte' en el mismo movimiento atómico.
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

  insert into public.event_log (tipo, user_id, couple_id, metadata)
  values ('meta_aporte', (select auth.uid()), v_couple_id, jsonb_build_object('meta_id', p_meta_id, 'monto', p_monto));

  return v_row;
end;
$$;
revoke execute on function public.aportar_a_meta(uuid, numeric) from anon;
grant execute on function public.aportar_a_meta(uuid, numeric) to authenticated;
