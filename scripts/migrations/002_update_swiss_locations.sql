-- Update shipments with missing location data to use Swiss locations
-- This script adds Swiss cities and coordinates to shipments that have null location data

-- Update shipments with null current_city to use Swiss locations
UPDATE shipments 
SET 
  current_city = 'Zurich',
  current_country = 'Switzerland',
  current_latitude = 47.3769,
  current_longitude = 8.5417
WHERE current_city IS NULL OR current_country IS NULL;

-- Update addresses with missing city/country to use Swiss locations
UPDATE addresses 
SET 
  city = CASE 
    WHEN city IS NULL OR city = '' THEN 'Basel'
    ELSE city 
  END,
  country = CASE 
    WHEN country IS NULL OR country = '' THEN 'Switzerland'
    ELSE country 
  END,
  latitude = CASE 
    WHEN latitude IS NULL THEN 47.5596
    ELSE latitude 
  END,
  longitude = CASE 
    WHEN longitude IS NULL THEN 7.5886
    ELSE longitude 
  END
WHERE city IS NULL OR city = '' OR country IS NULL OR country = '';

-- Add some sample Swiss addresses if none exist
INSERT INTO addresses (user_id, street, city, state, country, postal_code, latitude, longitude, is_default)
SELECT 
  u.id,
  'Bahnhofstrasse 1',
  'Zurich',
  'ZH',
  'Switzerland',
  '8001',
  47.3769,
  8.5417,
  false
FROM users u 
WHERE u.role = 'CUSTOMER' 
AND NOT EXISTS (
  SELECT 1 FROM addresses a 
  WHERE a.user_id = u.id AND a.country = 'Switzerland'
)
LIMIT 5;

-- Add more Swiss cities for variety
INSERT INTO addresses (user_id, street, city, state, country, postal_code, latitude, longitude, is_default)
SELECT 
  u.id,
  'Freie Strasse 25',
  'Basel',
  'BS',
  'Switzerland',
  '4001',
  47.5596,
  7.5886,
  false
FROM users u 
WHERE u.role = 'CUSTOMER' 
AND NOT EXISTS (
  SELECT 1 FROM addresses a 
  WHERE a.user_id = u.id AND a.city = 'Basel'
)
LIMIT 3;

INSERT INTO addresses (user_id, street, city, state, country, postal_code, latitude, longitude, is_default)
SELECT 
  u.id,
  'Rue du Lac 15',
  'Geneva',
  'GE',
  'Switzerland',
  '1201',
  46.2044,
  6.1432,
  false
FROM users u 
WHERE u.role = 'CUSTOMER' 
AND NOT EXISTS (
  SELECT 1 FROM addresses a 
  WHERE a.user_id = u.id AND a.city = 'Geneva'
)
LIMIT 3;