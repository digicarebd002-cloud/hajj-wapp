
-- Create product_images table for multiple images per product
CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  color_name text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view images
CREATE POLICY "Anyone can view product images"
ON public.product_images FOR SELECT
USING (true);

-- Admins can manage images
CREATE POLICY "Admins can manage product images"
ON public.product_images FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for faster lookups
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);

-- Insert images for existing products

-- Hajj Wallet Classic Tee (white tee)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, color_name)
SELECT id, url, alt, sort_order, color FROM products p,
(VALUES
  ('https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80', 'White t-shirt front view', 0, 'White'),
  ('https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=800&q=80', 'White t-shirt back view', 1, 'White'),
  ('https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80', 'Black t-shirt front view', 2, 'Black'),
  ('https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80', 'T-shirt detail close-up', 3, NULL)
) AS imgs(url, alt, sort_order, color)
WHERE p.name = 'Hajj Wallet Classic Tee';

-- Premium Prayer Mat
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, color_name)
SELECT id, url, alt, sort_order, color FROM products p,
(VALUES
  ('https://images.unsplash.com/photo-1590076082261-3ae013ded63e?w=800&q=80', 'Prayer mat green', 0, 'Green'),
  ('https://images.unsplash.com/photo-1585036156171-384164a8c696?w=800&q=80', 'Prayer mat navy pattern', 1, 'Navy'),
  ('https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=800&q=80', 'Prayer mat burgundy', 2, 'Burgundy'),
  ('https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&q=80', 'Prayer mat detail', 3, NULL)
) AS imgs(url, alt, sort_order, color)
WHERE p.name = 'Premium Prayer Mat';

-- Community Hoodie
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, color_name)
SELECT id, url, alt, sort_order, color FROM products p,
(VALUES
  ('https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80', 'Grey hoodie front', 0, 'Grey'),
  ('https://images.unsplash.com/photo-1578768079470-c7c4a6ef8e9e?w=800&q=80', 'Black hoodie front', 1, 'Black'),
  ('https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80', 'Hoodie back view', 2, NULL),
  ('https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800&q=80', 'Hoodie detail', 3, 'Forest')
) AS imgs(url, alt, sort_order, color)
WHERE p.name = 'Community Hoodie';

-- Hajj Journal & Planner
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, color_name)
SELECT id, url, alt, sort_order, color FROM products p,
(VALUES
  ('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80', 'Journal brown leather', 0, 'Brown'),
  ('https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80', 'Journal open pages', 1, NULL),
  ('https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=80', 'Journal with pen', 2, 'Black'),
  ('https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80', 'Journal writing', 3, 'Tan')
) AS imgs(url, alt, sort_order, color)
WHERE p.name = 'Hajj Journal & Planner';

-- Ihram Set
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, color_name)
SELECT id, url, alt, sort_order, color FROM products p,
(VALUES
  ('https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80', 'Ihram set folded', 0, 'White'),
  ('https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80', 'White cotton fabric detail', 1, 'White'),
  ('https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=800&q=80', 'Fabric texture close-up', 2, NULL),
  ('https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80', 'Cotton fabric folded', 3, NULL)
) AS imgs(url, alt, sort_order, color)
WHERE p.name = 'Ihram Set (Men)';

-- Cap
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, color_name)
SELECT id, url, alt, sort_order, color FROM products p,
(VALUES
  ('https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=800&q=80', 'Black cap front', 0, 'Black'),
  ('https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80', 'White cap side', 1, 'White'),
  ('https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=800&q=80', 'Navy cap front', 2, 'Navy'),
  ('https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&q=80', 'Cap detail embroidery', 3, NULL)
) AS imgs(url, alt, sort_order, color)
WHERE p.name = 'Hajj Wallet Cap';

-- Travel Prayer Rug
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, color_name)
SELECT id, url, alt, sort_order, color FROM products p,
(VALUES
  ('https://images.unsplash.com/photo-1584286595398-a59511e0649f?w=800&q=80', 'Travel rug green', 0, 'Green'),
  ('https://images.unsplash.com/photo-1590076082261-3ae013ded63e?w=800&q=80', 'Travel rug folded', 1, 'Blue'),
  ('https://images.unsplash.com/photo-1585036156171-384164a8c696?w=800&q=80', 'Travel rug burgundy', 2, 'Burgundy'),
  ('https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=800&q=80', 'Rug with compass', 3, NULL)
) AS imgs(url, alt, sort_order, color)
WHERE p.name = 'Travel Prayer Rug (Portable)';

-- Dua Book
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, color_name)
SELECT id, url, alt, sort_order, color FROM products p,
(VALUES
  ('https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80', 'Book cover', 0, 'Classic'),
  ('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80', 'Book open pages', 1, NULL),
  ('https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80', 'Book stack view', 2, NULL),
  ('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80', 'Book reading', 3, NULL)
) AS imgs(url, alt, sort_order, color)
WHERE p.name = 'Dua Book Collection';

-- Tote Bag
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, color_name)
SELECT id, url, alt, sort_order, color FROM products p,
(VALUES
  ('https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80', 'Natural tote bag', 0, 'Natural'),
  ('https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80', 'Black tote bag', 1, 'Black'),
  ('https://images.unsplash.com/photo-1597633425046-08f5110420b5?w=800&q=80', 'Tote bag in use', 2, NULL),
  ('https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?w=800&q=80', 'Tote bag detail', 3, 'Teal')
) AS imgs(url, alt, sort_order, color)
WHERE p.name = 'Community Tote Bag';
