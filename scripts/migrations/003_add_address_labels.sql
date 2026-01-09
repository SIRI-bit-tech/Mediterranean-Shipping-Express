-- Migration: Add label column to addresses table and update unique constraint
-- Date: 2026-01-08
-- Description: Add label field to support multiple addresses for different purposes
--              and update the unique constraint to handle NULL values consistently

-- Add label column with default value (idempotent)
ALTER TABLE addresses 
ADD COLUMN IF NOT EXISTS label VARCHAR(50);

-- Set default value for the column
ALTER TABLE addresses 
ALTER COLUMN label SET DEFAULT 'home';

-- Update any NULL values to the default
UPDATE addresses SET label = 'home' WHERE label IS NULL;

-- Set NOT NULL constraint
ALTER TABLE addresses 
ALTER COLUMN label SET NOT NULL;

-- Add check constraint for label values (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.conname = 'addresses_label_check'
      AND t.relname = 'addresses'
      AND n.nspname = 'public'
  ) THEN
    ALTER TABLE addresses 
    ADD CONSTRAINT addresses_label_check 
    CHECK (label IN ('home', 'work', 'billing', 'shipping', 'other'));
  END IF;
END $$;

-- Update existing NULL values to empty strings for consistent uniqueness (idempotent)
DO $
BEGIN
  -- Only update state column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'addresses' 
      AND column_name = 'state' 
      AND table_schema = 'public'
  ) THEN
    UPDATE addresses SET state = '' WHERE state IS NULL;
  END IF;
  
  -- Only update postal_code column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'addresses' 
      AND column_name = 'postal_code' 
      AND table_schema = 'public'
  ) THEN
    UPDATE addresses SET postal_code = '' WHERE postal_code IS NULL;
  END IF;
END $;

-- Drop the old unique constraint
ALTER TABLE addresses 
DROP CONSTRAINT IF EXISTS addresses_user_composite_unique;

-- Drop old index
DROP INDEX IF EXISTS idx_addresses_composite_unique;

-- Add new unique constraint with label (idempotent)
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.conname = 'addresses_user_composite_unique'
      AND t.relname = 'addresses'
      AND n.nspname = 'public'
  ) THEN
    ALTER TABLE addresses 
    ADD CONSTRAINT addresses_user_composite_unique 
    UNIQUE (user_id, street, city, state, country, postal_code, label);
  END IF;
END $;

-- Create new index matching the constraint (idempotent)
CREATE INDEX IF NOT EXISTS idx_addresses_composite_unique 
ON addresses (user_id, street, city, state, country, postal_code, label);