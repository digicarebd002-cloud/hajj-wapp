
INSERT INTO products (name, category, price, rating, reviews, image_emoji, is_limited)
VALUES
  ('Hajj Wallet Classic Tee', 'Apparel', 29.99, 4.8, 42, '👕', false),
  ('Premium Prayer Mat', 'Accessories', 49.99, 4.9, 27, '🧎', true),
  ('Community Hoodie', 'Apparel', 59.99, 4.7, 18, '🧥', false);

-- Add variants for each product
INSERT INTO product_variants (product_id, size, color_name, color_value)
SELECT p.id, s.size, c.color_name, c.color_value
FROM products p
CROSS JOIN (VALUES ('S'), ('M'), ('L'), ('XL')) AS s(size)
CROSS JOIN (VALUES ('Black', '#1a1a1a'), ('White', '#f5f5f5'), ('Teal', '#1A3C40')) AS c(color_name, color_value)
WHERE p.name = 'Hajj Wallet Classic Tee';

INSERT INTO product_variants (product_id, size, color_name, color_value)
SELECT p.id, s.size, c.color_name, c.color_value
FROM products p
CROSS JOIN (VALUES ('Standard'), ('Large')) AS s(size)
CROSS JOIN (VALUES ('Green', '#2d6a4f'), ('Navy', '#1d3557'), ('Burgundy', '#6b2737')) AS c(color_name, color_value)
WHERE p.name = 'Premium Prayer Mat';

INSERT INTO product_variants (product_id, size, color_name, color_value)
SELECT p.id, s.size, c.color_name, c.color_value
FROM products p
CROSS JOIN (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL')) AS s(size)
CROSS JOIN (VALUES ('Black', '#1a1a1a'), ('Grey', '#6b7280'), ('Forest', '#1A3C40')) AS c(color_name, color_value)
WHERE p.name = 'Community Hoodie';
