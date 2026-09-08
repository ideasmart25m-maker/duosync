-- Conecta la "Pregunta de hoy" a datos reales (era 100% de ejemplo — hallazgo crítico de la
-- auditoría 2026-09-08: nombres, pregunta, respuesta del otro y racha estaban fijos en el
-- código, nunca se guardaban) + topes de uso de IA (pedido real del usuario, cifras exactas
-- dadas por él) + cierre del hueco de fuerza bruta del código de invitación.

-- ── 1) Ver el nombre real de la pareja ──────────────────────────────────────
-- Hasta ahora `profiles` solo dejaba ver el PROPIO nombre (política "select_own_profile") — no
-- había forma de mostrar el nombre real del otro integrante en ninguna pantalla. Política
-- adicional (se combinan con OR, no reemplaza la existente): ver también el perfil de quien
-- comparte tu misma pareja.
create policy "select_partner_profile" on public.profiles for select
  using ( id in (select user_id from public.couple_members where couple_id = public.mi_couple_id()) );

-- ── 2) Pregunta del día — misma pregunta para toda la pareja, cambia cada día ──
create or replace function public.pregunta_de_hoy()
returns public.daily_questions
language sql
stable
set search_path = public
as $$
  select *
  from public.daily_questions
  where activa = true
  order by created_at
  offset (
    extract(doy from current_date)::int %
    greatest((select count(*) from public.daily_questions where activa = true), 1)
  )
  limit 1;
$$;
revoke execute on function public.pregunta_de_hoy() from anon;
grant execute on function public.pregunta_de_hoy() to authenticated;

-- ── 3) Responder + revelar solo cuando AMBOS respondieron + actualizar racha ──
-- RLS decide QUÉ FILAS existen, no puede ocultar selectivamente el contenido de una fila ya
-- visible (nota ya dejada en el esquema inicial) — por eso el "no ver la respuesta del otro
-- hasta que ambos respondan" se resuelve aquí, en una función, no con una política.
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

  select count(*) into v_total_miembros from public.couple_members where couple_id = v_couple_id;
  select count(*) into v_total_respuestas
    from public.daily_answers
    where couple_id = v_couple_id and question_id = p_question_id and fecha = current_date;

  if v_total_respuestas < v_total_miembros or v_total_miembros = 0 then
    return query select false, (select dias from public.streaks where couple_id = v_couple_id);
    return;
  end if;

  -- Ambos ya respondieron hoy — actualiza la racha SOLO la primera vez que se cumple esto en
  -- el día (si `ultima_fecha` ya es hoy, no se suma dos veces).
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

-- Trae las respuestas de hoy de la pareja — la propia SIEMPRE, la del otro SOLO si ya
-- contestó ambos (mismo criterio de revelado que la función de arriba).
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
    where couple_id = v_couple_id and question_id = p_question_id and fecha = current_date;

  if v_total_respuestas >= v_total_miembros and v_total_miembros > 0 then
    return query
      select da.user_id, da.respuesta from public.daily_answers da
      where da.couple_id = v_couple_id and da.question_id = p_question_id and da.fecha = current_date;
  else
    return query
      select da.user_id, da.respuesta from public.daily_answers da
      where da.couple_id = v_couple_id and da.question_id = p_question_id and da.fecha = current_date and da.user_id = v_uid;
  end if;
end;
$$;
revoke execute on function public.respuestas_de_hoy(uuid) from anon;
grant execute on function public.respuestas_de_hoy(uuid) to authenticated;

-- ── 4) Topes de uso de IA (cifras dadas por el usuario) ─────────────────────
-- Prueba gratis: 3 escaneos + 3 preguntas al asistente, DE POR VIDA (hasta que paguen).
-- Plan pago: 50 de cada uno POR MES.
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  tipo text not null check (tipo in ('escaneo', 'asistente')),
  created_at timestamptz not null default now()
);
create index ai_usage_couple_tipo_idx on public.ai_usage(couple_id, tipo, created_at);

alter table public.ai_usage enable row level security;
create policy "select_couple_ai_usage" on public.ai_usage for select
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
-- Sin insert/update/delete para authenticated: se registra solo por la función de abajo.

create or replace function public.registrar_uso_ia(p_tipo text)
returns table(permitido boolean, usados int, limite int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
  v_plan text;
  v_desde timestamptz;
  v_limite int;
  v_usados int;
begin
  if p_tipo not in ('escaneo', 'asistente') then
    raise exception 'TIPO_INVALIDO';
  end if;

  v_couple_id := public.mi_couple_id();
  if v_couple_id is null then raise exception 'SIN_PAREJA'; end if;

  select plan into v_plan from public.couples where id = v_couple_id;

  if v_plan = 'premium' then
    v_limite := 50;
    v_desde := date_trunc('month', now());
  else
    v_limite := 3;
    v_desde := '-infinity'::timestamptz;
  end if;

  select count(*) into v_usados from public.ai_usage
    where couple_id = v_couple_id and tipo = p_tipo and created_at >= v_desde;

  if v_usados >= v_limite then
    return query select false, v_usados, v_limite;
    return;
  end if;

  insert into public.ai_usage (couple_id, tipo) values (v_couple_id, p_tipo);
  return query select true, v_usados + 1, v_limite;
end;
$$;
revoke execute on function public.registrar_uso_ia(text) from anon;
grant execute on function public.registrar_uso_ia(text) to authenticated;

-- ── 5) Código de invitación: cierra la ventana de adivinanza por fuerza bruta ──
-- El límite de intentos ya existente es POR CUENTA — alguien con varios correos podía seguir
-- probando contra la pareja de otra persona indefinidamente. Ahora el código deja de aceptarse
-- pasados 30 días SI la pareja sigue con un solo integrante (nadie se unió todavía) — tiempo de
-- sobra para el uso real (la otra persona normalmente se une en minutos/horas), pero cierra la
-- ventana de fuerza bruta a largo plazo.
create or replace function public.unirse_con_codigo(p_codigo text)
returns public.couples
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_row public.couples;
  v_estado private.intentos_union;
  v_miembros int;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  select * into v_estado from private.intentos_union where user_id = v_uid;
  if v_estado.bloqueado_hasta is not null and v_estado.bloqueado_hasta > now() then
    raise exception 'DEMASIADOS_INTENTOS' using errcode = 'P0001';
  end if;

  select * into v_row from public.couples where codigo_invitacion = p_codigo;

  if found then
    select count(*) into v_miembros from public.couple_members where couple_id = v_row.id;
    if v_miembros < 2 and v_row.created_at < now() - interval '30 days' then
      v_row := null; -- código vencido: se trata igual que "no encontrado" abajo
    end if;
  end if;

  if not found or v_row is null then
    insert into private.intentos_union (user_id, intentos, updated_at)
    values (v_uid, 1, now())
    on conflict (user_id) do update set
      intentos = case
        when private.intentos_union.bloqueado_hasta is not null and private.intentos_union.bloqueado_hasta <= now()
          then 1
        else private.intentos_union.intentos + 1
      end,
      bloqueado_hasta = case
        when private.intentos_union.intentos + 1 >= 5 then now() + interval '15 minutes'
        else private.intentos_union.bloqueado_hasta
      end,
      updated_at = now();
    raise exception 'CODIGO_INVALIDO' using errcode = 'P0001';
  end if;

  -- Código correcto: resetea el contador de intentos.
  insert into private.intentos_union (user_id, intentos, bloqueado_hasta, updated_at)
  values (v_uid, 0, null, now())
  on conflict (user_id) do update set intentos = 0, bloqueado_hasta = null, updated_at = now();

  if exists (select 1 from public.couple_members where couple_id = v_row.id and user_id = v_uid) then
    return v_row;
  end if;

  insert into public.couple_members (couple_id, user_id) values (v_row.id, v_uid);
  return v_row;
end;
$$;
revoke execute on function public.unirse_con_codigo(text) from anon;
grant execute on function public.unirse_con_codigo(text) to authenticated;
