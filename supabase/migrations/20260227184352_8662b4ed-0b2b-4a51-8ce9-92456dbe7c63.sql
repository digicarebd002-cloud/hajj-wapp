
-- Add description and image_url columns to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';

-- Update existing dummy products with descriptions and images
UPDATE public.products SET
  description = 'Premium cotton blend tee with embroidered Hajj Wallet logo. Perfect for everyday wear and representing the community.',
  image_url = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'
WHERE name = 'Hajj Wallet Classic Tee';

UPDATE public.products SET
  description = 'Handcrafted premium prayer mat with intricate geometric patterns. Soft, durable, and perfect for daily prayers.',
  image_url = 'https://images.unsplash.com/photo-1585036156171-384164a8c696?w=800&q=80'
WHERE name = 'Premium Prayer Mat';

UPDATE public.products SET
  description = 'Heavyweight hoodie featuring beautiful Arabic calligraphy and community values. Stay warm and represent.',
  image_url = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80'
WHERE name = 'Community Hoodie';
