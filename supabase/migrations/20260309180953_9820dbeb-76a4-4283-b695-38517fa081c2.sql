
-- Create booking_installments table
CREATE TABLE public.booking_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  installment_number integer NOT NULL,
  amount numeric NOT NULL,
  due_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  paid_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id, installment_number)
);

CREATE INDEX idx_installments_booking ON public.booking_installments(booking_id);
CREATE INDEX idx_installments_user ON public.booking_installments(user_id);

ALTER TABLE public.booking_installments ENABLE ROW LEVEL SECURITY;

-- Users can view own installments
CREATE POLICY "Users can view own installments"
  ON public.booking_installments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert own installments (created during booking)
CREATE POLICY "Users can insert own installments"
  ON public.booking_installments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update own installments (mark as paid)
CREATE POLICY "Users can update own installments"
  ON public.booking_installments FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Admins full access
CREATE POLICY "Admins can manage all installments"
  ON public.booking_installments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
