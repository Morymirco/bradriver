-- =====================================================
-- SCRIPT DE TEST POUR LES OFFRES (COMMANDES PROGRAMMÉES)
-- À exécuter dans l'éditeur SQL de Supabase
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
ORDER BY ordinal_position;

-- 2. COMPTER TOUTES LES COMMANDES
-- ===============================
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN delivery_type = 'scheduled' THEN 1 END) as scheduled_orders,
  COUNT(CASE WHEN delivery_type = 'asap' THEN 1 END) as asap_orders,
  COUNT(CASE WHEN available_for_drivers = true THEN 1 END) as available_for_drivers,
  COUNT(CASE WHEN driver_id IS NULL THEN 1 END) as unassigned_orders
FROM orders;

-- 3. ANALYSER LES COMMANDES PROGRAMMÉES
-- =====================================
SELECT 
  id,
  delivery_type,
  status,
  available_for_drivers,
  driver_id,
  scheduled_delivery_window_start,
  scheduled_delivery_window_end,
  business_id,
  grand_total,
  created_at
FROM orders 
WHERE delivery_type = 'scheduled'
ORDER BY created_at DESC
LIMIT 10;

-- 4. COMMANDES PROGRAMMÉES DISPONIBLES POUR LES CHAUFFEURS
-- ========================================================
SELECT 
  o.id,
  o.delivery_type,
  o.status,
  o.available_for_drivers,
  o.driver_id,
  o.scheduled_delivery_window_start,
  o.scheduled_delivery_window_end,
  o.business_id,
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
ORDER BY o.scheduled_delivery_window_start ASC;

-- 5. COMMANDES AVEC DÉTAILS COMPLETS (SIMILAIRE À LA REQUÊTE DE L'APP)
-- ===================================================================
SELECT 
  o.id,
  o.business_id,
  o.user_id,
  o.status,
  o.grand_total,
  o.delivery_fee,
  o.delivery_address,
  o.pickup_coordinates,
  o.delivery_coordinates,
  o.delivery_type,
  o.scheduled_delivery_window_start,
  o.scheduled_delivery_window_end,
  o.available_for_drivers,
  o.created_at,
  b.name as business_name,
  b.address as business_address,
  u.name as customer_name,
  u.phone_number as customer_phone
FROM orders o
LEFT JOIN businesses b ON o.business_id = b.id
LEFT JOIN user_profiles u ON o.user_id = u.id
WHERE o.delivery_type = 'scheduled'
  AND o.available_for_drivers = true
  AND o.driver_id IS NULL
ORDER BY o.scheduled_delivery_window_start ASC
LIMIT 5;

-- 6. VÉRIFIER LES ITEMS DES COMMANDES
-- ===================================
SELECT 
  oi.id,
  oi.order_id,
  oi.name,
  oi.quantity,
  oi.price,
  o.delivery_type,
  o.status
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.delivery_type = 'scheduled'
  AND o.available_for_drivers = true
  AND o.driver_id IS NULL
LIMIT 10;

-- 7. CRÉER DES DONNÉES DE TEST SI AUCUNE COMMANDE PROGRAMMÉE N'EXISTE
-- ===================================================================
-- Décommentez cette section si vous voulez créer des données de test

/*
-- Insérer un business de test
INSERT INTO businesses (name, address, is_active) 
VALUES ('Restaurant Test', '123 Rue Test, Conakry', true)
ON CONFLICT DO NOTHING;

-- Insérer un utilisateur de test
INSERT INTO user_profiles (name, email, phone_number) 
VALUES ('Client Test', 'client@test.com', '+224123456789')
ON CONFLICT DO NOTHING;

-- Insérer une commande programmée de test
INSERT INTO orders (
  user_id,
  business_id,
  status,
  total,
  grand_total,
  delivery_fee,
  delivery_address,
  delivery_type,
  available_for_drivers,
  scheduled_delivery_window_start,
  scheduled_delivery_window_end
) 
SELECT 
  up.id,
  b.id,
  'pending',
  5000,
  5500,
  500,
  '456 Rue Livraison, Conakry',
  'scheduled',
  true,
  NOW() + INTERVAL '2 hours',
  NOW() + INTERVAL '3 hours'
FROM user_profiles up, businesses b
WHERE up.email = 'client@test.com' 
  AND b.name = 'Restaurant Test'
LIMIT 1;

-- Insérer des items pour la commande de test
INSERT INTO order_items (order_id, name, price, quantity)
SELECT 
  o.id,
  'Pizza Margherita',
  2500,
  2
FROM orders o
JOIN user_profiles up ON o.user_id = up.id
WHERE up.email = 'client@test.com'
  AND o.delivery_type = 'scheduled'
LIMIT 1;
*/

-- 8. DIAGNOSTIC FINAL - RÉSUMÉ DES PROBLÈMES POTENTIELS
-- =====================================================
SELECT 
  'DIAGNOSTIC DES OFFRES' as diagnostic,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN delivery_type = 'scheduled' THEN 1 END) as scheduled_orders,
  COUNT(CASE WHEN delivery_type = 'scheduled' AND available_for_drivers = true THEN 1 END) as available_scheduled,
  COUNT(CASE WHEN delivery_type = 'scheduled' AND available_for_drivers = true AND driver_id IS NULL THEN 1 END) as unassigned_available,
  COUNT(CASE WHEN delivery_type = 'scheduled' AND available_for_drivers = true AND driver_id IS NULL AND scheduled_delivery_window_start IS NOT NULL THEN 1 END) as final_offers
FROM orders;

-- 9. VÉRIFIER LES PERMISSIONS RLS (Row Level Security)
-- ===================================================
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
WHERE tablename = 'orders';

-- 10. COMMANDES PROGRAMMÉES AVEC FENÊTRES DE LIVRAISON FUTURES
-- ============================================================
SELECT 
  o.id,
  o.delivery_type,
  o.status,
  o.available_for_drivers,
  o.scheduled_delivery_window_start,
  o.scheduled_delivery_window_end,
  b.name as business_name,
  u.name as customer_name,
  o.grand_total,
  CASE 
    WHEN o.scheduled_delivery_window_start > NOW() THEN 'FUTURE'
    WHEN o.scheduled_delivery_window_start <= NOW() AND o.scheduled_delivery_window_end >= NOW() THEN 'EN_COURS'
    ELSE 'PASSÉE'
  END as window_status
FROM orders o
LEFT JOIN businesses b ON o.business_id = b.id
LEFT JOIN user_profiles u ON o.user_id = u.id
WHERE o.delivery_type = 'scheduled'
  AND o.available_for_drivers = true
  AND o.driver_id IS NULL
  AND o.scheduled_delivery_window_start IS NOT NULL
ORDER BY o.scheduled_delivery_window_start ASC;
