-- El reparto de una categoría es POR PERSONA, no por "quien registra": si acuerdan 60% / 40%, cada
-- uno se queda con su parte sin importar quién pague ese día. `split_percent` sigue siendo la parte
-- de `reparto_user_id`; al registrar un gasto se convierte a "parte de quien pagó" (que es lo que ya
-- entiende calcular_saldo_pareja, que NO se toca).

alter table public.categories add column if not exists reparto_user_id uuid references auth.users(id) on delete set null;

-- Categorías que ya existían: su porcentaje se pensó desde quien las creó (hoy, una sola persona por pareja).
update public.categories c
set reparto_user_id = (
  select cm.user_id from public.couple_members cm where cm.couple_id = c.couple_id order by cm.user_id limit 1
)
where c.reparto_user_id is null;

create or replace function public.validar_paga_user_categoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.paga_user_id is not null and not exists (
    select 1 from public.couple_members where couple_id = new.couple_id and user_id = new.paga_user_id
  ) then
    raise exception 'PAGA_USER_NO_ES_DE_LA_PAREJA';
  end if;
  if new.reparto_user_id is not null and not exists (
    select 1 from public.couple_members where couple_id = new.couple_id and user_id = new.reparto_user_id
  ) then
    raise exception 'REPARTO_USER_NO_ES_DE_LA_PAREJA';
  end if;
  return new;
end;
$$;

drop trigger if exists validar_paga_user_categoria on public.categories;
create trigger validar_paga_user_categoria
  before insert or update of paga_user_id, reparto_user_id on public.categories
  for each row execute function public.validar_paga_user_categoria();
