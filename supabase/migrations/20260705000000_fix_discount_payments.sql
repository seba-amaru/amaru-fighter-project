-- Migración: Corrección de pagos con descuento LFNM2026
-- Plan Guerrero Constante: $45.000
-- Descuento LFNM2026: 20%
-- Monto correcto: $45.000 * 0.80 = $36.000

-- Bryan Villalobos
UPDATE payments
SET amount = 36000,
    concept = COALESCE(concept, 'Guerrero Constante') || ' (LFNM2026)',
    updated_at = NOW()
WHERE id IN (
    SELECT p.id
    FROM payments p
    JOIN profiles pr ON p.user_id = pr.id
    WHERE pr.full_name ILIKE '%bryan%villalobos%'
      AND p.amount = 45000
      AND p.status = 'approved'
);

-- Janicce Sepulveda
UPDATE payments
SET amount = 36000,
    concept = COALESCE(concept, 'Guerrero Constante') || ' (LFNM2026)',
    updated_at = NOW()
WHERE id IN (
    SELECT p.id
    FROM payments p
    JOIN profiles pr ON p.user_id = pr.id
    WHERE pr.full_name ILIKE '%janicce%sepulveda%'
      AND p.amount = 45000
      AND p.status = 'approved'
);

-- Fallback: si el monto fue guardado como 45 (en miles) en vez de 45000
UPDATE payments
SET amount = 36,
    concept = COALESCE(concept, 'Guerrero Constante') || ' (LFNM2026)',
    updated_at = NOW()
WHERE id IN (
    SELECT p.id
    FROM payments p
    JOIN profiles pr ON p.user_id = pr.id
    WHERE (
        pr.full_name ILIKE '%bryan%villalobos%'
        OR pr.full_name ILIKE '%janicce%sepulveda%'
    )
    AND p.amount = 45
    AND p.status = 'approved'
);
