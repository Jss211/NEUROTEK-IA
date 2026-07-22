-- Arreglar URLs locales guardadas en productos
UPDATE productos
SET imagen_url = REPLACE(
  REPLACE(imagen_url, 'http://localhost:5173/api-supabase', 'https://ordywmtwdovinbtaawge.supabase.co'),
  'http://192.168.100.10:5173/api-supabase', 'https://ordywmtwdovinbtaawge.supabase.co'
)
WHERE imagen_url LIKE '%localhost%' OR imagen_url LIKE '%192.168%';

-- Arreglar URLs locales guardadas en usuarios
UPDATE usuarios
SET avatar_url = REPLACE(
  REPLACE(avatar_url, 'http://localhost:5173/api-supabase', 'https://ordywmtwdovinbtaawge.supabase.co'),
  'http://192.168.100.10:5173/api-supabase', 'https://ordywmtwdovinbtaawge.supabase.co'
)
WHERE avatar_url LIKE '%localhost%' OR avatar_url LIKE '%192.168%';

-- Arreglar URLs locales guardadas en reviews (testimonios)
UPDATE reviews
SET avatar_url = REPLACE(
  REPLACE(avatar_url, 'http://localhost:5173/api-supabase', 'https://ordywmtwdovinbtaawge.supabase.co'),
  'http://192.168.100.10:5173/api-supabase', 'https://ordywmtwdovinbtaawge.supabase.co'
)
WHERE avatar_url LIKE '%localhost%' OR avatar_url LIKE '%192.168%';
