
-- Membership plans table
CREATE TABLE public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  interval text NOT NULL DEFAULT 'monthly',
  description text NOT NULL DEFAULT '',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
ON public.membership_plans FOR SELECT TO public
USING (true);

CREATE POLICY "Admins can manage plans"
ON public.membership_plans FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Membership payments table
CREATE TABLE public.membership_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.membership_plans(id),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  payment_method text NOT NULL DEFAULT 'wallet',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
ON public.membership_payments FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments"
ON public.membership_payments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all payments"
ON public.membership_payments FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default plans
INSERT INTO public.membership_plans (name, slug, price, interval, description, features, sort_order) VALUES
('Silver', 'silver', 0, 'free', 'Free membership with basic community access', '["Community forum access", "Basic wallet features", "Browse store"]'::jsonb, 1),
('Gold', 'gold', 9.99, 'monthly', 'Enhanced membership with exclusive perks', '["Everything in Silver", "10% store discount", "Priority support", "Gold badge", "Sponsorship eligibility"]'::jsonb, 2),
('Platinum', 'platinum', 19.99, 'monthly', 'Premium membership with all benefits', '["Everything in Gold", "15% store discount", "VIP support", "Platinum badge", "Priority sponsorship", "Exclusive content"]'::jsonb, 3);
