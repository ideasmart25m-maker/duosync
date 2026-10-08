-- El código que el onboarding muestra y que se comparte por WhatsApp se generaba al azar en el
-- navegador y NUNCA coincidía con el código real de la pareja (que crear_pareja() inventaba aparte):
-- la otra persona no tenía forma de unirse. Ahora crear_pareja() usa el código que la persona ya
-- compartió (si está libre) y, si ese número ya lo tenía otra pareja, genera otro — la app lo
-- muestra en Nosotros mientras falte la pareja, para que siempre se vea el real.

drop function if exists public.crear_pareja();

create or replace function public.crear_pareja(p_codigo text default null)
returns public.couples
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_codigo text := case when p_codigo ~ '^[0-9]{4}$' then p_codigo else null end;
  v_row public.couples;
  v_intentos int := 0;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  loop
    if v_codigo is null then
      v_codigo := lpad((floor(random() * 10000))::int::text, 4, '0');
    end if;
    begin
      insert into public.couples (codigo_invitacion) values (v_codigo) returning * into v_row;
      exit;
    exception when unique_violation then
      v_codigo := null; -- el pedido ya estaba tomado: se prueba con uno al azar
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

revoke execute on function public.crear_pareja(text) from public, anon;
grant execute on function public.crear_pareja(text) to authenticated;
