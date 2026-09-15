-- Migration: Verificar y corregir datos de pagos
-- Objetivos:
-- 1. Corregir monto de Bryan Villalobos y Janicce Sepulveda (45,000 - 20% = 36,000)
-- 2. Verificar que todos los pagos con status='approved' tengan el campo user_id válido

-- 1. CORREGIR monto de Bryan y Janicce (solo descuento 20%, NO recargo)
UPDATE payments
SET amount = 36000,
    concept = COALESCE(concept, 'Guerrero Constante') || ' (-20% LFNM2026)',
    updated_at = NOW()
WHERE id IN (
    SELECT p.id
    FROM payments p
    JOIN profiles pr ON p.user_id = pr.id
    WHERE pr.full_name ILIKE '%bryan%villalobos%'
      AND p.status = 'approved'
);

UPDATE payments
SET amount = 36000,
    concept = COALESCE(concept, 'Guerrero Constante') || ' (-20% LFNM2026)',
    updated_at = NOW()
WHERE id IN (
    SELECT p.id
    FROM payments p
    JOIN profiles pr ON p.user_id = pr.id
    WHERE pr.full_name ILIKE '%janicce%sepulveda%'
      AND p.status = 'approved'
);

-- 2. Verificar pagos con user_id inválido o nulo
SELECT 
    p.id,
    p.user_id,
    p.amount,
    p.concept,
    p.status,
    p.created_at,
    CASE 
        WHEN p.user_id IS NULL THEN 'ERROR: user_id NULL'
        WHEN p.user_id = '' THEN 'ERROR: user_id VACIO'
        WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = p.user_id) THEN 'ERROR: user_id no existe en profiles'
        ELSE 'OK'
    END as validation_status
FROM payments p
WHERE p.status = 'approved'
ORDER BY p.created_at DESC
LIMIT 50;

-- 3. Listar todos los pagos approveados últimos 30 días para verificación
SELECT 
    p.id,
    pr.full_name,
    p.amount,
    p.concept,
    p.payment_method,
    p.created_at
FROM payments p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.status = 'approved'
  AND p.created_at >= NOW() - INTERVAL '30 days'
ORDER BY p.created_at DESC
LIMIT 30;