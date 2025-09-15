-- Script de test complet pour la navigation
-- Vérifier et configurer les données nécessaires

-- 1. Vérifier la structure des tables
SELECT '=== STRUCTURE DES TABLES ===' as info;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('pickup_coordinates', 'delivery_coordinates', 'delivery_address', 'driver_id', 'business_id', 'user_id');

-- 2. Vérifier les données existantes
SELECT '=== DONNÉES EXISTANTES ===' as info;

SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN driver_id IS NOT NULL THEN 1 END) as orders_with_driver,
  COUNT(CASE WHEN pickup_coordinates IS NOT NULL THEN 1 END) as orders_with_pickup_coords,
  COUNT(CASE WHEN delivery_coordinates IS NOT NULL THEN 1 END) as orders_with_delivery_coords
FROM orders;

-- 3. Vérifier les commandes avec driver_id
SELECT '=== COMMANDES AVEC DRIVER ===' as info;

SELECT 
  o.id,
  o.order_number,
  o.status,
  o.driver_id,
  o.pickup_coordinates,
  o.delivery_coordinates,
  o.delivery_address,
  b.name as restaurant_name,
  b.address as restaurant_address,
  u.name as client_name,
  u.phone_number as client_phone
FROM orders o
LEFT JOIN businesses b ON o.business_id = b.id
LEFT JOIN user_profiles u ON o.user_id = u.id
WHERE o.driver_id IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 5;

-- 4. Ajouter des données de test si nécessaire
SELECT '=== AJOUT DE DONNÉES DE TEST ===' as info;

-- Mettre à jour les coordonnées pour les commandes existantes
UPDATE orders 
SET 
  pickup_coordinates = '{"latitude": 9.5370, "longitude": -13.6785}'::jsonb,
  delivery_coordinates = '{"latitude": 9.5450, "longitude": -13.6700}'::jsonb,
  delivery_address = '123 Rue de la Paix, Kaloum, Conakry'
WHERE id IN (
  SELECT o.id FROM orders o 
  WHERE o.driver_id IS NOT NULL 
  AND (o.pickup_coordinates IS NULL OR o.delivery_coordinates IS NULL)
  LIMIT 1
);

-- Mettre à jour les adresses des restaurants
UPDATE businesses 
SET 
  address = '15 Rue du Commerce, Centre-ville, Conakry'
WHERE id IN (
  SELECT DISTINCT business_id FROM orders 
  WHERE driver_id IS NOT NULL 
  AND business_id IS NOT NULL
  LIMIT 1
);

-- 5. Vérifier les données après mise à jour
SELECT '=== DONNÉES APRÈS MISE À JOUR ===' as info;

SELECT 
  o.id,
  o.order_number,
  o.status,
  o.pickup_coordinates,
  o.delivery_coordinates,
  o.delivery_address,
  b.name as restaurant_name,
  b.address as restaurant_address,
  u.name as client_name
FROM orders o
LEFT JOIN businesses b ON o.business_id = b.id
LEFT JOIN user_profiles u ON o.user_id = u.id
WHERE o.driver_id IS NOT NULL
  AND o.pickup_coordinates IS NOT NULL
  AND o.delivery_coordinates IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 3;

-- 6. Test de requête pour l'application
SELECT '=== REQUÊTE POUR L\'APPLICATION ===' as info;

-- Simuler la requête utilisée par NavigationService
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.delivery_address,
  o.pickup_coordinates,
  o.delivery_coordinates,
  o.estimated_delivery_time,
  o.client_id,
  o.business_id,
  u.first_name,
  u.last_name,
  u.phone_number,
  b.name,
  b.address,
  b.phone
FROM orders o
LEFT JOIN user_profiles u ON o.user_id = u.id
LEFT JOIN businesses b ON o.business_id = b.id
WHERE o.id = (
  SELECT o2.id FROM orders o2 
  WHERE o2.driver_id IS NOT NULL 
  AND o2.pickup_coordinates IS NOT NULL
  LIMIT 1
);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '=== TEST DE NAVIGATION TERMINÉ ===';
  RAISE NOTICE 'Vérifiez les résultats ci-dessus pour vous assurer que:';
  RAISE NOTICE '1. Les colonnes existent dans la table orders';
  RAISE NOTICE '2. Il y a des commandes avec driver_id';
  RAISE NOTICE '3. Les coordonnées sont au format JSONB valide';
  RAISE NOTICE '4. Les adresses sont renseignées';
END $$;
