
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed defaults
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'Hajj Wallet'),
  ('site_tagline', 'Your Sacred Journey Starts Here'),
  ('site_description', 'Save for Hajj, book packages, shop community merch, and connect with fellow pilgrims — all in one app.'),
  ('logo_url', ''),
  ('favicon_url', ''),
  ('primary_color', '168 76% 50%'),
  ('background_color', '170 40% 16%'),
  ('accent_color', '168 76% 50%'),
  ('footer_text', '© 2025 Hajj Wallet. All rights reserved.'),
  ('contact_email', ''),
  ('social_facebook', ''),
  ('social_twitter', ''),
  ('social_instagram', ''),
  ('og_image_url', ''),
  ('custom_css', '');
