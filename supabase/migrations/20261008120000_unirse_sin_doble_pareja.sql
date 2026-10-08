-- Una persona solo puede estar en UNA pareja. Antes, quien ya tenía la suya (por ejemplo, creada sin querer
-- al entrar por "Entrar" en vez de por la invitación) y se unía a otra quedaba en las dos, y la app le
-- mostraba una al azar. Ahora, al unirse con un código:
--   · si su pareja anterior está VACÍA y sin nadie más (sin gastos, metas, respuestas, viajes ni recibos),
--     se elimina sola y la persona pasa a la nueva;
--   · si su pareja anterior tiene datos o tiene a otra persona, NO se une (error YA_TIENES_PAREJA):
--     jamás se borra nada que alguien haya cargado.

create or replace function public.unirse_con_codigo(p_codigo text)
returns public.couples
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_row public.couples;
  v_estado private.intentos_union;
  v_otra uuid;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  select * into v_estado from private.intentos_union where user_id = v_uid;
  if v_estado.bloqueado_hasta is not null and v_estado.bloqueado_hasta > now() then
    raise exception 'DEMASIADOS_INTENTOS' using errcode = 'P0001';
  end if;

  select * into v_row from public.couples where codigo_invitacion = p_codigo;

  if not found then
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

  for v_otra in select cm.couple_id from public.couple_members cm where cm.user_id = v_uid and cm.couple_id <> v_row.id loop
    if exists (select 1 from public.couple_members x where x.couple_id = v_otra and x.user_id <> v_uid)
       or exists (select 1 from public.expenses where couple_id = v_otra)
       or exists (select 1 from public.savings_goals where couple_id = v_otra)
       or exists (select 1 from public.daily_answers where couple_id = v_otra)
       or exists (select 1 from public.viajes where couple_id = v_otra)
       or exists (select 1 from public.receipt_scans where couple_id = v_otra)
    then
      raise exception 'YA_TIENES_PAREJA' using errcode = 'P0001';
    end if;
    delete from public.couples where id = v_otra;
  end loop;

  insert into public.couple_members (couple_id, user_id) values (v_row.id, v_uid);
  return v_row;
end;
$$;

revoke execute on function public.unirse_con_codigo(text) from public, anon;
grant execute on function public.unirse_con_codigo(text) to authenticated;
