-- Límite de intentos para unirse_con_codigo() — un código de 4 dígitos son solo
-- 10.000 combinaciones, adivinable por fuerza bruta sin esto (defecto real
-- detectado en la auditoría, ya anotado como pendiente en el comentario original
-- de la función). Bloqueo de 15 minutos tras 5 intentos fallidos, por usuario.

create table private.intentos_union (
  user_id uuid primary key references auth.users(id) on delete cascade,
  intentos int not null default 0,
  bloqueado_hasta timestamptz,
  updated_at timestamptz not null default now()
);

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
