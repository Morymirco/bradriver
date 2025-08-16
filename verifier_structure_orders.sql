-- =====================================================
-- VÉRIFIER LA STRUCTURE RÉELLE DE LA TABLE ORDERS
-- =====================================================

-- 1. VÉRIFIER TOUTES LES COLONNES DE LA TABLE ORDERS
-- ==================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VÉRIFIER LES CONTRAINTES DE LA TABLE
-- ========================================
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'orders'
  AND table_schema = 'public';

-- 3. VÉRIFIER LES CLÉS ÉTRANGÈRES
-- ================================
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'orders';

-- 4. VÉRIFIER LES DONNÉES RÉELLES
-- ================================
SELECT 
  id,
  delivery_type,
  status,
  available_for_drivers,
  created_at
FROM orders 
LIMIT 3;

-- 5. RECHERCHER LES COLONNES LIÉES AUX CHAUFFEURS
-- ===============================================
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
  AND column_name LIKE '%driver%'
ORDER BY column_name;

-- 6. VÉRIFIER LA TABLE DRIVER_ORDERS
-- ==================================
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'driver_orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
