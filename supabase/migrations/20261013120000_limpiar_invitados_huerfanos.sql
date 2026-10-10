-- Limpieza de cuentas de invitado huérfanas. Entrar con el enlace de invitación crea una cuenta anónima; si esa
-- persona nunca llega a unirse a una pareja (cerró la pestaña, el enlace falló, etc.) la cuenta queda vacía para
-- siempre. Se borran SOLO las que cumplen las tres cosas: son anónimas, no pertenecen a ninguna pareja y llevan
-- más de 7 días sin entrar. Una cuenta de invitado que SÍ está en una pareja nunca se toca (tiene datos compartidos).
create or replace function public.limpiar_invitados_huerfanos(p_antes_de timestamptz default now() - interval '7 days')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_borradas integer := 0;
begin
  for v_id in
    select u.id
    from auth.users u
    where u.is_anonymous
      and coalesce(u.last_sign_in_at, u.created_at) < p_antes_de
      and not exists (select 1 from public.couple_members cm where cm.user_id = u.id)
  loop
    begin
      delete from auth.users where id = v_id;
      v_borradas := v_borradas + 1;
    exception when foreign_key_violation then
      -- tiene algún registro propio que no se borra en cascada: se deja intacta
      null;
    end;
  end loop;
  return v_borradas;
end;
$$;

revoke execute on function public.limpiar_invitados_huerfanos(timestamptz) from public, anon, authenticated;
grant execute on function public.limpiar_invitados_huerfanos(timestamptz) to service_role;
