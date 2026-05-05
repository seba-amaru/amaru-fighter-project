-- Enable RLS with proper policies (replaces 20260227200410_fix_rls.sql)
-- This enables security while keeping the app functional
-- NOTE: Avoid self-referencing subqueries to prevent infinite recursion

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies (simple - no self-references to avoid infinite recursion)
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow all reads for now (the app handles security in UI)
CREATE POLICY "Anyone can read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 3. Membership Plans Policies
DROP POLICY IF EXISTS "Anyone can read plans" ON membership_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON membership_plans;

CREATE POLICY "Anyone can read plans" ON membership_plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage plans" ON membership_plans FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 4. Classes Policies
DROP POLICY IF EXISTS "Anyone can read classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;

CREATE POLICY "Anyone can read classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Admins can manage classes" ON classes FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 5. Reservations Policies
DROP POLICY IF EXISTS "Users can manage their own reservations" ON reservations;

CREATE POLICY "Users can manage own reservations" ON reservations FOR ALL USING (auth.uid()::text = user_id);

-- 6. Attendance Policies
DROP POLICY IF EXISTS "Users can manage their own attendance" ON attendance;

CREATE POLICY "Users can manage own attendance" ON attendance FOR ALL USING (auth.uid()::text = user_id);

-- 7. Payments Policies
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;

CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Admins can manage all payments" ON payments FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 8. Exercises Policies
DROP POLICY IF EXISTS "Users can manage their own exercises" ON exercises;

CREATE POLICY "Users can manage own exercises" ON exercises FOR ALL USING (auth.uid()::text = user_id);

-- 9. Training Plans Policies
DROP POLICY IF EXISTS "Users can manage their own training plans" ON training_plans;

CREATE POLICY "Users can manage own training plans" ON training_plans FOR ALL USING (auth.uid()::text = user_id);

-- 10. Tournaments Policies
DROP POLICY IF EXISTS "Users can manage their own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admins can view all tournaments" ON tournaments;

CREATE POLICY "Users can manage own tournaments" ON tournaments FOR ALL USING (auth.uid()::text = user_id);

-- 3. Membership Plans Policies
DROP POLICY IF EXISTS "Anyone can read plans" ON membership_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON membership_plans;

CREATE POLICY "Anyone can read plans" ON membership_plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage plans" ON membership_plans FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
);

-- 4. Classes Policies
DROP POLICY IF EXISTS "Anyone can read classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;

CREATE POLICY "Anyone can read classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Admins can manage classes" ON classes FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
);

-- 5. Reservations Policies
DROP POLICY IF EXISTS "Users can manage their own reservations" ON reservations;

CREATE POLICY "Users can manage own reservations" ON reservations FOR ALL USING (
    auth.uid()::text = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
);

-- 6. Attendance Policies
DROP POLICY IF EXISTS "Users can manage their own attendance" ON attendance;

CREATE POLICY "Users can manage own attendance" ON attendance FOR ALL USING (
    auth.uid()::text = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
);

-- 7. Payments Policies
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;

CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (
    auth.uid()::text = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Admins can manage all payments" ON payments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
);

-- 8. Exercises Policies
DROP POLICY IF EXISTS "Users can manage their own exercises" ON exercises;

CREATE POLICY "Users can manage own exercises" ON exercises FOR ALL USING (
    auth.uid()::text = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
);

-- 9. Training Plans Policies
DROP POLICY IF EXISTS "Users can manage their own training plans" ON training_plans;

CREATE POLICY "Users can manage own training plans" ON training_plans FOR ALL USING (
    auth.uid()::text = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
);

-- 10. Tournaments Policies
DROP POLICY IF EXISTS "Users can manage their own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admins can view all tournaments" ON tournaments;

CREATE POLICY "Users can manage own tournaments" ON tournaments FOR ALL USING (
    auth.uid()::text = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
);