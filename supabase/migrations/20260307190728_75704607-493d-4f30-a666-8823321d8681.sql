ALTER TABLE public.products ADD COLUMN stock integer NOT NULL DEFAULT -1;
COMMENT ON COLUMN public.products.stock IS 'Product stock quantity. -1 means unlimited/untracked.';