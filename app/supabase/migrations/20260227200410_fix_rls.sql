-- Disable RLS for all tables since Firebase Auth does not natively pass JWT to Supabase backend in this configuration
-- All security is handled via Firebase on frontend or Edge Functions doing business logic

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments DISABLE ROW LEVEL SECURITY;

-- Optional: Drop existing policies to clean up
DROP POLICY IF EXISTS "Users can manage their own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admins can view all tournaments" ON tournaments;
DROP POLICY IF EXISTS "Anyone can read classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;
DROP POLICY IF EXISTS "Users can manage their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can read plans" ON membership_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON membership_plans;
DROP POLICY IF EXISTS "Users can manage their own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can manage their own training plans" ON training_plans;
DROP POLICY IF EXISTS "Users can manage their own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;
