-- Categorías rediseñadas a pedido del usuario: nombres más específicos, un color propio por
-- categoría (antes solo alternaba entre 2), e íconos más llamativos. Los colores ahora son
-- claves de token (`--cat-*` en tokens.css), no solo 'accent'/'accent-2'.

-- Se quita la restricción de colores ANTES de migrar los datos (las filas viejas todavía
-- dicen 'accent'/'accent-2' en este punto) y se vuelve a poner al final, ya con todo migrado.
alter table public.categories drop constraint if exists categories_color_check;

-- Categorías por defecto para PAREJAS NUEVAS (crear_pareja) — reemplaza el set anterior.
-- Misma función que la original (Sesión 6): solo cambia el bloque de categorías.
create or replace function public.crear_pareja()
returns public.couples
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_codigo text;
  v_row public.couples;
  v_intentos int := 0;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;

  loop
    v_codigo := lpad((floor(random() * 10000))::int::text, 4, '0');
    begin
      insert into public.couples (codigo_invitacion) values (v_codigo) returning * into v_row;
      exit;
    exception when unique_violation then
      v_intentos := v_intentos + 1;
      if v_intentos > 20 then raise exception 'NO_SE_PUDO_GENERAR_CODIGO' using errcode = 'P0001'; end if;
    end;
  end loop;

  insert into public.couple_members (couple_id, user_id) values (v_row.id, v_uid);

  insert into public.categories (couple_id, nombre, icono, color) values
    (v_row.id, 'Arriendo/hipoteca', 'home', 'teal'),
    (v_row.id, 'Servicios públicos', 'zap', 'amber'),
    (v_row.id, 'Supermercado', 'shopping-cart', 'coral'),
    (v_row.id, 'Restaurantes / Salidas', 'utensils', 'rose'),
    (v_row.id, 'Transporte / Gasolina', 'car', 'blue'),
    (v_row.id, 'Entretenimiento', 'film', 'violet');

  insert into public.streaks (couple_id) values (v_row.id);

  return v_row;
end;
$$;

-- Migra las categorías de las parejas YA CREADAS al nuevo set (mismo criterio: mismo tipo de
-- gasto, nombre/ícono/color actualizados) — sin esto, quien ya probó la app se queda con las
-- categorías viejas mientras las nuevas parejas reciben las nuevas, una inconsistencia real.
update public.categories set nombre = 'Arriendo/hipoteca', icono = 'home', color = 'teal' where nombre = 'Arriendo';
update public.categories set nombre = 'Servicios públicos', icono = 'zap', color = 'amber' where nombre = 'Servicios';
update public.categories set nombre = 'Supermercado', icono = 'shopping-cart', color = 'coral' where nombre = 'Mercado';
update public.categories set nombre = 'Transporte / Gasolina', icono = 'car', color = 'blue' where nombre = 'Transporte';
update public.categories set nombre = 'Entretenimiento', icono = 'film', color = 'violet' where nombre = 'Ocio';

-- A las parejas existentes que no tenían "Restaurantes / Salidas" se les agrega, para que
-- las pruebas reflejen el set completo de 6 categorías.
insert into public.categories (couple_id, nombre, icono, color)
select c.id, 'Restaurantes / Salidas', 'utensils', 'rose'
from public.couples c
where not exists (
  select 1 from public.categories cat where cat.couple_id = c.id and cat.nombre = 'Restaurantes / Salidas'
);

-- Ahora sí, con todas las filas ya en las claves nuevas, se cierra el candado.
alter table public.categories add constraint categories_color_check
  check (color in ('teal', 'coral', 'amber', 'rose', 'blue', 'violet', 'gray'));
