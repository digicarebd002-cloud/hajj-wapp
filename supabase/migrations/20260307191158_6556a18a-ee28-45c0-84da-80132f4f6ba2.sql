-- Related products junction table
CREATE TABLE public.related_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  related_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, related_product_id),
  CHECK (product_id != related_product_id)
);

ALTER TABLE public.related_products ENABLE ROW LEVEL SECURITY;

-- Anyone can view related products
CREATE POLICY "Anyone can view related products" ON public.related_products
  FOR SELECT USING (true);

-- Admins can manage related products
CREATE POLICY "Admins can manage related products" ON public.related_products
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));