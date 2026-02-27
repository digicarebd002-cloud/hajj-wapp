
-- Insert two Hajj packages
INSERT INTO packages (name, price, duration, group_size, departure, accommodation, meals, guide, is_popular)
VALUES
  ('Essential Package', 2500, '10 Days', 'Up to 30', 'June 2026', 'Shared 3-star hotel', '3 meals/day', 'English-speaking group guide', false),
  ('Premium Package', 3500, '14 Days', 'Up to 15', 'June 2026', 'Private 4-star near Haram', 'Full board + snacks', 'Dedicated scholar + personal guide', true);

-- Insert features for Essential Package
INSERT INTO package_features (package_id, feature, sort_order)
SELECT p.id, f.feature, f.sort_order
FROM packages p
CROSS JOIN (VALUES
  ('Round-trip airfare included', 1),
  ('Shared accommodation (3-star)', 2),
  ('Ground transportation', 3),
  ('English-speaking guide', 4),
  ('Group support & orientation', 5),
  ('Visa processing', 6)
) AS f(feature, sort_order)
WHERE p.name = 'Essential Package';

-- Insert features for Premium Package
INSERT INTO package_features (package_id, feature, sort_order)
SELECT p.id, f.feature, f.sort_order
FROM packages p
CROSS JOIN (VALUES
  ('Premium round-trip airfare', 1),
  ('Private 4-star hotel near Haram', 2),
  ('Private transport throughout', 3),
  ('Dedicated scholar + personal guide', 4),
  ('Extended stay in Medina', 5),
  ('VIP support & concierge', 6),
  ('Travel insurance included', 7),
  ('Pre-departure orientation', 8)
) AS f(feature, sort_order)
WHERE p.name = 'Premium Package';
