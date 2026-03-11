
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  cover_image_url text DEFAULT '',
  category text NOT NULL DEFAULT 'guide',
  tags text[] NOT NULL DEFAULT '{}',
  author_name text NOT NULL DEFAULT 'Hajj Wallet Team',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  meta_title text,
  meta_description text,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts"
  ON public.blog_posts FOR SELECT TO public
  USING (is_published = true);

CREATE POLICY "Admins can manage all posts"
  ON public.blog_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
