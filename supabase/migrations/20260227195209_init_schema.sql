-- SQL Schema for Amaru App (Supabase)

-- 1. MEMBERSHIP PLANS (Needed by Profiles)
CREATE TABLE IF NOT EXISTS membership_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    "limit" INTEGER DEFAULT 2, -- Classes per day
    monthly INTEGER DEFAULT 20, -- Classes per month
    subtitle TEXT,
    features TEXT[], -- Array of strings for plan highlights
    theme TEXT DEFAULT 'bronze', -- 'bronze', 'silver', 'gold'
    popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES (Sync with Firebase UID)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY, -- This will be the Firebase UID
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    photo_url TEXT,
    role TEXT DEFAULT 'athlete' CHECK (role IN ('athlete', 'admin')),
    level INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    membership_limit INTEGER DEFAULT 2,
    membership_status TEXT DEFAULT 'inactive',
    membership_expiry TIMESTAMPTZ,
    membership_plan_id TEXT REFERENCES membership_plans(id),
    is_deleted BOOLEAN DEFAULT FALSE, -- SOFT DELETE
    fcm_token TEXT, -- Firebase Cloud Messaging Token
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EXERCISES
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    personal_best NUMERIC DEFAULT 0,
    user_id TEXT REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRAINING PLANS
CREATE TABLE IF NOT EXISTS training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CLASSES
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    coach TEXT,
    time TEXT,
    type TEXT,
    days INTEGER[], -- Array of day numbers (0-6)
    img TEXT,
    theme TEXT DEFAULT 'smoke-purple', -- Class theme (style and color)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ATTENDANCE (Asistencia)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES profiles(id),
    class_id TEXT NOT NULL,
    class_name TEXT,
    attended_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PAYMENTS (General & Mercado Pago)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES profiles(id),
    payment_id TEXT UNIQUE, -- MP Preference ID or similar
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'COP',
    concept TEXT,
    receipt_url TEXT,
    status TEXT DEFAULT 'pending', -- approved, pending, rejected
    payment_method TEXT, -- 'mercado_pago', 'manual', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RESERVATIONS
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES profiles(id),
    class_id TEXT REFERENCES classes(id),
    class_name TEXT,
    reservation_date DATE NOT NULL,
    UNIQUE(user_id, class_id, reservation_date) -- Prevent double booking
);

-- 9. TOURNAMENTS
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    place TEXT,
    date DATE NOT NULL,
    img TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

--- ROW LEVEL SECURITY (RLS) ---

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- Tournaments Policies
CREATE POLICY "Users can manage their own tournaments" ON tournaments FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Admins can view all tournaments" ON tournaments FOR SELECT USING ((SELECT role FROM profiles WHERE id = auth.uid()::text) = 'admin');

-- Classes Policies
CREATE POLICY "Anyone can read classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Admins can manage classes" ON classes FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()::text) = 'admin');

-- Reservations Policies
CREATE POLICY "Users can manage their own reservations" ON reservations FOR ALL USING (auth.uid()::text = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()::text) = 'admin');

-- Profiles Policies
CREATE POLICY "Users can read their own profile" ON profiles FOR SELECT USING (auth.uid()::text = id OR (SELECT role FROM profiles WHERE id = auth.uid()::text) = 'admin');
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING ((SELECT role FROM profiles WHERE id = auth.uid()::text) = 'admin');
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid()::text = id);

-- Plans Policies
CREATE POLICY "Anyone can read plans" ON membership_plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage plans" ON membership_plans FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()::text) = 'admin');

-- Exercises Policies
CREATE POLICY "Users can manage their own exercises" ON exercises FOR ALL USING (auth.uid()::text = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()::text) = 'admin');

-- Training Plans Policies
CREATE POLICY "Users can manage their own training plans" ON training_plans FOR ALL USING (auth.uid()::text = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()::text) = 'admin');

-- Attendance Policies
CREATE POLICY "Users can manage their own attendance" ON attendance FOR ALL USING (auth.uid()::text = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()::text) = 'admin');

-- Payments Policies
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (auth.uid()::text = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()::text) = 'admin');
CREATE POLICY "Admins can manage all payments" ON payments FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()::text) = 'admin');
CREATE POLICY "Users can insert their own payments" ON payments FOR INSERT WITH CHECK (auth.uid()::text = user_id);
