-- =====================================================
-- POLITIQUES RLS SIMPLIFIÉES POUR LES CHAUFFEURS
-- Sans utiliser les colonnes qui n'existent pas
-- =====================================================

-- 1. ACTIVER RLS SUR LA TABLE ORDERS
-- ===================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. POLITIQUE SIMPLE POUR LIRE TOUTES LES COMMANDES (DEBUG)
-- ==========================================================
-- Permet aux chauffeurs de voir toutes les commandes pour le debug
CREATE POLICY "drivers_can_view_all_orders" ON orders
FOR SELECT
TO authenticated
USING (true);

-- 3. POLITIQUE POUR LIRE LES COMMANDES DISPONIBLES
-- ================================================
-- Permet aux chauffeurs de voir les commandes programmées disponibles
CREATE POLICY "drivers_can_view_available_orders" ON orders
FOR SELECT
TO authenticated
USING (
  delivery_type = 'scheduled' 
  AND available_for_drivers = true 
  AND scheduled_delivery_window_start IS NOT NULL
);

-- 4. POLITIQUE POUR METTRE À JOUR LES COMMANDES
-- =============================================
-- Permet aux chauffeurs de mettre à jour les commandes (accepter)
CREATE POLICY "drivers_can_update_orders" ON orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. POLITIQUE POUR LIRE LES BUSINESS
-- ====================================
-- Permet aux chauffeurs de voir les informations des restaurants
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drivers_can_view_businesses" ON businesses
FOR SELECT
TO authenticated
USING (true);

-- 6. POLITIQUE POUR LIRE LES PROFILS UTILISATEURS
-- ===============================================
-- Permet aux chauffeurs de voir les informations des clients
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drivers_can_view_user_profiles" ON user_profiles
FOR SELECT
TO authenticated
USING (true);

-- 7. POLITIQUE POUR LIRE LES ITEMS DE COMMANDE
-- ============================================
-- Permet aux chauffeurs de voir les détails des commandes
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drivers_can_view_order_items" ON order_items
FOR SELECT
TO authenticated
USING (true);

-- 8. POLITIQUE SIMPLE POUR LES PROFILS CHAUFFEURS
-- ===============================================
-- Permet aux chauffeurs de lire et modifier leur propre profil
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drivers_can_view_driver_profiles" ON driver_profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "drivers_can_update_driver_profiles" ON driver_profiles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 9. POLITIQUE POUR LES COMMANDES ASSIGNÉES (DRIVER_ORDERS)
-- ========================================================
-- Permet aux chauffeurs de voir leurs commandes assignées
ALTER TABLE driver_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drivers_can_view_assigned_orders" ON driver_orders
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "drivers_can_update_assigned_orders" ON driver_orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 10. POLITIQUE POUR LES NOTIFICATIONS
-- ====================================
-- Permet aux chauffeurs de voir leurs notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drivers_can_view_notifications" ON notifications
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "drivers_can_update_notifications" ON notifications
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 11. VÉRIFIER LES POLITIQUES CRÉÉES
-- ===================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('orders', 'businesses', 'user_profiles', 'order_items', 'driver_profiles', 'driver_orders', 'notifications')
ORDER BY tablename, policyname;

-- 12. TESTER L'ACCÈS EN TANT QU'UTILISATEUR AUTHENTIFIÉ
-- =====================================================
-- Cette requête simule ce qu'un chauffeur authentifié verrait
SELECT 
  'Test accès chauffeur authentifié' as test,
  COUNT(*) as nombre_commandes_accessibles
FROM orders 
WHERE delivery_type = 'scheduled'
  AND available_for_drivers = true;

-- 13. TESTER L'ACCÈS AUX DONNÉES RÉELLES
-- ======================================
SELECT 
  id,
  delivery_type,
  status,
  available_for_drivers,
  scheduled_delivery_window_start,
  created_at
FROM orders 
WHERE delivery_type = 'scheduled'
  AND available_for_drivers = true
ORDER BY scheduled_delivery_window_start ASC
LIMIT 5;

-- 14. TESTER L'ACCÈS AUX BUSINESS
-- ===============================
SELECT 
  'Test accès business' as test,
  COUNT(*) as nombre_business
FROM businesses;

-- 15. TESTER L'ACCÈS AUX PROFILS UTILISATEURS
-- ===========================================
SELECT 
  'Test accès user_profiles' as test,
  COUNT(*) as nombre_profils
FROM user_profiles;

-- 16. TESTER L'ACCÈS AUX PROFILS CHAUFFEURS
-- =========================================
SELECT 
  'Test accès driver_profiles' as test,
  COUNT(*) as nombre_profils_chauffeurs
FROM driver_profiles;
