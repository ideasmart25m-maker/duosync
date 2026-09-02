-- País/moneda de la pareja — se pregunta UNA vez desde la app (fuera del embudo de venta
-- ya aprobado) y desde ahí todos los montos se muestran en la moneda real del país, no en
-- pesos colombianos a la fuerza (antes del cambio, TODA la app asumía Colombia).
alter table public.couples add column if not exists pais text
  check (pais is null or pais in (
    'AR','BO','BR','CL','CO','CR','CU','DO','EC','SV','GT','HN','MX','NI','PA','PY','PE','UY','VE'
  ));

-- No hay política de UPDATE directa en `couples` (mismo patrón que crear_pareja/unirse_con_codigo):
-- se cambia el país a través de esta función privilegiada, que valida el código Y que quien
-- llama de verdad pertenece a esa pareja — nunca un UPDATE libre desde el cliente.
create or replace function public.actualizar_pais_pareja(p_pais text)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
  v_row public.couples;
begin
  if p_pais not in ('AR','BO','BR','CL','CO','CR','CU','DO','EC','SV','GT','HN','MX','NI','PA','PY','PE','UY','VE') then
    raise exception 'PAIS_INVALIDO';
  end if;

  select couple_id into v_couple_id from public.couple_members where user_id = auth.uid() limit 1;
  if v_couple_id is null then
    raise exception 'SIN_PAREJA';
  end if;

  update public.couples set pais = p_pais where id = v_couple_id returning * into v_row;
  return v_row;
end;
$$;
