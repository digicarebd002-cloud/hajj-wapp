
-- Update Essential Package
UPDATE packages SET 
  name = 'Essential Hajj Package',
  duration = '14 days',
  group_size = '40-50 people',
  departure = 'June 2026',
  accommodation = '3-Star',
  guide = 'Experienced English-speaking guide',
  meals = 'Daily meals (breakfast and dinner)'
WHERE id = '088976b6-28ea-4c40-87c3-d519c0160e40';

-- Update Premium Package
UPDATE packages SET 
  name = 'Premium Hajj Package',
  duration = '16 days',
  group_size = '25-30 people',
  departure = 'June 2026',
  accommodation = '4-Star',
  guide = 'Dedicated scholar and experienced guide',
  meals = 'All meals included (breakfast, lunch, dinner)'
WHERE id = '28aad645-33ad-44ea-97ae-a4e9b6b340ae';

-- Delete old features for Essential Package
DELETE FROM package_features WHERE package_id = '088976b6-28ea-4c40-87c3-d519c0160e40';

-- Insert new features for Essential Package
INSERT INTO package_features (package_id, feature, sort_order) VALUES
('088976b6-28ea-4c40-87c3-d519c0160e40', 'Round-trip airfare from major US cities', 0),
('088976b6-28ea-4c40-87c3-d519c0160e40', 'Shared accommodation in Mecca and Medina', 1),
('088976b6-28ea-4c40-87c3-d519c0160e40', 'Daily meals (breakfast and dinner)', 2),
('088976b6-28ea-4c40-87c3-d519c0160e40', 'Experienced English-speaking guide', 3),
('088976b6-28ea-4c40-87c3-d519c0160e40', 'Ground transportation', 4),
('088976b6-28ea-4c40-87c3-d519c0160e40', 'Hajj visa processing assistance', 5),
('088976b6-28ea-4c40-87c3-d519c0160e40', 'All required Hajj rituals guidance', 6),
('088976b6-28ea-4c40-87c3-d519c0160e40', 'Group orientation sessions', 7),
('088976b6-28ea-4c40-87c3-d519c0160e40', 'Emergency support 24/7', 8),
('088976b6-28ea-4c40-87c3-d519c0160e40', 'Hajj completion certificate', 9),
('088976b6-28ea-4c40-87c3-d519c0160e40', 'Shared rooms (4-6 people) within walking distance to Haram', 10);

-- Delete old features for Premium Package
DELETE FROM package_features WHERE package_id = '28aad645-33ad-44ea-97ae-a4e9b6b340ae';

-- Insert new features for Premium Package
INSERT INTO package_features (package_id, feature, sort_order) VALUES
('28aad645-33ad-44ea-97ae-a4e9b6b340ae', 'Premium round-trip airfare with extra baggage', 0),
('28aad645-33ad-44ea-97ae-a4e9b6b340ae', 'Private accommodation in 4-star hotels', 1),
('28aad645-33ad-44ea-97ae-a4e9b6b340ae', 'All meals included (breakfast, lunch, dinner)', 2),
('28aad645-33ad-44ea-97ae-a4e9b6b340ae', 'Dedicated scholar and experienced guide', 3),
('28aad645-33ad-44ea-97ae-a4e9b6b340ae', 'Private air-conditioned transportation', 4),
('28aad645-33ad-44ea-97ae-a4e9b6b340ae', 'Expedited Hajj visa processing', 5),
('28aad645-33ad-44ea-97ae-a4e9b6b340ae', 'Pre-departure training program', 6),
('28aad645-33ad-44ea-97ae-a4e9b6b340ae', 'All required Hajj rituals guidance', 7),
('28aad645-33ad-44ea-97ae-a4e9b6b340ae', 'Exclusive group seminars with scholars', 8),
('28aad645-33ad-44ea-97ae-a4e9b6b340ae', 'Priority emergency support 24/7', 9),
('28aad645-33ad-44ea-97ae-a4e9b6b340ae', 'Hajj completion certificate', 10),
('28aad645-33ad-44ea-97ae-a4e9b6b340ae', 'Post-Hajj spiritual guidance sessions', 11),
('28aad645-33ad-44ea-97ae-a4e9b6b340ae', 'Commemorative gift package', 12),
('28aad645-33ad-44ea-97ae-a4e9b6b340ae', 'Private rooms (2 people) in hotels near Haram with premium amenities', 13);
