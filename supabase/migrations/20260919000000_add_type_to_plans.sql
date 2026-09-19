-- Add type and ensure subtitle exists on membership_plans table
ALTER TABLE membership_plans
ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'presencial',
ADD COLUMN IF NOT EXISTS "subtitle" TEXT;

