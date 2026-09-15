-- ROLLBACK: Disable RLS again due to infinite recursion errors
-- The app handles security via frontend and Edge Functions
-- This reverts the problematic policies

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments DISABLE ROW LEVEL SECURITY;

-- Drop all policies to clean up
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can read plans" ON membership_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON membership_plans;
DROP POLICY IF EXISTS "Anyone can read classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;
DROP POLICY IF EXISTS "Users can manage own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can manage own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;
DROP POLICY IF EXISTS "Users can manage own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can manage own training plans" ON training_plans;
DROP POLICY IF EXISTS "Users can manage own tournaments" ON tournaments;