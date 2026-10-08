-- Unirse a la pareja SIN correo: la persona invitada toca el enlace de WhatsApp y entra al instante con una
-- cuenta de invitado (sign-in anónimo de Supabase). La seguridad ya no depende de 4 dígitos adivinables:
-- el enlace lleva una clave larga (32 caracteres) imposible de adivinar. Después la persona puede guardar
-- su acceso con un correo (la cuenta de invitado se convierte en cuenta normal, con los mismos datos).

-- 1) Clave secreta de invitación por pareja (las parejas existentes reciben la suya).
alter table public.couples add column if not exists token_invitacion text unique default replace(gen_random_uuid()::text, '-', '');
update public.couples set token_invitacion = replace(gen_random_uuid()::text, '-', '') where token_invitacion is null;
alter table public.couples alter column token_invitacion set not null;

-- 2) Una cuenta de invitado no tiene correo: el perfil necesitaba un nombre y fallaba.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, role)
  values (
    new.id,
    left(coalesce(nullif(new.raw_user_meta_data->>'nombre', ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Tu pareja'), 60),
    case when new.email = 'ideasmart.25m@gmail.com' then 'admin' else 'user' end
  );
  insert into public.event_log (tipo, user_id, metadata) values ('signup', new.id, '{}'::jsonb);
  return new;
end;
$$;

-- 3) Lógica común de unirse: máximo 2 integrantes por pareja y una sola pareja por persona.
create or replace function private.unir_usuario_a_pareja(p_uid uuid, p_couple_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_otra uuid;
begin
  if exists (select 1 from public.couple_members where couple_id = p_couple_id and user_id = p_uid) then
    return;
  end if;

  if (select count(*) from public.couple_members where couple_id = p_couple_id) >= 2 then
    raise exception 'PAREJA_COMPLETA' using errcode = 'P0001';
  end if;

  for v_otra in select cm.couple_id from public.couple_members cm where cm.user_id = p_uid and cm.couple_id <> p_couple_id loop
    if exists (select 1 from public.couple_members x where x.couple_id = v_otra and x.user_id <> p_uid)
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

  insert into public.couple_members (couple_id, user_id) values (p_couple_id, p_uid);
end;
$$;
revoke execute on function private.unir_usuario_a_pareja(uuid, uuid) from public, anon, authenticated;

-- 4) Unirse con el código de 4 dígitos (camino con correo): igual que antes, ahora con la lógica común.
create or replace function public.unirse_con_codigo(p_codigo text)
returns public.couples
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_row public.couples;
  v_estado private.intentos_union;
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

  insert into private.intentos_union (user_id, intentos, bloqueado_hasta, updated_at)
  values (v_uid, 0, null, now())
  on conflict (user_id) do update set intentos = 0, bloqueado_hasta = null, updated_at = now();

  perform private.unir_usuario_a_pareja(v_uid, v_row.id);
  return v_row;
end;
$$;
revoke execute on function public.unirse_con_codigo(text) from public, anon;
grant execute on function public.unirse_con_codigo(text) to authenticated;

-- 5) Unirse con el enlace (camino sin correo): la clave larga hace innecesario limitar intentos.
create or replace function public.unirse_con_token(p_token text)
returns public.couples
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_row public.couples;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;
  select * into v_row from public.couples where token_invitacion = p_token;
  if not found then raise exception 'TOKEN_INVALIDO' using errcode = 'P0001'; end if;
  perform private.unir_usuario_a_pareja(v_uid, v_row.id);
  return v_row;
end;
$$;
revoke execute on function public.unirse_con_token(text) from public, anon;
grant execute on function public.unirse_con_token(text) to authenticated;

-- 6) crear_pareja acepta también la clave del enlace que ya se compartió por WhatsApp antes de entrar.
drop function if exists public.crear_pareja(text);
create or replace function public.crear_pareja(p_codigo text default null, p_token text default null)
returns public.couples
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_codigo text := case when p_codigo ~ '^[0-9]{4}$' then p_codigo else null end;
  v_token text := case when p_token ~ '^[0-9a-f]{32}$' then p_token else null end;
  v_row public.couples;
  v_intentos int := 0;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  loop
    if v_codigo is null then
      v_codigo := lpad((floor(random() * 10000))::int::text, 4, '0');
    end if;
    begin
      if v_token is null then
        insert into public.couples (codigo_invitacion) values (v_codigo) returning * into v_row;
      else
        insert into public.couples (codigo_invitacion, token_invitacion) values (v_codigo, v_token) returning * into v_row;
      end if;
      exit;
    exception when unique_violation then
      v_codigo := null;
      v_token := null;
      v_intentos := v_intentos + 1;
      if v_intentos > 20 then raise exception 'NO_SE_PUDO_GENERAR_CODIGO' using errcode = 'P0001'; end if;
    end;
  end loop;

  insert into public.couple_members (couple_id, user_id) values (v_row.id, v_uid);

  insert into public.categories (couple_id, nombre, icono, color, reparto_user_id) values
    (v_row.id, 'Arriendo/hipoteca', 'home', 'teal', v_uid),
    (v_row.id, 'Servicios públicos', 'zap', 'amber', v_uid),
    (v_row.id, 'Supermercado', 'shopping-cart', 'coral', v_uid),
    (v_row.id, 'Restaurantes / Salidas', 'utensils', 'rose', v_uid),
    (v_row.id, 'Transporte / Gasolina', 'car', 'blue', v_uid),
    (v_row.id, 'Entretenimiento', 'film', 'violet', v_uid);

  insert into public.streaks (couple_id) values (v_row.id);
  return v_row;
end;
$$;
revoke execute on function public.crear_pareja(text, text) from public, anon;
grant execute on function public.crear_pareja(text, text) to authenticated;
