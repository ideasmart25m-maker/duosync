-- Los viajes pasan a vivir en Metas (son proyectos con presupuesto, no gastos de la casa) y sus
-- gastos se organizan por subcategoría: alojamiento, alimentación, transporte, tours y compras.
-- El dinero sigue calculándose por `expenses.moneda` (calcular_saldo_pareja no se toca).

alter table public.viajes add column if not exists presupuesto numeric check (presupuesto is null or presupuesto > 0);

-- Los gastos de viaje cuelgan de UNA categoría interna por pareja (expenses.category_id es
-- obligatorio); se marca para no mezclarla con las categorías de la casa.
alter table public.categories add column if not exists es_de_viaje boolean not null default false;

alter table public.expenses add column if not exists subcategoria text
  check (subcategoria is null or subcategoria in ('alojamiento', 'alimentacion', 'transporte', 'tours', 'compras'));

create policy "update_couple_viajes" on public.viajes for update
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) )
  with check ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
create policy "delete_couple_viajes" on public.viajes for delete
  using ( couple_id in (select couple_id from public.couple_members where user_id = (select auth.uid())) );
