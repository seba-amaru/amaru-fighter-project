-- Migration: Add missing columns to profiles table
-- Created: 2026-08-05
-- Fixes: PGRST204 errors when saving member data from admin modal

-- Add missing columns to profiles (safe: IF NOT EXISTS)
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS rut TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS birthdate DATE,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
    ADD COLUMN IF NOT EXISTS admin_notes TEXT,
    ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS surcharge_pct INTEGER DEFAULT 30,
    ADD COLUMN IF NOT EXISTS combat_style TEXT DEFAULT 'striker',
    ADD COLUMN IF NOT EXISTS active_promo TEXT,
    ADD COLUMN IF NOT EXISTS pro_rata_preference TEXT,
    ADD COLUMN IF NOT EXISTS pro_rata_expired_in_month BOOLEAN,
    ADD COLUMN IF NOT EXISTS pro_rata_month_year TEXT;
