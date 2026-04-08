
-- 1. Create validation trigger for wallet_transactions
CREATE OR REPLACE FUNCTION public.validate_wallet_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Positive amounts (contributions) capped at $10,000
  IF NEW.amount > 0 AND NEW.amount > 10000 THEN
    RAISE EXCEPTION 'Transaction amount exceeds maximum allowed ($10,000)';
  END IF;
  
  -- Negative amounts (deductions like bookings) capped at -$100,000
  IF NEW.amount < -100000 THEN
    RAISE EXCEPTION 'Deduction amount exceeds maximum allowed';
  END IF;
  
  -- Prevent zero-amount transactions
  IF NEW.amount = 0 THEN
    RAISE EXCEPTION 'Transaction amount cannot be zero';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_validate_wallet_transaction
BEFORE INSERT ON public.wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION public.validate_wallet_transaction();

-- 2. Update apply_wallet_transaction to prevent negative balances
CREATE OR REPLACE FUNCTION public.apply_wallet_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    -- Prevent balance from going negative on deductions
    IF NEW.amount < 0 THEN
      IF (SELECT balance FROM public.wallets WHERE user_id = NEW.user_id) + NEW.amount < 0 THEN
        RAISE EXCEPTION 'Insufficient wallet balance';
      END IF;
    END IF;
    
    UPDATE public.wallets
    SET balance = balance + NEW.amount, updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Add authorization to get_wallet_stats
CREATE OR REPLACE FUNCTION public.get_wallet_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Authorization check: users can only view their own stats, admins can view any
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF auth.uid() != p_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: cannot view another user''s wallet stats';
  END IF;

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
$$;
