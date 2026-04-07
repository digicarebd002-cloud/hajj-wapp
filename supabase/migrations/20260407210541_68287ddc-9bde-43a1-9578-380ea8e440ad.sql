-- 1. Fix coupon_codes: restrict SELECT to active coupons only
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupon_codes;
CREATE POLICY "Anyone can view active coupons"
  ON public.coupon_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- 2. Fix points_ledger: remove user INSERT policy (triggers handle this)
DROP POLICY IF EXISTS "System can insert points" ON public.points_ledger;

-- 3. Fix wallet_transactions: remove user INSERT policy
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;

-- 4. Fix membership_payments: remove user INSERT policy
DROP POLICY IF EXISTS "Users can insert own payments" ON public.membership_payments;