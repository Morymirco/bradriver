-- =====================================================
-- VÉRIFIER LA STRUCTURE RÉELLE DE LA TABLE DRIVER_PROFILES
-- =====================================================

-- 1. VÉRIFIER TOUTES LES COLONNES DE LA TABLE DRIVER_PROFILES
-- ===========================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'driver_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VÉRIFIER LES CONTRAINTES DE LA TABLE
-- ========================================
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'driver_profiles'
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
  AND tc.table_name = 'driver_profiles';

-- 4. VÉRIFIER LES DONNÉES RÉELLES
-- ================================
SELECT 
  id,
  created_at,
  updated_at
FROM driver_profiles 
LIMIT 3;

-- 5. RECHERCHER LES COLONNES LIÉES AUX UTILISATEURS
-- =================================================
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'driver_profiles' 
  AND table_schema = 'public'
  AND (column_name LIKE '%user%' OR column_name LIKE '%profile%' OR column_name LIKE '%auth%')
ORDER BY column_name;

-- 6. VÉRIFIER LA RELATION AVEC AUTH.USERS
-- =======================================
-- Voir si il y a une relation directe avec auth.users
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'driver_profiles' 
  AND table_schema = 'public'
  AND column_name LIKE '%id%'
ORDER BY column_name;

-- 7. TESTER LA RELATION AVEC L'UTILISATEUR AUTHENTIFIÉ
-- ====================================================
-- Voir comment identifier un chauffeur
SELECT 
  'Test relation chauffeur' as test,
  COUNT(*) as nombre_profils
FROM driver_profiles;

-- 8. VÉRIFIER LA TABLE USER_PROFILES POUR COMPRENDRE LA RELATION
-- ==============================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
