-- =====================================================
-- VÉRIFIER LES DONNÉES SELON LE NOUVEAU SCHÉMA
-- =====================================================

-- 1. VÉRIFIER LA STRUCTURE DE LA TABLE ORDERS
-- ===========================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VÉRIFIER LES RELATIONS DE LA TABLE ORDERS
-- =============================================
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

-- 3. VÉRIFIER LES DONNÉES DANS ORDERS
-- ====================================
SELECT 
  id,
  delivery_type,
  status,
  available_for_drivers,
  driver_id,
  scheduled_delivery_window_start,
  scheduled_delivery_window_end,
  grand_total,
  business_id,
  user_id,
  created_at
FROM orders 
ORDER BY created_at DESC
LIMIT 10;

-- 4. VÉRIFIER LES COMMANDES PROGRAMMÉES DISPONIBLES
-- =================================================
SELECT 
  'Commandes programmées disponibles' as type,
  COUNT(*) as nombre
FROM orders 
WHERE delivery_type = 'scheduled'
  AND available_for_drivers = true
  AND driver_id IS NULL
  AND scheduled_delivery_window_start IS NOT NULL;

-- 5. AFFICHER LES COMMANDES DISPONIBLES AVEC DÉTAILS
-- ==================================================
SELECT 
  o.id,
  o.delivery_type,
  o.status,
  o.available_for_drivers,
  o.driver_id,
  o.scheduled_delivery_window_start,
  o.scheduled_delivery_window_end,
  o.grand_total,
  b.name as business_name,
  u.name as customer_name,
  o.created_at
FROM orders o
LEFT JOIN businesses b ON o.business_id = b.id
LEFT JOIN user_profiles u ON o.user_id = u.id
WHERE o.delivery_type = 'scheduled'
  AND o.available_for_drivers = true
  AND o.driver_id IS NULL
  AND o.scheduled_delivery_window_start IS NOT NULL
ORDER BY o.scheduled_delivery_window_start ASC
LIMIT 5;

-- 6. VÉRIFIER LES PROFILS CHAUFFEURS
-- ===================================
SELECT 
  id,
  name,
  email,
  phone_number,
  type,
  is_available,
  business_id,
  created_at
FROM driver_profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 7. VÉRIFIER LES PROFILS UTILISATEURS
-- =====================================
SELECT 
  id,
  name,
  email,
  phone_number,
  role_id,
  created_at
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 8. VÉRIFIER LES BUSINESS
-- =========================
SELECT 
  id,
  name,
  address,
  phone,
  email,
  is_active,
  created_at
FROM businesses 
ORDER BY created_at DESC
LIMIT 10;

-- 9. COMPTER LES DONNÉES PAR TYPE
-- ================================
SELECT 
  'Commandes totales' as type,
  COUNT(*) as nombre
FROM orders
UNION ALL
SELECT 
  'Commandes programmées' as type,
  COUNT(*) as nombre
FROM orders 
WHERE delivery_type = 'scheduled'
UNION ALL
SELECT 
  'Commandes disponibles' as type,
  COUNT(*) as nombre
FROM orders 
WHERE delivery_type = 'scheduled' 
  AND available_for_drivers = true
  AND driver_id IS NULL
  AND scheduled_delivery_window_start IS NOT NULL
UNION ALL
SELECT 
  'Profils chauffeurs' as type,
  COUNT(*) as nombre
FROM driver_profiles
UNION ALL
SELECT 
  'Profils utilisateurs' as type,
  COUNT(*) as nombre
FROM user_profiles
UNION ALL
SELECT 
  'Business' as type,
  COUNT(*) as nombre
FROM businesses;

-- 10. VÉRIFIER L'UTILISATEUR SPÉCIFIQUE
-- ======================================
-- L'utilisateur qui pose problème
SELECT 
  'Auth user' as type,
  id,
  email,
  created_at
FROM auth.users 
WHERE id = '2d6b815c-2995-4fbd-8b34-8f69de92a46c'
UNION ALL
SELECT 
  'User profile' as type,
  id,
  name,
  created_at
FROM user_profiles 
WHERE id = '2d6b815c-2995-4fbd-8b34-8f69de92a46c'
UNION ALL
SELECT 
  'Driver profile' as type,
  id,
  name,
  created_at
FROM driver_profiles 
WHERE id = '2d6b815c-2995-4fbd-8b34-8f69de92a46c';

-- 11. CRÉER UN PROFIL CHAUFFEUR MANQUANT (SI NÉCESSAIRE)
-- =======================================================
-- Décommenter et adapter si un profil chauffeur est manquant
/*
INSERT INTO driver_profiles (
  id,
  name,
  email,
  phone_number,
  type,
  is_available,
  created_at,
  updated_at
) 
SELECT 
  up.id,
  up.name,
  up.email,
  up.phone_number,
  'independent'::driver_type,
  true,
  up.created_at,
  up.updated_at
FROM user_profiles up
WHERE up.id = '2d6b815c-2995-4fbd-8b34-8f69de92a46c'
  AND NOT EXISTS (
    SELECT 1 FROM driver_profiles dp WHERE dp.id = up.id
  );
*/

-- 12. MESSAGE DE SUCCÈS
-- ======================
SELECT 
  '✅ VÉRIFICATION DU NOUVEAU SCHÉMA TERMINÉE' as message,
  'Toutes les données ont été vérifiées selon le nouveau schéma' as details;
