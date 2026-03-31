
-- Create wallet_subscriptions table to track PayPal recurring subscriptions
CREATE TABLE public.wallet_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  paypal_subscription_id TEXT NOT NULL,
  paypal_plan_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  amount NUMERIC NOT NULL DEFAULT 15,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, paypal_subscription_id)
);

-- Enable RLS
ALTER TABLE public.wallet_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view own subscriptions
CREATE POLICY "Users can view own wallet subscriptions"
  ON public.wallet_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert own subscriptions
CREATE POLICY "Users can insert own wallet subscriptions"
  ON public.wallet_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update own subscriptions (for cancellation)
CREATE POLICY "Users can update own wallet subscriptions"
  ON public.wallet_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins full access
CREATE POLICY "Admins can manage all wallet subscriptions"
  ON public.wallet_subscriptions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_wallet_subscriptions_updated_at
  BEFORE UPDATE ON public.wallet_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert default subscription price into site_settings
INSERT INTO public.site_settings (key, value) VALUES ('wallet_subscription_price', '15')
ON CONFLICT (key) DO NOTHING;

-- Insert subscription enabled setting
INSERT INTO public.site_settings (key, value) VALUES ('wallet_subscription_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
