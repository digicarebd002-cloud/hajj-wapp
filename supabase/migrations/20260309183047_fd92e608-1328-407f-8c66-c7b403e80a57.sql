
-- Referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid,
  referral_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  points_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "Users can create own referral codes" ON public.referrals
  FOR INSERT TO authenticated WITH CHECK (referrer_id = auth.uid());

CREATE POLICY "System can update referrals" ON public.referrals
  FOR UPDATE TO authenticated USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "Admins can manage all referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate a unique referral code for a user (idempotent)
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  -- Check if user already has a referral code
  SELECT referral_code INTO v_code
  FROM public.referrals
  WHERE referrer_id = p_user_id AND referred_id IS NULL AND status = 'pending'
  LIMIT 1;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  -- Generate a unique 8-char code
  LOOP
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    BEGIN
      INSERT INTO public.referrals (referrer_id, referral_code, status)
      VALUES (p_user_id, v_code, 'pending');
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      -- Try again
    END;
  END LOOP;
END;
$$;

-- Function to process a referral when a new user signs up with a code
CREATE OR REPLACE FUNCTION public.process_referral(p_referral_code text, p_referred_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral public.referrals%ROWTYPE;
  v_referrer_points integer := 50;
  v_referred_points integer := 25;
BEGIN
  -- Find the pending referral
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referral_code = upper(p_referral_code) AND status = 'pending' AND referred_id IS NULL
  LIMIT 1;

  IF v_referral.id IS NULL THEN
    RETURN false;
  END IF;

  -- Don't allow self-referral
  IF v_referral.referrer_id = p_referred_user_id THEN
    RETURN false;
  END IF;

  -- Mark referral as completed
  UPDATE public.referrals
  SET referred_id = p_referred_user_id, status = 'completed', completed_at = now(), points_awarded = v_referrer_points
  WHERE id = v_referral.id;

  -- Award points to referrer
  INSERT INTO public.points_ledger (user_id, action, points, reference_id)
  VALUES (v_referral.referrer_id, 'referral_bonus', v_referrer_points, v_referral.id);

  UPDATE public.profiles
  SET points_total = points_total + v_referrer_points, updated_at = now()
  WHERE user_id = v_referral.referrer_id;

  -- Award points to referred user
  INSERT INTO public.points_ledger (user_id, action, points, reference_id)
  VALUES (p_referred_user_id, 'referral_welcome', v_referred_points, v_referral.id);

  UPDATE public.profiles
  SET points_total = points_total + v_referred_points, updated_at = now()
  WHERE user_id = p_referred_user_id;

  -- Create a new pending referral code for the referrer (so they can keep referring)
  PERFORM public.get_or_create_referral_code(v_referral.referrer_id);

  RETURN true;
END;
$$;
