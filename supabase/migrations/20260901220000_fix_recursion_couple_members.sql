-- Corrige el error 42P17 "infinite recursion detected in policy for relation
-- couple_members": la política de SELECT se consultaba a sí misma dentro de su
-- propia condición. La forma segura (recomendada por Supabase) es resolver el
-- couple_id del usuario con una función `security definer`, que se ejecuta con
-- permisos elevados y por lo tanto NO vuelve a pasar por RLS de couple_members
-- al leer — rompiendo así el ciclo.

create or replace function public.mi_couple_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select couple_id from public.couple_members where user_id = auth.uid() limit 1;
$$;

drop policy if exists "select_own_membership" on public.couple_members;
create policy "select_own_membership" on public.couple_members for select
  using (
    user_id = (select auth.uid())
    or couple_id = public.mi_couple_id()
  );
