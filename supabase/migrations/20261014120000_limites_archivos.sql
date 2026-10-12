-- Límite de tamaño (5 MB) y de tipo (solo imágenes JPG/PNG/WebP) en los almacenes de archivos. Antes aceptaban
-- cualquier archivo de cualquier peso; el tope de IA protegía el costo, pero no el espacio de almacenamiento.
-- La app ya reduce las fotos en el navegador antes de subirlas (recibos a 1400 px, perfil a 512 px).
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('avatares', 'recibos');
