-- Migration: Add unique constraint to addresses table
-- Date: 2026-01-07
-- Description: Add composite unique constraint on (user_id, street, city, state, country, postal_code)
--              to support atomic upsert operations in the shipments API

-- Add the unique constraint to prevent duplicate addresses for the same user
ALTER TABLE addresses 
ADD CONSTRAINT addresses_user_composite_unique 
UNIQUE (user_id, street, city, state, country, postal_code);

-- Create index to improve performance on the constraint
CREATE INDEX IF NOT EXISTS idx_addresses_composite_unique 
ON addresses (user_id, street, city, state, country, postal_code);