-- =====================================================
-- CORRECTION DE LA RÉCURSION INFINIE DANS LES POLITIQUES RLS
-- =====================================================

-- 1. SUPPRIMER TOUTES LES POLITIQUES EXISTANTES
-- =============================================
DROP POLICY IF EXISTS "drivers_can_view_available_orders" ON orders;
DROP POLICY IF EXISTS "drivers_can_view_all_orders" ON orders;
DROP POLICY IF EXISTS "drivers_can_update_orders" ON orders;
DROP POLICY IF EXISTS "drivers_can_view_businesses" ON businesses;
DROP POLICY IF EXISTS "drivers_can_view_user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "drivers_can_view_order_items" ON order_items;
DROP POLICY IF EXISTS "drivers_can_view_driver_profiles" ON driver_profiles;
DROP POLICY IF EXISTS "drivers_can_update_driver_profiles" ON driver_profiles;
DROP POLICY IF EXISTS "drivers_can_view_assigned_orders" ON driver_orders;
DROP POLICY IF EXISTS "drivers_can_update_assigned_orders" ON driver_orders;
DROP POLICY IF EXISTS "drivers_can_view_notifications" ON notifications;
DROP POLICY IF EXISTS "drivers_can_update_notifications" ON notifications;

-- 2. DÉSACTIVER RLS TEMPORAIREMENT POUR ÉVITER LA RÉCURSION
-- =========================================================
-- Désactiver RLS sur les tables qui causent des problèmes
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE driver_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 3. APPLIQUER RLS SEULEMENT SUR LA TABLE ORDERS
-- ==============================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Politique simple pour les commandes
CREATE POLICY "drivers_can_view_orders" ON orders
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "drivers_can_update_orders" ON orders
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- 4. VÉRIFIER LES POLITIQUES CRÉÉES
-- =================================
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

-- 5. VÉRIFIER LE STATUT RLS DES TABLES
-- ====================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('orders', 'businesses', 'user_profiles', 'order_items', 'driver_profiles', 'driver_orders', 'notifications')
  AND schemaname = 'public'
ORDER BY tablename;

-- 6. TESTER L'ACCÈS AUX DONNÉES
-- =============================
-- Test 1: Voir toutes les commandes
SELECT 
  'Test 1 - Toutes les commandes' as test,
  COUNT(*) as nombre_commandes
FROM orders;

-- Test 2: Voir les commandes programmées disponibles
SELECT 
  'Test 2 - Commandes programmées disponibles' as test,
  COUNT(*) as nombre_commandes_disponibles
FROM orders 
WHERE delivery_type = 'scheduled'
  AND available_for_drivers = true
  AND scheduled_delivery_window_start IS NOT NULL;

-- Test 3: Voir les détails des commandes disponibles
SELECT 
  id,
  delivery_type,
  status,
  available_for_drivers,
  scheduled_delivery_window_start,
  grand_total,
  created_at
FROM orders 
WHERE delivery_type = 'scheduled'
  AND available_for_drivers = true
  AND scheduled_delivery_window_start IS NOT NULL
ORDER BY scheduled_delivery_window_start ASC
LIMIT 5;

-- Test 4: Voir les business (sans RLS)
SELECT 
  'Test 4 - Business' as test,
  COUNT(*) as nombre_business
FROM businesses;

-- Test 5: Voir les profils utilisateurs (sans RLS)
SELECT 
  'Test 5 - Profils utilisateurs' as test,
  COUNT(*) as nombre_profils
FROM user_profiles;

-- Test 6: Voir les profils chauffeurs (sans RLS)
SELECT 
  'Test 6 - Profils chauffeurs' as test,
  COUNT(*) as nombre_profils_chauffeurs
FROM driver_profiles;

-- Test 7: Voir les commandes assignées (sans RLS)
SELECT 
  'Test 7 - Commandes assignées' as test,
  COUNT(*) as nombre_commandes_assignees
FROM driver_orders;

-- Test 8: Voir les notifications (sans RLS)
SELECT 
  'Test 8 - Notifications' as test,
  COUNT(*) as nombre_notifications
FROM notifications;

-- 7. TESTER LES JOINS
-- ===================
-- Test avec join business et user_profiles (sans RLS)
SELECT 
  o.id,
  o.delivery_type,
  o.status,
  o.available_for_drivers,
  o.scheduled_delivery_window_start,
  b.name as business_name,
  u.name as customer_name,
  o.grand_total
FROM orders o
LEFT JOIN businesses b ON o.business_id = b.id
LEFT JOIN user_profiles u ON o.user_id = u.id
WHERE o.delivery_type = 'scheduled'
  AND o.available_for_drivers = true
  AND o.scheduled_delivery_window_start IS NOT NULL
ORDER BY o.scheduled_delivery_window_start ASC
LIMIT 3;

-- 8. MESSAGE DE SUCCÈS
-- ====================
SELECT 
  '✅ RÉCURSION RLS CORRIGÉE' as message,
  'RLS désactivé sur les tables problématiques, activé seulement sur orders' as details;
