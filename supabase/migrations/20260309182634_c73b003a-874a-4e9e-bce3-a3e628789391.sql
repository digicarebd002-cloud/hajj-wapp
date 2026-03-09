
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist" ON public.wishlists
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can add to own wishlist" ON public.wishlists
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from own wishlist" ON public.wishlists
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all wishlists" ON public.wishlists
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
