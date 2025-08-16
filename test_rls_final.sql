-- =====================================================
-- TEST FINAL DES POLITIQUES RLS POUR LES CHAUFFEURS
-- =====================================================

-- 1. SUPPRIMER LES ANCIENNES POLITIQUES SI ELLES EXISTENT
-- =====================================================
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

-- 2. APPLIQUER LES POLITIQUES SIMPLIFIÉES
-- =======================================
-- Activer RLS sur toutes les tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques pour orders
CREATE POLICY "drivers_can_view_all_orders" ON orders
FOR SELECT TO authenticated USING (true);

CREATE POLICY "drivers_can_view_available_orders" ON orders
FOR SELECT TO authenticated
USING (
  delivery_type = 'scheduled' 
  AND available_for_drivers = true 
  AND scheduled_delivery_window_start IS NOT NULL
);

CREATE POLICY "drivers_can_update_orders" ON orders
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Politiques pour businesses
CREATE POLICY "drivers_can_view_businesses" ON businesses
FOR SELECT TO authenticated USING (true);

-- Politiques pour user_profiles
CREATE POLICY "drivers_can_view_user_profiles" ON user_profiles
FOR SELECT TO authenticated USING (true);

-- Politiques pour order_items
CREATE POLICY "drivers_can_view_order_items" ON order_items
FOR SELECT TO authenticated USING (true);

-- Politiques pour driver_profiles
CREATE POLICY "drivers_can_view_driver_profiles" ON driver_profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "drivers_can_update_driver_profiles" ON driver_profiles
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Politiques pour driver_orders
CREATE POLICY "drivers_can_view_assigned_orders" ON driver_orders
FOR SELECT TO authenticated USING (true);

CREATE POLICY "drivers_can_update_assigned_orders" ON driver_orders
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Politiques pour notifications
CREATE POLICY "drivers_can_view_notifications" ON notifications
FOR SELECT TO authenticated USING (true);

CREATE POLICY "drivers_can_update_notifications" ON notifications
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 3. VÉRIFIER LES POLITIQUES CRÉÉES
-- =================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('orders', 'businesses', 'user_profiles', 'order_items', 'driver_profiles', 'driver_orders', 'notifications')
ORDER BY tablename, policyname;

-- 4. TESTER L'ACCÈS AUX DONNÉES
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

-- Test 4: Voir les business
SELECT 
  'Test 4 - Business' as test,
  COUNT(*) as nombre_business
FROM businesses;

-- Test 5: Voir les profils utilisateurs
SELECT 
  'Test 5 - Profils utilisateurs' as test,
  COUNT(*) as nombre_profils
FROM user_profiles;

-- Test 6: Voir les profils chauffeurs
SELECT 
  'Test 6 - Profils chauffeurs' as test,
  COUNT(*) as nombre_profils_chauffeurs
FROM driver_profiles;

-- Test 7: Voir les commandes assignées
SELECT 
  'Test 7 - Commandes assignées' as test,
  COUNT(*) as nombre_commandes_assignees
FROM driver_orders;

-- Test 8: Voir les notifications
SELECT 
  'Test 8 - Notifications' as test,
  COUNT(*) as nombre_notifications
FROM notifications;

-- 5. TESTER LES JOINS
-- ===================
-- Test avec join business et user_profiles
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

-- 6. MESSAGE DE SUCCÈS
-- ====================
SELECT 
  '✅ POLITIQUES RLS APPLIQUÉES AVEC SUCCÈS' as message,
  'Les chauffeurs peuvent maintenant accéder aux données' as details;
