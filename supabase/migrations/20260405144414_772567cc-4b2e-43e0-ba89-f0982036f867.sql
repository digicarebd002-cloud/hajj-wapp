
-- 1. Wallet contribution notification
CREATE OR REPLACE FUNCTION public.notify_wallet_contribution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, type, title, body, reference_id)
    VALUES (
      NEW.user_id,
      'contribution',
      'Contribution Received',
      'Your wallet has been credited with $' || NEW.amount::text || '.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_wallet_contribution
AFTER INSERT ON public.wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_wallet_contribution();

-- 2. Booking created notification
CREATE OR REPLACE FUNCTION public.notify_booking_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, reference_id)
  VALUES (
    NEW.user_id,
    'booking',
    'Booking Submitted',
    'Your booking has been submitted successfully. We will review it shortly.',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_booking_created
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_booking_created();

-- 3. Booking status change notification
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, type, title, body, reference_id)
    VALUES (
      NEW.user_id,
      'booking',
      'Booking ' || initcap(NEW.status),
      'Your booking status has been updated to ' || NEW.status || '.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_booking_status_change
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_booking_status_change();

-- 4. Order created notification
CREATE OR REPLACE FUNCTION public.notify_order_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, reference_id)
  VALUES (
    NEW.user_id,
    'booking',
    'Order Placed',
    'Your order has been placed successfully. Total: $' || NEW.total::text || '.',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_order_created
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_created();

-- 5. Order status change notification
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, type, title, body, reference_id)
    VALUES (
      NEW.user_id,
      'booking',
      'Order ' || initcap(NEW.status),
      'Your order status has been updated to ' || NEW.status || '.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();

-- 6. Community reply notification (notify discussion author)
CREATE OR REPLACE FUNCTION public.notify_discussion_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id uuid;
  v_title text;
BEGIN
  SELECT user_id, title INTO v_author_id, v_title
  FROM public.discussions
  WHERE id = NEW.discussion_id;

  -- Don't notify if replying to own discussion
  IF v_author_id IS NOT NULL AND v_author_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, reference_id)
    VALUES (
      v_author_id,
      'community',
      'New Reply on Your Discussion',
      'Someone replied to "' || left(v_title, 50) || '".',
      NEW.discussion_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_discussion_reply
AFTER INSERT ON public.replies
FOR EACH ROW
EXECUTE FUNCTION public.notify_discussion_reply();

-- 7. Discussion like notification
CREATE OR REPLACE FUNCTION public.notify_discussion_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id uuid;
  v_title text;
BEGIN
  IF NEW.discussion_id IS NOT NULL THEN
    SELECT user_id, title INTO v_author_id, v_title
    FROM public.discussions
    WHERE id = NEW.discussion_id;

    IF v_author_id IS NOT NULL AND v_author_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, body, reference_id)
      VALUES (
        v_author_id,
        'community',
        'Your Discussion Was Liked',
        'Someone liked your discussion "' || left(v_title, 50) || '".',
        NEW.discussion_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_discussion_like
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_discussion_like();

-- 8. Membership payment notification
CREATE OR REPLACE FUNCTION public.notify_membership_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, reference_id)
  VALUES (
    NEW.user_id,
    'membership',
    'Membership Payment Received',
    'Your membership payment of $' || NEW.amount::text || ' has been processed.',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_membership_payment
AFTER INSERT ON public.membership_payments
FOR EACH ROW
EXECUTE FUNCTION public.notify_membership_payment();

-- 9. Sponsorship application status notification
CREATE OR REPLACE FUNCTION public.notify_sponsorship_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, type, title, body, reference_id)
    VALUES (
      NEW.user_id,
      'system',
      'Sponsorship Application ' || initcap(NEW.status),
      'Your sponsorship application has been ' || NEW.status || '.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_sponsorship_status
AFTER UPDATE ON public.sponsorship_applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_sponsorship_status();

-- 10. Tier upgrade notification
CREATE OR REPLACE FUNCTION public.notify_tier_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.tier IS DISTINCT FROM NEW.tier THEN
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      NEW.user_id,
      'membership',
      'Tier Upgraded to ' || NEW.tier || '! 🎉',
      'Congratulations! You have been upgraded to ' || NEW.tier || ' tier. Enjoy your new benefits!'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_tier_upgrade
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_tier_upgrade();
