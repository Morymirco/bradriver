-- ============================================================================
-- SCRIPT : AJOUT DE DONNÉES DE TEST POUR LES COMMANDES DE COLIS
-- ============================================================================
-- Ce script ajoute des commandes de colis de test pour tester l'application driver
-- ============================================================================

-- 1. Vérifier que la table package_orders existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'package_orders') THEN
    RAISE EXCEPTION 'La table package_orders n''existe pas. Veuillez d''abord exécuter le script de création.';
  END IF;
END $$;

-- 2. Insérer des commandes de test dans la table orders (commandes principales)
INSERT INTO orders (
  id,
  user_id,
  business_id,
  status,
  grand_total,
  delivery_fee,
  delivery_method,
  available_for_drivers,
  created_at,
  updated_at
) VALUES 
-- Commande de colis 1
(
  'c01ce20b-b90e-44dd-b4bb-5327f90bff32',
  (SELECT id FROM user_profiles WHERE email = 'client@test.com' LIMIT 1),
  (SELECT id FROM businesses WHERE name LIKE '%Colis%' LIMIT 1),
  'confirmed',
  15000,
  5000,
  'delivery',
  true,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
),
-- Commande de colis 2
(
  'd02df31c-c21f-55ee-c5cc-6438g01cgg43',
  (SELECT id FROM user_profiles WHERE email = 'client@test.com' LIMIT 1),
  (SELECT id FROM businesses WHERE name LIKE '%Colis%' LIMIT 1),
  'confirmed',
  20000,
  6000,
  'delivery',
  true,
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
),
-- Commande de colis 3
(
  'e03eg42d-d32g-66ff-d6dd-7549h12dhh54',
  (SELECT id FROM user_profiles WHERE email = 'client@test.com' LIMIT 1),
  (SELECT id FROM businesses WHERE name LIKE '%Colis%' LIMIT 1),
  'confirmed',
  12000,
  4000,
  'delivery',
  true,
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insérer les détails des commandes de colis
INSERT INTO package_orders (
  id,
  order_id,
  business_id,
  user_id,
  status,
  service_name,
  package_weight,
  package_dimensions,
  package_description,
  is_fragile,
  is_urgent,
  pickup_address,
  pickup_instructions,
  delivery_address,
  delivery_instructions,
  customer_name,
  customer_phone,
  customer_email,
  preferred_time,
  contact_method,
  service_price,
  estimated_delivery_time,
  created_at,
  updated_at
) VALUES 
-- Détails colis 1
(
  gen_random_uuid(),
  'c01ce20b-b90e-44dd-b4bb-5327f90bff32',
  (SELECT id FROM businesses WHERE name LIKE '%Colis%' LIMIT 1),
  (SELECT id FROM user_profiles WHERE email = 'client@test.com' LIMIT 1),
  'confirmed',
  'Colis Léger (- 5kg)',
  '3.5 kg',
  '30x20x15 cm',
  'Documents et petits objets',
  false,
  false,
  '123 Rue de la Paix, Conakry',
  'Sonner à l''interphone, 3ème étage',
  '456 Avenue de la Liberté, Conakry',
  'Remettre au gardien si absent',
  'Mamadou Diallo',
  '+224 123 456 789',
  'mamadou.diallo@email.com',
  '14:00-16:00',
  'phone',
  10000,
  NOW() + INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
),
-- Détails colis 2
(
  gen_random_uuid(),
  'd02df31c-c21f-55ee-c5cc-6438g01cgg43',
  (SELECT id FROM businesses WHERE name LIKE '%Colis%' LIMIT 1),
  (SELECT id FROM user_profiles WHERE email = 'client@test.com' LIMIT 1),
  'confirmed',
  'Colis Moyen (5-15kg)',
  '8.2 kg',
  '50x40x30 cm',
  'Appareil électronique fragile',
  true,
  true,
  '789 Boulevard du Commerce, Conakry',
  'Bureau 205, demander M. Camara',
  '321 Rue des Artisans, Conakry',
  'Appeler avant livraison',
  'Fatoumata Bah',
  '+224 987 654 321',
  'fatoumata.bah@email.com',
  '09:00-11:00',
  'phone',
  14000,
  NOW() + INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
),
-- Détails colis 3
(
  gen_random_uuid(),
  'e03eg42d-d32g-66ff-d6dd-7549h12dhh54',
  (SELECT id FROM businesses WHERE name LIKE '%Colis%' LIMIT 1),
  (SELECT id FROM user_profiles WHERE email = 'client@test.com' LIMIT 1),
  'confirmed',
  'Colis Lourd (15-30kg)',
  '18.5 kg',
  '80x60x40 cm',
  'Équipement industriel',
  false,
  false,
  '654 Zone Industrielle, Conakry',
  'Entrepôt B, quai de chargement',
  '147 Route Nationale, Conakry',
  'Usine principale, réception',
  'Ibrahima Keita',
  '+224 555 123 456',
  'ibrahima.keita@email.com',
  '16:00-18:00',
  'phone',
  8000,
  NOW() + INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes'
);

-- 4. Vérification des données insérées
SELECT 
  'COMMANDES DE COLIS CRÉÉES' as status,
  COUNT(*) as total_package_orders
FROM package_orders 
WHERE order_id IN (
  'c01ce20b-b90e-44dd-b4bb-5327f90bff32',
  'd02df31c-c21f-55ee-c5cc-6438g01cgg43',
  'e03eg42d-d32g-66ff-d6dd-7549h12dhh54'
);

-- 5. Afficher les détails des commandes créées
SELECT 
  po.id,
  po.order_id,
  po.service_name,
  po.status,
  po.package_weight as weight,
  po.package_dimensions as dimensions,
  po.is_fragile,
  po.is_urgent,
  po.customer_name,
  po.customer_phone,
  po.service_price,
  po.created_at
FROM package_orders po
WHERE po.order_id IN (
  'c01ce20b-b90e-44dd-b4bb-5327f90bff32',
  'd02df31c-c21f-55ee-c5cc-6438g01cgg43',
  'e03eg42d-d32g-66ff-d6dd-7549h12dhh54'
)
ORDER BY po.created_at DESC;

-- 6. Vérifier que les commandes sont disponibles pour les drivers
SELECT 
  'COMMANDES DISPONIBLES POUR DRIVERS' as status,
  o.id,
  o.status,
  o.available_for_drivers,
  o.driver_id,
  CASE 
    WHEN po.id IS NOT NULL THEN 'Commande de colis'
    ELSE 'Commande normale'
  END as order_type,
  COALESCE(po.service_name, 'N/A') as service_name
FROM orders o
LEFT JOIN package_orders po ON o.id = po.order_id
WHERE o.id IN (
  'c01ce20b-b90e-44dd-b4bb-5327f90bff32',
  'd02df31c-c21f-55ee-c5cc-6438g01cgg43',
  'e03eg42d-d32g-66ff-d6dd-7549h12dhh54'
)
ORDER BY o.created_at DESC;
