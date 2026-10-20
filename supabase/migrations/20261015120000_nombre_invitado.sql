-- El nombre provisional de quien entra con el enlace de invitación (sin correo) era "Tu pareja", y esa palabra
-- aparecía en la pantalla de la otra persona. Pasa a "Invitado" (neutro: sirve para pareja, amigos o quien comparte casa).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, role)
  values (
    new.id,
    left(coalesce(nullif(new.raw_user_meta_data->>'nombre', ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Invitado'), 60),
    case when new.email = 'ideasmart.25m@gmail.com' then 'admin' else 'user' end
  );
  insert into public.event_log (tipo, user_id, metadata) values ('signup', new.id, '{}'::jsonb);
  return new;
end;
$$;

update public.profiles set nombre = 'Invitado' where nombre = 'Tu pareja';
