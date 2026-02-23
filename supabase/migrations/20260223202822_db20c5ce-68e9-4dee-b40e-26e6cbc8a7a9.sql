
-- ==========================================
-- PROFILES (extends auth.users)
-- ==========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  membership_status TEXT NOT NULL DEFAULT 'inactive' CHECK (membership_status IN ('active','inactive')),
  tier TEXT NOT NULL DEFAULT 'Silver' CHECK (tier IN ('Silver','Gold','Platinum')),
  points_total INTEGER NOT NULL DEFAULT 0,
  next_billing_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- WALLETS
-- ==========================================
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  goal_amount NUMERIC(12,2) NOT NULL DEFAULT 2500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- WALLET TRANSACTIONS
-- ==========================================
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'one-time' CHECK (type IN ('one-time','recurring')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed')),
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- DISCUSSIONS
-- ==========================================
CREATE TABLE public.discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view discussions" ON public.discussions FOR SELECT USING (true);
CREATE POLICY "Auth users can create discussions" ON public.discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own discussions" ON public.discussions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own discussions" ON public.discussions FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- REPLIES
-- ==========================================
CREATE TABLE public.replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_best_answer BOOLEAN NOT NULL DEFAULT false,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view replies" ON public.replies FOR SELECT USING (true);
CREATE POLICY "Auth users can create replies" ON public.replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own replies" ON public.replies FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- POST LIKES (unique constraint prevents double-like)
-- ==========================================
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.replies(id) ON DELETE CASCADE,
  discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, reply_id),
  UNIQUE (user_id, discussion_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- POINTS LEDGER
-- ==========================================
CREATE TABLE public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  points INTEGER NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own points" ON public.points_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert points" ON public.points_ledger FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- NOTIFICATION PREFERENCES
-- ==========================================
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  contributions BOOLEAN NOT NULL DEFAULT true,
  membership BOOLEAN NOT NULL DEFAULT true,
  bookings BOOLEAN NOT NULL DEFAULT true,
  community BOOLEAN NOT NULL DEFAULT true,
  sponsorship BOOLEAN NOT NULL DEFAULT true,
  system_notifications BOOLEAN NOT NULL DEFAULT true,
  store BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own prefs" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own prefs" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prefs" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- PACKAGES & BOOKINGS
-- ==========================================
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  duration TEXT NOT NULL,
  group_size TEXT NOT NULL,
  departure TEXT NOT NULL,
  accommodation TEXT NOT NULL,
  meals TEXT NOT NULL,
  guide TEXT NOT NULL,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view packages" ON public.packages FOR SELECT USING (true);

CREATE TABLE public.package_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.package_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view features" ON public.package_features FOR SELECT USING (true);

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id),
  traveller_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  passport_number TEXT NOT NULL,
  special_requests TEXT DEFAULT '',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('wallet','card','payment_plan')),
  installment_months INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- PRODUCTS & ORDERS
-- ==========================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  reviews INTEGER NOT NULL DEFAULT 0,
  is_limited BOOLEAN NOT NULL DEFAULT false,
  image_emoji TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);

CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  color_value TEXT NOT NULL,
  size TEXT NOT NULL
);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view variants" ON public.product_variants FOR SELECT USING (true);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subtotal NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','delivered','cancelled')),
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- ==========================================
-- TRIGGERS: auto-create profile, wallet, prefs on signup
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''));

  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- TRIGGER: apply wallet transaction to balance
-- ==========================================
CREATE OR REPLACE FUNCTION public.apply_wallet_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE public.wallets
    SET balance = balance + NEW.amount, updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_wallet_transaction_insert
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.apply_wallet_transaction();

-- ==========================================
-- TRIGGER: award points on discussion create
-- ==========================================
CREATE OR REPLACE FUNCTION public.award_discussion_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.points_ledger (user_id, action, points, reference_id)
  VALUES (NEW.user_id, 'create_discussion', 10, NEW.id);

  UPDATE public.profiles
  SET points_total = points_total + 10, updated_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_discussion_created
  AFTER INSERT ON public.discussions
  FOR EACH ROW EXECUTE FUNCTION public.award_discussion_points();

-- ==========================================
-- TRIGGER: award points on reply create
-- ==========================================
CREATE OR REPLACE FUNCTION public.award_reply_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.points_ledger (user_id, action, points, reference_id)
  VALUES (NEW.user_id, 'create_reply', 5, NEW.id);

  UPDATE public.profiles
  SET points_total = points_total + 5, updated_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_reply_created
  AFTER INSERT ON public.replies
  FOR EACH ROW EXECUTE FUNCTION public.award_reply_points();

-- ==========================================
-- TRIGGER: auto-upgrade tier
-- ==========================================
CREATE OR REPLACE FUNCTION public.check_tier_upgrade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.points_total >= 2000 THEN
    NEW.tier := 'Platinum';
  ELSIF NEW.points_total >= 1000 THEN
    NEW.tier := 'Gold';
  ELSE
    NEW.tier := 'Silver';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER on_profile_points_change
  BEFORE UPDATE OF points_total ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_tier_upgrade();

-- ==========================================
-- RPC: get_wallet_stats
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_wallet_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'balance', w.balance,
    'goal_amount', w.goal_amount,
    'remaining', w.goal_amount - w.balance,
    'progress_percent', CASE WHEN w.goal_amount > 0 THEN ROUND((w.balance / w.goal_amount) * 100, 1) ELSE 0 END,
    'contribution_count', (SELECT COUNT(*) FROM public.wallet_transactions WHERE user_id = p_user_id AND status = 'completed')
  ) INTO result
  FROM public.wallets w
  WHERE w.user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- Updated_at trigger helper
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_discussions_updated_at BEFORE UPDATE ON public.discussions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
