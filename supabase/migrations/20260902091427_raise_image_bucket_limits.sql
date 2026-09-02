-- Permite imágenes de alta calidad (compresión suave) en todos los buckets de fotos.
UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id IN (
  'progress-photos',
  'project-covers',
  'unit-plans',
  'project-portal-news'
);

UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'profile-avatars';
