-- Foto de perfil real (pedido del usuario: la burbuja de inicial pueda mostrar su foto).
-- Bucket público (a diferencia de "recibos", que es privado): una foto de perfil no es dato
-- sensible y sirve directo como URL pública sin firmar, más simple para <img>.

alter table public.profiles add column avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

-- Convención de ruta: avatares/{user_id}/foto.jpg — una carpeta por persona (mismo patrón que
-- "recibos"), un solo archivo adentro que se sobreescribe al cambiar la foto, sin acumular
-- archivos viejos. Solo el dueño puede subir/reemplazar la suya; cualquiera puede LEER (bucket
-- público, pero se deja la política explícita para que funcione igual desde el SDK autenticado,
-- no solo por URL pública directa).
create policy "usuario_sube_su_avatar" on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatares'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "usuario_reemplaza_su_avatar" on storage.objects for update to authenticated
using (
  bucket_id = 'avatares'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "cualquiera_lee_avatares" on storage.objects for select
using ( bucket_id = 'avatares' );
