
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product categories" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage product categories" ON public.product_categories FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed existing categories from products
INSERT INTO public.product_categories (name, sort_order)
SELECT DISTINCT category, ROW_NUMBER() OVER (ORDER BY category)
FROM public.products
WHERE category IS NOT NULL AND category != ''
ON CONFLICT (name) DO NOTHING;
