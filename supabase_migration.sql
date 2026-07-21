-- Añadir columnas de inglés a la tabla de productos
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS nombre_en text,
ADD COLUMN IF NOT EXISTS descripcion_en text;

UPDATE public.productos 
SET nombre_en = nombre
WHERE nombre_en IS NULL;

UPDATE public.productos 
SET descripcion_en = descripcion
WHERE descripcion_en IS NULL;
