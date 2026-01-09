-- Migration: Add label column to addresses table and update unique constraint
-- Date: 2026-01-08
-- Description: Add label field to support multiple addresses for different purposes
--              and update the unique constraint to handle NULL values consistently

-- Add label column with default value
ALTER TABLE addresses 
ADD COLUMN label VARCHAR(50) NOT NULL DEFAULT 'home';

-- Add check constraint for label values
ALTER TABLE addresses 
ADD CONSTRAINT addresses_label_check 
CHECK (label IN ('home', 'work', 'billing', 'shipping', 'other'));

-- Update existing NULL values to empty strings for consistent uniqueness
UPDATE addresses SET state = '' WHERE state IS NULL;
UPDATE addresses SET postal_code = '' WHERE postal_code IS NULL;

-- Drop the old unique constraint
ALTER TABLE addresses 
DROP CONSTRAINT IF EXISTS addresses_user_composite_unique;

-- Drop old index
DROP INDEX IF EXISTS idx_addresses_composite_unique;

-- Add new unique constraint with label
ALTER TABLE addresses 
ADD CONSTRAINT addresses_user_composite_unique 
UNIQUE (user_id, street, city, state, country, postal_code, label);

-- Create new index matching the constraint
CREATE INDEX idx_addresses_composite_unique 
ON addresses (user_id, street, city, state, country, postal_code, label);