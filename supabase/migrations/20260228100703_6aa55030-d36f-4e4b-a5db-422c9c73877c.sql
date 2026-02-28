
ALTER TABLE public.products
ADD COLUMN slug text UNIQUE,
ADD COLUMN meta_title text,
ADD COLUMN meta_description text,
ADD COLUMN og_image_url text;

-- Generate slugs from existing product names
UPDATE public.products
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || left(id::text, 8)
WHERE slug IS NULL;
