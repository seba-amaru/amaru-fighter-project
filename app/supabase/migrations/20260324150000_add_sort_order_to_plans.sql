-- Add sort_order column to membership_plans table
ALTER TABLE membership_plans
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing plans to have a sequence as sort_order
WITH numbered_plans AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_order
    FROM membership_plans
)
UPDATE membership_plans
SET sort_order = numbered_plans.new_order
FROM numbered_plans
WHERE membership_plans.id = numbered_plans.id;
