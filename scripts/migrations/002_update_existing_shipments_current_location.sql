-- Migration: Update existing shipments to set current location at origin
-- Date: 2026-01-08
-- Description: Set current location fields for existing shipments that don't have them

-- Update shipments that have null current location data
UPDATE shipments 
SET 
  current_location = CASE 
    WHEN current_location IS NULL OR current_location = '' THEN
      COALESCE(
        (SELECT CONCAT_WS(', ', 
           street, 
           city, 
           CONCAT_WS(' ', state, postal_code)
         ) 
         FROM addresses 
         WHERE addresses.id = shipments.origin_address_id),
        'Processing at Origin'
      )
    ELSE current_location 
  END,
  current_city = CASE 
    WHEN current_city IS NULL OR current_city = '' THEN
      COALESCE(
        (SELECT city FROM addresses WHERE addresses.id = shipments.origin_address_id),
        'Unknown'
      )
    ELSE current_city 
  END,
  current_country = CASE 
    WHEN current_country IS NULL OR current_country = '' THEN
      COALESCE(
        (SELECT country FROM addresses WHERE addresses.id = shipments.origin_address_id),
        'US'
      )
    ELSE current_country 
  END,
  updated_at = NOW()
WHERE 
  (current_location IS NULL OR current_location = '' OR 
   current_city IS NULL OR current_city = '' OR 
   current_country IS NULL OR current_country = '')
  AND deleted_at IS NULL;