
-- Sponsorship applications table
CREATE TABLE public.sponsorship_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  passport_number text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  has_performed_hajj boolean NOT NULL DEFAULT false,
  previous_hajj_year integer,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsorship_applications ENABLE ROW LEVEL SECURITY;

-- Users can view own applications
CREATE POLICY "Users can view own applications"
ON public.sponsorship_applications FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can insert own applications
CREATE POLICY "Users can insert own applications"
ON public.sponsorship_applications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins full access
CREATE POLICY "Admins can manage all applications"
ON public.sponsorship_applications FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update updated_at trigger
CREATE TRIGGER update_sponsorship_applications_updated_at
  BEFORE UPDATE ON public.sponsorship_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
