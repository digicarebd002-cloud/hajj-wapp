
-- Discussion categories table
CREATE TABLE public.discussion_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.discussion_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.discussion_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.discussion_categories FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed existing categories
INSERT INTO public.discussion_categories (name, sort_order) VALUES
  ('Hajj Preparation', 1),
  ('Savings Tips', 2),
  ('Travel Planning', 3),
  ('Spiritual Guidance', 4),
  ('Success Stories', 5);

-- Points rules table
CREATE TABLE public.points_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key text NOT NULL UNIQUE,
  label text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.points_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view points rules" ON public.points_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage points rules" ON public.points_rules FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed default point rules
INSERT INTO public.points_rules (action_key, label, points) VALUES
  ('create_discussion', 'Create a discussion', 10),
  ('create_reply', 'Reply to a thread', 5),
  ('receive_like', 'Receive a like', 2),
  ('best_answer', 'Best answer', 25);
