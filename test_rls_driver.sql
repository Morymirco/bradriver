-- =====================================================
-- TEST DES POLITIQUES RLS POUR LES CHAUFFEURS
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- 1. VÉRIFIER L'ÉTAT ACTUEL DES POLITIQUES
-- =========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- 2. VÉRIFIER SI RLS EST ACTIVÉ
-- ==============================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'orders';

-- 3. TESTER L'ACCÈS ANONYME (DEVRAIT ÉCHOUER)
-- ===========================================
-- Simuler l'accès anonyme (comme l'app sans authentification)
SELECT 
  'Test accès anonyme' as test,
  COUNT(*) as nombre_commandes
FROM orders 
WHERE delivery_type = 'scheduled'
  AND available_for_drivers = true
  AND driver_id IS NULL;

-- 4. TESTER L'ACCÈS AUTHENTIFIÉ (DEVRAIT FONCTIONNER)
-- ===================================================
-- Simuler l'accès authentifié (comme l'app avec authentification)
-- Note: Cette requête fonctionnera seulement si vous êtes connecté en tant qu'utilisateur authentifié

-- 5. VÉRIFIER LES DONNÉES RÉELLES
-- ===============================
SELECT 
  id,
  delivery_type,
  status,
  available_for_drivers,
  driver_id,
  scheduled_delivery_window_start,
  created_at
FROM orders 
WHERE delivery_type = 'scheduled'
ORDER BY created_at DESC 
LIMIT 5;

-- 6. CRÉER UNE POLITIQUE TEMPORAIRE POUR LES TESTS
-- ================================================
-- Si les politiques ne fonctionnent pas, créer une politique temporaire plus permissive
CREATE POLICY IF NOT EXISTS "temp_driver_access" ON orders
FOR SELECT
TO authenticated
USING (true);

-- 7. TESTER L'ACCÈS AVEC LA POLITIQUE TEMPORAIRE
-- ===============================================
SELECT 
  'Test avec politique temporaire' as test,
  COUNT(*) as nombre_commandes_accessibles
FROM orders 
WHERE delivery_type = 'scheduled'
  AND available_for_drivers = true
  AND driver_id IS NULL;

-- 8. VÉRIFIER LES PERMISSIONS DE L'UTILISATEUR ACTUEL
-- ===================================================
SELECT 
  current_user as utilisateur_actuel,
  session_user as utilisateur_session,
  current_setting('role') as role_actuel;

-- 9. TESTER L'ACCÈS AUX TABLES LIÉES
-- ===================================
-- Vérifier l'accès aux businesses
SELECT 
  'Test accès businesses' as test,
  COUNT(*) as nombre_businesses
FROM businesses 
WHERE is_active = true;

-- Vérifier l'accès aux user_profiles
SELECT 
  'Test accès user_profiles' as test,
  COUNT(*) as nombre_profils
FROM user_profiles;

-- 10. CRÉER UNE POLITIQUE SIMPLE POUR LES TESTS
-- =============================================
-- Politique très simple pour permettre l'accès aux chauffeurs
DROP POLICY IF EXISTS "simple_driver_access" ON orders;

CREATE POLICY "simple_driver_access" ON orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 11. TESTER AVEC LA POLITIQUE SIMPLE
-- ===================================
SELECT 
  'Test avec politique simple' as test,
  COUNT(*) as nombre_commandes_accessibles
FROM orders 
WHERE delivery_type = 'scheduled'
  AND available_for_drivers = true
  AND driver_id IS NULL;

-- 12. NETTOYER LES POLITIQUES TEMPORAIRES
-- ======================================
-- Décommentez ces lignes pour nettoyer après les tests
-- DROP POLICY IF EXISTS "temp_driver_access" ON orders;
-- DROP POLICY IF EXISTS "simple_driver_access" ON orders;
