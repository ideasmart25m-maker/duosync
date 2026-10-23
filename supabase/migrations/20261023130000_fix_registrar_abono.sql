-- Arreglo: registrar_abono usaba min()/max() sobre uuid, que Postgres no tiene; se resuelve con order by.

-- Registra un abono del que debe a quien le debe. El que paga lo decide el signo del saldo actual: no se
-- puede abonar con el saldo en 0 ni abonar más de lo que se debe.
create or replace function public.registrar_abono(p_monto numeric, p_moneda text default null)
returns public.abonos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_couple_id uuid;
  v_member_a uuid;
  v_member_b uuid;
  v_saldo numeric;
  v_deudor uuid;
  v_row public.abonos;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001'; end if;
  if p_monto is null or p_monto <= 0 then raise exception 'MONTO_INVALIDO'; end if;

  select couple_id into v_couple_id from public.couple_members where user_id = v_uid limit 1;
  if v_couple_id is null then raise exception 'SIN_PAREJA'; end if;

  select m.user_id into v_member_a from public.couple_members m where m.couple_id = v_couple_id order by m.user_id asc limit 1;
  select m.user_id into v_member_b from public.couple_members m where m.couple_id = v_couple_id order by m.user_id desc limit 1;
  if v_member_a = v_member_b then raise exception 'SIN_OTRA_PERSONA'; end if;

  select r.saldo into v_saldo
  from public.calcular_saldo_pareja(v_couple_id) r
  where r.moneda is not distinct from p_moneda;

  if v_saldo is null or abs(v_saldo) < 0.01 then raise exception 'SIN_SALDO'; end if;
  if p_monto > abs(v_saldo) + 0.005 then raise exception 'MAYOR_AL_SALDO'; end if;

  v_deudor := case when v_saldo > 0 then v_member_b else v_member_a end;

  insert into public.abonos (couple_id, moneda, monto, pagado_por, registrado_por)
  values (v_couple_id, p_moneda, round(p_monto, 2), v_deudor, v_uid)
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.registrar_abono(numeric, text) from public, anon;
grant execute on function public.registrar_abono(numeric, text) to authenticated;
