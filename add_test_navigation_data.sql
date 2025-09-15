-- Script pour ajouter des données de test pour la navigation
-- Ce script ajoute des coordonnées GPS et des adresses de test aux commandes existantes

-- Mettre à jour les coordonnées de pickup (restaurant) et delivery (client) pour les commandes existantes
-- Coordonnées pour Conakry, Guinée

-- Commande 1: Restaurant au centre-ville vers client à Kaloum
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

-- Commande 2: Restaurant à Almamya vers client à Ratoma
UPDATE orders 
SET 
  pickup_coordinates = '{"latitude": 9.5500, "longitude": -13.6800}'::jsonb,
  delivery_coordinates = '{"latitude": 9.5600, "longitude": -13.6900}'::jsonb,
  delivery_address = '456 Avenue des Champs, Ratoma, Conakry'
WHERE id IN (
  SELECT o.id FROM orders o 
  WHERE o.driver_id IS NOT NULL 
  LIMIT 1 OFFSET 1
);

-- Commande 3: Restaurant à Dixinn vers client à Matam
UPDATE orders 
SET 
  pickup_coordinates = '{"latitude": 9.5400, "longitude": -13.6700}'::jsonb,
  delivery_coordinates = '{"latitude": 9.5300, "longitude": -13.6600}'::jsonb,
  delivery_address = '789 Boulevard de la République, Matam, Conakry'
WHERE id IN (
  SELECT o.id FROM orders o 
  WHERE o.driver_id IS NOT NULL 
  LIMIT 1 OFFSET 2
);

-- Mettre à jour les adresses des restaurants dans la table businesses
UPDATE businesses 
SET 
  address = '15 Rue du Commerce, Centre-ville, Conakry'
WHERE id IN (
  SELECT DISTINCT business_id FROM orders 
  WHERE driver_id IS NOT NULL 
  LIMIT 1
);

UPDATE businesses 
SET 
  address = '25 Avenue de la République, Almamya, Conakry'
WHERE id IN (
  SELECT DISTINCT business_id FROM orders 
  WHERE driver_id IS NOT NULL 
  LIMIT 1 OFFSET 1
);

UPDATE businesses 
SET 
  address = '8 Boulevard de la Paix, Dixinn, Conakry'
WHERE id IN (
  SELECT DISTINCT business_id FROM orders 
  WHERE driver_id IS NOT NULL 
  LIMIT 1 OFFSET 2
);

-- Vérifier les données mises à jour
SELECT 
  o.id,
  o.order_number,
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

-- Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Données de navigation de test ajoutées avec succès!';
  RAISE NOTICE 'Vous pouvez maintenant tester la navigation dynamique dans l''application.';
END $$;
