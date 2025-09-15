-- Script pour ajouter des données de test pour la navigation avec le nouveau schéma
-- Utilise les nouvelles colonnes: delivery_latitude, delivery_longitude, delivery_formatted_address, etc.

-- Coordonnées pour l'adresse fournie: J99X+85G, Rte le prince, Conakry, Guinée
-- Cette adresse correspond approximativement à: 9.5370, -13.6785

-- 1. Mettre à jour les coordonnées de livraison pour les commandes existantes
UPDATE orders 
SET 
  delivery_latitude = 9.5370,
  delivery_longitude = -13.6785,
  delivery_formatted_address = 'J99X+85G, Rte le prince, Conakry, Guinée',
  delivery_address = 'J99X+85G, Rte le prince, Conakry, Guinée'
WHERE id IN (
  SELECT o.id FROM orders o 
  WHERE o.driver_id IS NOT NULL 
  LIMIT 1
);

-- 2. Mettre à jour les coordonnées de pickup (restaurant) pour la même commande
UPDATE orders 
SET 
  pickup_latitude = 9.5450,
  pickup_longitude = -13.6700,
  pickup_formatted_address = '15 Rue du Commerce, Centre-ville, Conakry, Guinée'
WHERE id IN (
  SELECT o.id FROM orders o 
  WHERE o.driver_id IS NOT NULL 
  LIMIT 1
);

-- 3. Mettre à jour une deuxième commande avec des coordonnées différentes
UPDATE orders 
SET 
  delivery_latitude = 9.5500,
  delivery_longitude = -13.6800,
  delivery_formatted_address = '456 Avenue des Champs, Ratoma, Conakry, Guinée',
  delivery_address = '456 Avenue des Champs, Ratoma, Conakry, Guinée',
  pickup_latitude = 9.5400,
  pickup_longitude = -13.6700,
  pickup_formatted_address = '25 Avenue de la République, Almamya, Conakry, Guinée'
WHERE id IN (
  SELECT o.id FROM orders o 
  WHERE o.driver_id IS NOT NULL 
  LIMIT 1 OFFSET 1
);

-- 4. Mettre à jour une troisième commande
UPDATE orders 
SET 
  delivery_latitude = 9.5300,
  delivery_longitude = -13.6600,
  delivery_formatted_address = '789 Boulevard de la République, Matam, Conakry, Guinée',
  delivery_address = '789 Boulevard de la République, Matam, Conakry, Guinée',
  pickup_latitude = 9.5350,
  pickup_longitude = -13.6750,
  pickup_formatted_address = '8 Boulevard de la Paix, Dixinn, Conakry, Guinée'
WHERE id IN (
  SELECT o.id FROM orders o 
  WHERE o.driver_id IS NOT NULL 
  LIMIT 1 OFFSET 2
);

-- 5. Vérifier les données mises à jour
SELECT 
  o.id,
  o.order_number,
  o.delivery_latitude,
  o.delivery_longitude,
  o.delivery_formatted_address,
  o.delivery_address,
  o.pickup_latitude,
  o.pickup_longitude,
  o.pickup_formatted_address,
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

-- 6. Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Données de navigation de test ajoutées avec succès!';
  RAISE NOTICE 'Adresse de test utilisée: J99X+85G, Rte le prince, Conakry, Guinée';
  RAISE NOTICE 'Vous pouvez maintenant tester la navigation dynamique dans l''application.';
END $$;
