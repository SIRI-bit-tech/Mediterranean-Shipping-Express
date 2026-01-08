-- Migration: Update existing shipments to set current location at origin
-- Date: 2026-01-08
-- Description: Set current location fields for existing shipments that don't have them

-- Update shipments that have null current location data
UPDATE shipments 
SET 
  current_location = COALESCE(
    (SELECT CONCAT(street, ', ', city, ', ', state, ' ', postal_code) 
     FROM addresses 
     WHERE addresses.id = shipments.origin_address_id),
    'Processing at Origin'
  ),
  current_city = COALESCE(
    (SELECT city FROM addresses WHERE addresses.id = shipments.origin_address_id),
    'Unknown'
  ),
  current_country = COALESCE(
    (SELECT country FROM addresses WHERE addresses.id = shipments.origin_address_id),
    'US'
  ),
  updated_at = NOW()
WHERE 
  (current_location IS NULL OR current_location = '' OR current_city IS NULL OR current_city = '')
  AND deleted_at IS NULL;