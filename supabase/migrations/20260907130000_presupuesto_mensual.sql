-- Presupuesto mensual editable (pedido real del usuario, rediseño de la tarjeta de Hoy): antes
-- esa tarjeta mostraba "Gastado este mes" con datos de EJEMPLO fijos (nunca conectados a
-- Supabase). Ahora la tarjeta muestra el presupuesto que la pareja se puso, cuánto llevan
-- gastado de verdad y cuánto les queda disponible.

alter table public.couples add column if not exists presupuesto_mensual numeric(12, 2)
  check (presupuesto_mensual is null or presupuesto_mensual > 0);

-- Mismo patrón que `actualizar_pais_pareja()`: `couples` no tiene política de UPDATE genérica a
-- propósito (evita que el cliente toque `plan`/`trial_termina_en` directo) — se edita solo por
-- esta función, que verifica a mano que quien llama pertenece a esa pareja.
create or replace function public.actualizar_presupuesto_pareja(p_monto numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
begin
  select couple_id into v_couple_id from public.couple_members where user_id = (select auth.uid()) limit 1;
  if v_couple_id is null then
    raise exception 'SIN_PAREJA';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'MONTO_INVALIDO';
  end if;

  update public.couples set presupuesto_mensual = p_monto where id = v_couple_id;
end;
$$;

revoke execute on function public.actualizar_presupuesto_pareja(numeric) from anon;
grant execute on function public.actualizar_presupuesto_pareja(numeric) to authenticated;
