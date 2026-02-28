
ALTER TABLE public.product_variants
ADD COLUMN price numeric NULL;

COMMENT ON COLUMN public.product_variants.price IS 'Optional per-variant price override. If NULL, the base product price is used.';
