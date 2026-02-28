
CREATE TABLE public.page_contents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug text NOT NULL,
  section_key text NOT NULL,
  content_type text NOT NULL DEFAULT 'text',
  content_value text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(page_slug, section_key)
);

ALTER TABLE public.page_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view page contents" ON public.page_contents FOR SELECT USING (true);
CREATE POLICY "Admins can manage page contents" ON public.page_contents FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed: Home page
INSERT INTO public.page_contents (page_slug, section_key, content_type, content_value, label, sort_order) VALUES
  ('home', 'hero_badge', 'text', 'The Hajj Savings Platform', 'Hero Badge Text', 1),
  ('home', 'hero_title_line1', 'text', 'Save Together,', 'Hero Title Line 1', 2),
  ('home', 'hero_title_line2', 'text', 'Journey Together', 'Hero Title Line 2', 3),
  ('home', 'hero_description', 'textarea', 'Join a supportive community saving for the sacred pilgrimage to Mecca. Build your Hajj fund, earn rewards, and fulfill your spiritual journey.', 'Hero Description', 4),
  ('home', 'hero_video', 'video', '/videos/hajj-bg.mp4', 'Hero Background Video URL', 5),
  ('home', 'hero_emoji', 'text', '🕌', 'Hero Emoji', 6),
  ('home', 'how_it_works_title', 'text', 'Your Path to Hajj', 'How It Works Title', 10),
  ('home', 'how_it_works_subtitle', 'text', 'A simple, supportive way to save for your pilgrimage', 'How It Works Subtitle', 11),
  ('home', 'step1_title', 'text', 'Join the Community', 'Step 1 Title', 12),
  ('home', 'step1_desc', 'textarea', 'Become a member for $25/month and join hundreds of Muslims on the same journey.', 'Step 1 Description', 13),
  ('home', 'step2_title', 'text', 'Build Your Wallet', 'Step 2 Title', 14),
  ('home', 'step2_desc', 'textarea', 'Contribute any amount to your personal Hajj savings wallet whenever you can.', 'Step 2 Description', 15),
  ('home', 'step3_title', 'text', 'Earn Points', 'Step 3 Title', 16),
  ('home', 'step3_desc', 'textarea', 'Engage with the community through posts and replies to earn valuable points.', 'Step 3 Description', 17),
  ('home', 'step4_title', 'text', 'Travel to Mecca', 'Step 4 Title', 18),
  ('home', 'step4_desc', 'textarea', 'Reach your savings goal and embark on your sacred pilgrimage.', 'Step 4 Description', 19),
  ('home', 'packages_title', 'text', 'Hajj Packages', 'Packages Section Title', 20),
  ('home', 'packages_subtitle', 'text', 'Choose the package that fits your needs', 'Packages Section Subtitle', 21),
  ('home', 'community_title', 'text', 'Thriving Community', 'Community Section Title', 30),
  ('home', 'community_subtitle', 'text', 'Connect, share, and support each other', 'Community Section Subtitle', 31),
  ('home', 'stat1_value', 'text', '1200', 'Stat: Active Members Count', 32),
  ('home', 'stat1_label', 'text', 'Active Members', 'Stat: Active Members Label', 33),
  ('home', 'stat2_value', 'text', '350', 'Stat: Pilgrimages Count', 34),
  ('home', 'stat2_label', 'text', 'Successful Pilgrimages', 'Stat: Pilgrimages Label', 35),
  ('home', 'stat3_value', 'text', '12', 'Stat: Sponsorships Count', 36),
  ('home', 'stat3_label', 'text', 'Monthly Sponsorships', 'Stat: Sponsorships Label', 37),
  ('home', 'sponsor_title', 'text', 'Monthly Sponsorship Program', 'Sponsorship Banner Title', 40),
  ('home', 'sponsor_desc', 'textarea', 'Every month, we select a community member to travel to Mecca fully sponsored — chosen by engagement, dedication, and faith.', 'Sponsorship Banner Description', 41),
  ('home', 'cta_title', 'text', 'Begin Your Sacred Journey Today', 'Final CTA Title', 50),
  ('home', 'cta_desc', 'textarea', 'Join our community and take the first step toward fulfilling your spiritual obligation.', 'Final CTA Description', 51),

  -- Sponsorship page
  ('sponsorship', 'hero_title', 'text', 'Monthly Sponsorship Program', 'Hero Title', 1),
  ('sponsorship', 'hero_desc', 'textarea', 'Every month, we sponsor selected members to travel for Hajj completely free. Your dedication to our community could make you our next sponsored pilgrim.', 'Hero Description', 2),
  ('sponsorship', 'how_title', 'text', 'How It Works', 'How It Works Title', 10),
  ('sponsorship', 'how_subtitle', 'text', 'Our sponsorship selection process', 'How It Works Subtitle', 11),
  ('sponsorship', 'eligibility_title', 'text', 'Eligibility Criteria', 'Eligibility Title', 20),
  ('sponsorship', 'eligibility_subtitle', 'text', 'Requirements to be considered for sponsorship', 'Eligibility Subtitle', 21),
  ('sponsorship', 'included_title', 'text', 'What''s Included in Sponsorship', 'Included Title', 30),
  ('sponsorship', 'included_subtitle', 'text', 'Full coverage for your Hajj journey', 'Included Subtitle', 31),
  ('sponsorship', 'cta_title', 'text', 'Ready to Start Your Journey?', 'CTA Title', 40),
  ('sponsorship', 'cta_desc', 'textarea', 'Join our community today and start building your path to a sponsored Hajj pilgrimage.', 'CTA Description', 41),

  -- Store page
  ('store', 'hero_title', 'text', 'Community Store', 'Hero Title', 1),
  ('store', 'hero_desc', 'textarea', 'Browse our collection of Hajj essentials and community merchandise.', 'Hero Description', 2),

  -- Community page
  ('community', 'hero_title', 'text', 'Community Forum', 'Hero Title', 1),
  ('community', 'hero_desc', 'textarea', 'Connect with fellow pilgrims, share experiences, and earn rewards.', 'Hero Description', 2),

  -- Packages page
  ('packages', 'hero_title', 'text', 'Hajj Packages', 'Hero Title', 1),
  ('packages', 'hero_desc', 'textarea', 'Choose the perfect package for your sacred journey.', 'Hero Description', 2),

  -- Wallet page
  ('wallet', 'hero_title', 'text', 'Hajj Wallet', 'Hero Title', 1),
  ('wallet', 'hero_desc', 'textarea', 'Track your savings and build your Hajj fund.', 'Hero Description', 2);
