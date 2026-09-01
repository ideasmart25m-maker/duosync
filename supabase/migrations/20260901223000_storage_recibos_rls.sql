-- Permisos del bucket "recibos" (creado a mano por el usuario en el dashboard, privado).
-- Convención de ruta: recibos/{couple_id}/{scan_id}.jpg — el primer segmento de la ruta
-- es el couple_id, así la política puede verificar pertenencia sin adivinar nada.
-- Usa mi_couple_id() (creada en 20260901220000) para evitar la misma recursión de RLS.

create policy "couple_sube_recibos" on storage.objects for insert to authenticated
with check (
  bucket_id = 'recibos'
  and (storage.foldername(name))[1] = public.mi_couple_id()::text
);

create policy "couple_lee_recibos" on storage.objects for select to authenticated
using (
  bucket_id = 'recibos'
  and (storage.foldername(name))[1] = public.mi_couple_id()::text
);
