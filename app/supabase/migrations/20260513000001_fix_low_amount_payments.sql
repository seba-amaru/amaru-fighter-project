-- Migración: Corrección de montos de pagos que se guardaron incorrectamente
-- Problema: Algunos pagos se guardaron con monto en pesos en vez de miles (ej: 38 en vez de 38000)

-- 1. Corregir montos muy bajos (asumiendo que deberían ser miles)
-- Busca pagos con monto < 1000 y los multiplica por 1000, excepto los que ya tienen descuento aplicado
UPDATE payments
SET amount = amount * 1000,
    updated_at = NOW()
WHERE amount < 1000 
  AND amount > 0
  AND status = 'approved'
  AND (concept IS NULL OR concept NOT LIKE '%LFNM2026%');

-- 2. Actualizar monto de Bryan Villalobos (si aún tiene monto incorrecto)
-- Precio original: $45,000, Descuento 20% = $36,000, Recargo 30% = $46,800
UPDATE payments
SET amount = 46800,
    concept = COALESCE(concept, 'Guerrero Constante') || ' (LFNM2026 - 20% desc + 30% recargo)',
    updated_at = NOW()
WHERE id IN (
    SELECT p.id
    FROM payments p
    JOIN profiles pr ON p.user_id = pr.id
    WHERE pr.full_name ILIKE '%bryan%villalobos%'
      AND p.status = 'approved'
      AND p.amount < 40000
);

-- 3. Actualizar monto de Janicce Sepulveda (si aún tiene monto incorrecto)
UPDATE payments
SET amount = 46800,
    concept = COALESCE(concept, 'Guerrero Constante') || ' (LFNM2026 - 20% desc + 30% recargo)',
    updated_at = NOW()
WHERE id IN (
    SELECT p.id
    FROM payments p
    JOIN profiles pr ON p.user_id = pr.id
    WHERE pr.full_name ILIKE '%janicce%sepulveda%'
      AND p.status = 'approved'
      AND p.amount < 40000
);

-- 4. Asegurar que active_promo esté configurado en los perfiles
UPDATE profiles
SET active_promo = 'LFNM2026',
    surcharge_pct = 30,
    updated_at = NOW()
WHERE full_name ILIKE '%bryan%villalobos%'
   OR full_name ILIKE '%janicce%sepulveda%'
   OR email ILIKE '%bryan%villalobos%'
   OR email ILIKE '%janicce%sepulveda%';

-- 5. Verificar que el código LFNM2026 existe en la tabla discounts
INSERT INTO discounts (code, name, percent, plans, "expiresAt", is_active)
VALUES ('LFNM2026', 'Descuento LFNM2026', 20, NULL, '2026-12-31T23:59:59Z', true)
ON CONFLICT (code) DO NOTHING;