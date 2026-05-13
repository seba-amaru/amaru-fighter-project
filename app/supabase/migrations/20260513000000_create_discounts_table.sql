-- Tabla de descuentos/promociones
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT,
    percent INTEGER NOT NULL CHECK (percent >= 0 AND percent <= 100),
    plans TEXT[], -- IDs de planes aplicable, null = todos
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    "expiresAt" TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar código promocional LFNM2026
INSERT INTO discounts (code, name, percent, plans, "expiresAt", is_active)
VALUES ('LFNM2026', 'Descuento LFNM2026', 20, NULL, '2026-12-31T23:59:59Z', true)
ON CONFLICT (code) DO NOTHING;

-- RLS para discounts
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read discounts" ON discounts FOR SELECT USING (true);
CREATE POLICY "Admins can manage discounts" ON discounts FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()::text) = 'admin'
);

-- Agregar columna active_promo a profiles si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'active_promo') THEN
        ALTER TABLE profiles ADD COLUMN active_promo TEXT;
    END IF;
END $$;

-- Agregar columna surcharge_pct a profiles si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'surcharge_pct') THEN
        ALTER TABLE profiles ADD COLUMN surcharge_pct INTEGER DEFAULT 30;
    END IF;
END $$;