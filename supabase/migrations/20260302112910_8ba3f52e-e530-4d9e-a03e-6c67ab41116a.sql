
-- Add more products
INSERT INTO products (name, category, price, rating, reviews, is_limited, image_url, image_emoji, short_description, description) VALUES
('Hajj Journal & Planner', 'Accessories', 24.99, 4.9, 35, false, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80', '📓', 'Premium leather-bound journal with daily Hajj planner, dua sections, and reflection pages.', 'A beautifully crafted journal designed specifically for your Hajj journey. Features daily planning pages, important dua collections, reflection prompts, and key ritual checklists. Bound in premium vegan leather with gold foil accents.'),
('Ihram Set (Men)', 'Apparel', 39.99, 4.7, 22, false, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80', '🧣', 'High-quality 100% cotton ihram set with comfortable fit for Hajj and Umrah.', 'Premium quality ihram set made from 100% Egyptian cotton. Soft, breathable, and perfectly sized for comfort during Tawaf and Sa''i. Comes in a convenient travel pouch.'),
('Hajj Wallet Cap', 'Apparel', 19.99, 4.6, 15, false, 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=800&q=80', '🧢', 'Embroidered snapback cap with Hajj Wallet logo. Adjustable fit.', 'Classic snapback cap featuring embroidered Hajj Wallet logo. Made from premium cotton twill with adjustable snap closure. Perfect for everyday wear and showing your community pride.'),
('Travel Prayer Rug (Portable)', 'Accessories', 34.99, 4.8, 28, true, 'https://images.unsplash.com/photo-1584286595398-a59511e0649f?w=800&q=80', '🧎‍♂️', 'Compact, foldable prayer rug with compass and carrying case. Perfect for travel.', 'Ultra-lightweight portable prayer rug with built-in Qibla compass. Folds into a compact pouch for easy carrying. Water-resistant backing and soft cushioned surface. Ideal for Hajj, Umrah, and everyday travel.'),
('Dua Book Collection', 'Accessories', 14.99, 4.9, 45, false, 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80', '📖', 'Pocket-sized dua book with Arabic text, transliteration, and English translation.', 'Comprehensive collection of essential duas for Hajj and daily life. Features clear Arabic text, easy-to-read transliteration, and accurate English translations. Pocket-sized for convenience during your pilgrimage.'),
('Community Tote Bag', 'Accessories', 22.99, 4.5, 19, false, 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80', '👜', 'Eco-friendly canvas tote with Hajj Wallet branding. Spacious and durable.', 'Sturdy canvas tote bag with screen-printed Hajj Wallet design. Features reinforced handles, interior pocket, and generous capacity. Made from 100% organic cotton canvas.');

-- Add variants for new products
INSERT INTO product_variants (product_id, size, color_name, color_value) 
SELECT p.id, s.size, c.color_name, c.color_value
FROM products p
CROSS JOIN (VALUES ('One Size')) AS s(size)
CROSS JOIN (VALUES ('Brown', '#8B4513'), ('Black', '#000000'), ('Tan', '#D2B48C')) AS c(color_name, color_value)
WHERE p.name = 'Hajj Journal & Planner';

INSERT INTO product_variants (product_id, size, color_name, color_value)
SELECT p.id, s.size, 'White' AS color_name, '#FFFFFF' AS color_value
FROM products p
CROSS JOIN (VALUES ('Standard'), ('Large')) AS s(size)
WHERE p.name = 'Ihram Set (Men)';

INSERT INTO product_variants (product_id, size, color_name, color_value)
SELECT p.id, s.size, c.color_name, c.color_value
FROM products p
CROSS JOIN (VALUES ('One Size')) AS s(size)
CROSS JOIN (VALUES ('Black', '#000000'), ('White', '#FFFFFF'), ('Navy', '#1B2A4A')) AS c(color_name, color_value)
WHERE p.name = 'Hajj Wallet Cap';

INSERT INTO product_variants (product_id, size, color_name, color_value)
SELECT p.id, s.size, c.color_name, c.color_value
FROM products p
CROSS JOIN (VALUES ('Standard'), ('Large')) AS s(size)
CROSS JOIN (VALUES ('Green', '#2E7D32'), ('Blue', '#1565C0'), ('Burgundy', '#800020')) AS c(color_name, color_value)
WHERE p.name = 'Travel Prayer Rug (Portable)';

INSERT INTO product_variants (product_id, size, color_name, color_value)
SELECT p.id, 'Pocket' AS size, 'Classic' AS color_name, '#2E4057' AS color_value
FROM products p
WHERE p.name = 'Dua Book Collection';

INSERT INTO product_variants (product_id, size, color_name, color_value)
SELECT p.id, s.size, c.color_name, c.color_value
FROM products p
CROSS JOIN (VALUES ('One Size')) AS s(size)
CROSS JOIN (VALUES ('Natural', '#F5F5DC'), ('Black', '#000000'), ('Teal', '#008080')) AS c(color_name, color_value)
WHERE p.name = 'Community Tote Bag';
