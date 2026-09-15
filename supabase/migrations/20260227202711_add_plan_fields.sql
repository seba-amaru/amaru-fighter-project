-- Add missing fields to membership_plans table to fix 400 Bad Request
ALTER TABLE membership_plans
ADD COLUMN IF NOT EXISTS "days" INTEGER[],
ADD COLUMN IF NOT EXISTS "description" TEXT;
