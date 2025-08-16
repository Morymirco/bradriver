-- =====================================================
-- VÉRIFIER ET CORRIGER LES DONNÉES MANQUANTES
-- =====================================================

-- 1. VÉRIFIER LES UTILISATEURS AUTH
-- ==================================
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- 2. VÉRIFIER LES PROFILS UTILISATEURS
-- =====================================
SELECT 
  id,
  name,
  email,
  phone_number,
  created_at
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 3. VÉRIFIER LES PROFILS CHAUFFEURS
-- ===================================
SELECT 
  id,
  created_at,
  updated_at
FROM driver_profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 4. COMPARER AUTH.USERS AVEC USER_PROFILES
-- =========================================
SELECT 
  'Utilisateurs auth' as source,
  COUNT(*) as nombre
FROM auth.users
UNION ALL
SELECT 
  'Profils utilisateurs' as source,
  COUNT(*) as nombre
FROM user_profiles;

-- 5. TROUVER LES UTILISATEURS SANS PROFIL
-- =======================================
SELECT 
  au.id as auth_user_id,
  au.email,
  au.created_at as auth_created_at,
  up.id as profile_id,
  up.name as profile_name
FROM auth.users au
LEFT JOIN user_profiles up ON au.id::text = up.id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- 6. TROUVER LES PROFILS SANS UTILISATEUR AUTH
-- ============================================
SELECT 
  up.id as profile_id,
  up.name,
  up.email,
  up.created_at as profile_created_at,
  au.id as auth_user_id
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id::text
WHERE au.id IS NULL
ORDER BY up.created_at DESC;

-- 7. VÉRIFIER L'UTILISATEUR SPÉCIFIQUE
-- =====================================
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
  'N/A' as name,
  created_at
FROM driver_profiles 
WHERE id = '2d6b815c-2995-4fbd-8b34-8f69de92a46c';

-- 8. CRÉER UN PROFIL UTILISATEUR MANQUANT (SI NÉCESSAIRE)
-- =======================================================
-- Décommenter et adapter si un profil est manquant
/*
INSERT INTO user_profiles (
  id,
  name,
  email,
  phone_number,
  created_at,
  updated_at
) 
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', 'Utilisateur'),
  au.email,
  au.raw_user_meta_data->>'phone_number',
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE au.id = '2d6b815c-2995-4fbd-8b34-8f69de92a46c'
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.id = au.id
  );
*/

-- 9. VÉRIFIER LES DONNÉES DE TEST
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
  AND scheduled_delivery_window_start IS NOT NULL;

-- 10. AFFICHER LES COMMANDES DISPONIBLES
-- ======================================
SELECT 
  id,
  delivery_type,
  status,
  available_for_drivers,
  scheduled_delivery_window_start,
  grand_total,
  business_id,
  user_id
FROM orders 
WHERE delivery_type = 'scheduled'
  AND available_for_drivers = true
  AND scheduled_delivery_window_start IS NOT NULL
ORDER BY scheduled_delivery_window_start ASC
LIMIT 5;
