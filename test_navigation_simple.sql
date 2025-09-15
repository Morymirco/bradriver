-- Script simple pour tester la navigation
-- Vérifier d'abord la structure des tables

-- 1. Vérifier la structure de la table orders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('pickup_coordinates', 'delivery_coordinates', 'delivery_address');

-- 2. Vérifier s'il y a des commandes avec un driver_id
SELECT COUNT(*) as commandes_avec_driver 
FROM orders 
WHERE driver_id IS NOT NULL;

-- 3. Vérifier les données existantes
SELECT 
  o.id,
  o.order_number,
  o.pickup_coordinates,
  o.delivery_coordinates,
  o.delivery_address,
  o.driver_id,
  b.name as restaurant_name,
  b.address as restaurant_address
FROM orders o
LEFT JOIN businesses b ON o.business_id = b.id
WHERE o.driver_id IS NOT NULL
LIMIT 5;

-- 4. Ajouter des données de test si nécessaire
-- Mettre à jour une commande existante avec des coordonnées de test
UPDATE orders 
SET 
  pickup_coordinates = '{"latitude": 9.5370, "longitude": -13.6785}'::jsonb,
  delivery_coordinates = '{"latitude": 9.5450, "longitude": -13.6700}'::jsonb,
  delivery_address = '123 Rue de la Paix, Kaloum, Conakry'
WHERE id IN (
  SELECT o.id FROM orders o 
  WHERE o.driver_id IS NOT NULL 
  LIMIT 1
);

-- 5. Vérifier les données après mise à jour
SELECT 
  o.id,
  o.order_number,
  o.pickup_coordinates,
  o.delivery_coordinates,
  o.delivery_address,
  b.name as restaurant_name,
  b.address as restaurant_address
FROM orders o
LEFT JOIN businesses b ON o.business_id = b.id
WHERE o.driver_id IS NOT NULL
LIMIT 3;
