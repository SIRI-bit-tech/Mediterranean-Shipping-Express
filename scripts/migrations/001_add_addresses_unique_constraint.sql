-- Migration: Add unique constraint to addresses table
-- Date: 2026-01-07
-- Description: Add composite unique constraint on (user_id, street, city, state, country, postal_code)
--              to support atomic upsert operations in the shipments API

-- Add the unique constraint to prevent duplicate addresses for the same user (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'addresses_user_composite_unique'
  ) THEN
    ALTER TABLE addresses 
    ADD CONSTRAINT addresses_user_composite_unique 
    UNIQUE (user_id, street, city, state, country, postal_code);
  END IF;
END $$;