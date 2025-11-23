-- ============================================================================
-- Migration: Add Yelp Integration Columns
-- GlowGo Database Migration Script
-- ============================================================================
--
-- Purpose: Add columns to merchants table to store Yelp-specific data
-- This enables real provider matching with Yelp business information
--
-- Instructions:
-- 1. Open Supabase Dashboard (https://app.supabase.com)
-- 2. Select your project
-- 3. Go to SQL Editor → New Query
-- 4. Copy and paste this entire script
-- 5. Click "Run" to execute
--
-- ============================================================================

-- ============================================================================
-- ALTER TABLE: merchants - Add Yelp Integration Columns
-- ============================================================================

-- Yelp Business ID (unique identifier from Yelp)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS yelp_id VARCHAR(255) UNIQUE;

-- Yelp Price Range (e.g., "$", "$$", "$$$", "$$$$")
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS price_range VARCHAR(10);

-- Photos array from Yelp (JSON array of photo URLs)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Specialties/Categories from Yelp (JSON array)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]'::jsonb;

-- Stylist names (for salons with multiple stylists)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS stylist_names JSONB DEFAULT '[]'::jsonb;

-- Direct booking URL
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS booking_url VARCHAR(1000);

-- Yelp page URL
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS yelp_url VARCHAR(1000);

-- Business hours (JSON object with day: open/close times)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS business_hours JSONB;

-- Business website
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS website VARCHAR(1000);

-- Yelp categories (JSON array of category objects)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS yelp_categories JSONB DEFAULT '[]'::jsonb;

-- Data source identifier (e.g., 'yelp', 'manual', 'brightdata')
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'manual';

-- Last synced timestamp (when data was last fetched from Yelp)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- CREATE INDEX: Performance optimization for Yelp columns
-- ============================================================================

-- Index for Yelp ID lookups (important for deduplication)
CREATE INDEX IF NOT EXISTS idx_merchants_yelp_id ON merchants(yelp_id);

-- Index for price range filtering
CREATE INDEX IF NOT EXISTS idx_merchants_price_range ON merchants(price_range);

-- Index for data source filtering
CREATE INDEX IF NOT EXISTS idx_merchants_data_source ON merchants(data_source);

-- ============================================================================
-- UPDATE: Existing service_category constraint to include more Yelp categories
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_service_category_check;

-- First, update existing data to match new category names
-- Map old values to new standardized values
UPDATE merchants SET service_category = 'hair salon' WHERE service_category = 'hair_salon';
UPDATE merchants SET service_category = 'barbershop' WHERE service_category = 'barber';
UPDATE merchants SET service_category = 'nail salon' WHERE service_category = 'nail_salon';
UPDATE merchants SET service_category = 'eyebrow services' WHERE service_category = 'brows_lashes';
UPDATE merchants SET service_category = 'beauty salon' WHERE service_category = 'other';

-- Add updated constraint with more categories
ALTER TABLE merchants ADD CONSTRAINT merchants_service_category_check
    CHECK (service_category IN (
        'haircut', 'nails', 'cleaning', 'massage', 'spa', 'facial', 'waxing', 'makeup',
        'hair salon', 'barbershop', 'nail salon', 'beauty salon', 'day spa', 'skin care',
        'hair removal', 'eyebrow services', 'eyelash service', 'tanning', 'cosmetics',
        'hair extensions', 'hair stylists', 'men''s hair salons', 'blow dry/out services'
    ));

-- ============================================================================
-- ALTER TABLE: services - Add estimated price flag
-- ============================================================================

-- Flag to indicate if price is estimated (from price_range) vs actual
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_estimated_price BOOLEAN DEFAULT false;

-- Source of the service data
ALTER TABLE services ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'manual';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that columns were added successfully
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'merchants'
AND column_name IN (
    'yelp_id', 'price_range', 'photos', 'specialties',
    'stylist_names', 'booking_url', 'yelp_url',
    'business_hours', 'website', 'yelp_categories',
    'data_source', 'last_synced_at'
)
ORDER BY column_name;

-- Verify index creation
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'merchants'
AND indexname LIKE '%yelp%' OR indexname LIKE '%price_range%' OR indexname LIKE '%data_source%';

-- ============================================================================
-- SUCCESS!
-- ============================================================================
--
-- New columns added to merchants table:
-- - yelp_id: Unique Yelp business identifier
-- - price_range: "$" to "$$$$" pricing indicator
-- - photos: Array of photo URLs
-- - specialties: Array of specialties
-- - stylist_names: Array of stylist names
-- - booking_url: Direct booking link
-- - yelp_url: Yelp business page
-- - business_hours: Operating hours
-- - website: Business website
-- - yelp_categories: Yelp category data
-- - data_source: Where data came from
-- - last_synced_at: Last sync timestamp
--
-- New columns added to services table:
-- - is_estimated_price: Flag for estimated prices
-- - data_source: Where service data came from
--
-- ============================================================================
