
-- Create contact_messages table
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'unread',
  admin_notes text DEFAULT '',
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Users can insert their own messages (logged in)
CREATE POLICY "Users can insert own contact messages"
ON public.contact_messages FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Anonymous users can also submit contact forms
CREATE POLICY "Anon can insert contact messages"
ON public.contact_messages FOR INSERT TO anon
WITH CHECK (user_id IS NULL);

-- Admins can do everything
CREATE POLICY "Admins can manage all contact messages"
ON public.contact_messages FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view own messages
CREATE POLICY "Users can view own contact messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Trigger to update updated_at
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
