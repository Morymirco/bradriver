-- =====================================================
-- SCHÉMA SUPABASE POUR BRAPRIME DRIVER APP
-- =====================================================

-- Extension pour les UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES PRINCIPALES
-- =====================================================

-- Table des chauffeurs
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    avatar_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_deliveries INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des restaurants
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    rating DECIMAL(3,2) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT true,
    coordinates POINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    coordinates POINT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des commandes
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    pickup_coordinates POINT,
    delivery_coordinates POINT,
    estimated_pickup_time TIMESTAMP WITH TIME ZONE,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_pickup_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'card',
    payment_status VARCHAR(50) DEFAULT 'pending',
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des éléments de commande
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des offres de livraison
CREATE TABLE delivery_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, expired
    offered_amount DECIMAL(10,2) NOT NULL,
    estimated_duration INTEGER, -- en minutes
    estimated_distance DECIMAL(8,2), -- en km
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des statuts de commande
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    description TEXT,
    created_by UUID, -- driver_id ou restaurant_id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des documents des chauffeurs
CREATE TABLE driver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- license, registration, insurance, etc.
    document_number VARCHAR(100),
    file_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    expiry_date DATE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paiements
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- delivery_fee, tip, bonus
    status VARCHAR(50) DEFAULT 'pending',
    stripe_payment_intent_id VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- driver_id, client_id, ou restaurant_id
    user_type VARCHAR(20) NOT NULL, -- driver, client, restaurant
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- order_update, offer, payment, etc.
    is_read BOOLEAN DEFAULT false,
    data JSONB, -- données supplémentaires
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sessions de travail
CREATE TABLE work_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    total_earnings DECIMAL(10,2) DEFAULT 0.0,
    total_deliveries INTEGER DEFAULT 0,
    total_distance DECIMAL(8,2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'active', -- active, completed, paused
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index pour les recherches fréquentes
CREATE INDEX idx_drivers_email ON drivers(email);
CREATE INDEX idx_drivers_available ON drivers(is_available) WHERE is_available = true;
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_driver ON orders(driver_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_delivery_offers_status ON delivery_offers(status);
CREATE INDEX idx_delivery_offers_driver ON delivery_offers(driver_id);
CREATE INDEX idx_delivery_offers_expires ON delivery_offers(expires_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, user_type);
CREATE INDEX idx_notifications_read ON notifications(is_read) WHERE is_read = false;

-- Index pour les recherches géospatiales
CREATE INDEX idx_restaurants_coordinates ON restaurants USING GIST(coordinates);
CREATE INDEX idx_clients_coordinates ON clients USING GIST(coordinates);
CREATE INDEX idx_orders_pickup_coordinates ON orders USING GIST(pickup_coordinates);
CREATE INDEX idx_orders_delivery_coordinates ON orders USING GIST(delivery_coordinates);

-- =====================================================
-- FONCTIONS ET TRIGGERS
-- =====================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_offers_updated_at BEFORE UPDATE ON delivery_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_documents_updated_at BEFORE UPDATE ON driver_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_sessions_updated_at BEFORE UPDATE ON work_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer automatiquement le numéro de commande
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'CMD-' || LPAD(CAST(nextval('order_number_seq') AS TEXT), 6, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Séquence pour les numéros de commande
CREATE SEQUENCE order_number_seq START 1;

-- Trigger pour générer automatiquement le numéro de commande
CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Fonction pour mettre à jour les statistiques du chauffeur
CREATE OR REPLACE FUNCTION update_driver_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        UPDATE drivers 
        SET 
            total_deliveries = total_deliveries + 1,
            total_earnings = total_earnings + COALESCE(NEW.delivery_fee, 0)
        WHERE id = NEW.driver_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour les statistiques
CREATE TRIGGER update_driver_stats_trigger AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_driver_stats();

-- =====================================================
-- POLITIQUES RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques pour les chauffeurs
CREATE POLICY "Drivers can view own profile" ON drivers FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Drivers can update own profile" ON drivers FOR UPDATE USING (auth.uid()::text = id::text);

-- Politiques pour les commandes
CREATE POLICY "Drivers can view assigned orders" ON orders FOR SELECT USING (driver_id::text = auth.uid()::text);
CREATE POLICY "Drivers can update assigned orders" ON orders FOR UPDATE USING (driver_id::text = auth.uid()::text);

-- Politiques pour les offres de livraison
CREATE POLICY "Drivers can view available offers" ON delivery_offers FOR SELECT USING (status = 'pending');
CREATE POLICY "Drivers can accept offers" ON delivery_offers FOR UPDATE USING (driver_id::text = auth.uid()::text);

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue pour les commandes avec toutes les informations
CREATE VIEW orders_with_details AS
SELECT 
    o.*,
    r.name as restaurant_name,
    r.address as restaurant_address,
    r.phone as restaurant_phone,
    c.first_name as client_first_name,
    c.last_name as client_last_name,
    c.phone as client_phone,
    c.email as client_email,
    d.first_name as driver_first_name,
    d.last_name as driver_last_name,
    d.phone as driver_phone
FROM orders o
LEFT JOIN restaurants r ON o.restaurant_id = r.id
LEFT JOIN clients c ON o.client_id = c.id
LEFT JOIN drivers d ON o.driver_id = d.id;

-- Vue pour les statistiques des chauffeurs
CREATE VIEW driver_statistics AS
SELECT 
    d.id,
    d.first_name,
    d.last_name,
    d.email,
    d.rating,
    d.total_deliveries,
    d.total_earnings,
    COUNT(o.id) as current_month_deliveries,
    SUM(o.delivery_fee) as current_month_earnings
FROM drivers d
LEFT JOIN orders o ON d.id = o.driver_id 
    AND o.status = 'delivered' 
    AND o.created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY d.id, d.first_name, d.last_name, d.email, d.rating, d.total_deliveries, d.total_earnings;

-- =====================================================
-- DONNÉES D'EXEMPLE
-- =====================================================

-- Insérer un chauffeur de test
INSERT INTO drivers (email, password_hash, first_name, last_name, phone, is_verified, rating, total_deliveries, total_earnings) 
VALUES (
    'chauffeur@braprime.com',
    '$2a$10$example_hash', -- À remplacer par un vrai hash
    'Ibrahim',
    'Diallo',
    '+33 6 12 34 56 78',
    true,
    4.8,
    150,
    2450.00
);

-- Insérer des restaurants de test
INSERT INTO restaurants (name, address, phone, rating) VALUES
('Pizza Bella', '123 Rue de la Paix, 75001 Paris', '+33 1 42 34 56 78', 4.5),
('Sushi Zen', '456 Avenue des Champs, 75008 Paris', '+33 1 45 67 89 01', 4.7),
('Burger House', '789 Boulevard Saint-Germain, 75006 Paris', '+33 1 23 45 67 89', 4.3),
('Le Bistrot', '321 Rue du Commerce, 75015 Paris', '+33 1 98 76 54 32', 4.6);

-- Insérer des clients de test
INSERT INTO clients (email, first_name, last_name, phone, address) VALUES
('marie.dupont@email.com', 'Marie', 'Dupont', '+33 6 12 34 56 78', '456 Avenue des Champs, 75008 Paris'),
('jean.martin@email.com', 'Jean', 'Martin', '+33 6 98 76 54 32', '789 Boulevard Saint-Germain, 75006 Paris');

-- =====================================================
-- COMMENTAIRES FINAUX
-- =====================================================

/*
Ce schéma Supabase est conçu pour l'application BraPrime Driver et inclut :

1. **Gestion des utilisateurs** : Chauffeurs, restaurants, clients
2. **Gestion des commandes** : Commandes complètes avec statuts
3. **Système d'offres** : Offres de livraison pour les chauffeurs
4. **Gestion des paiements** : Suivi des paiements et commissions
5. **Documents** : Gestion des documents des chauffeurs
6. **Notifications** : Système de notifications en temps réel
7. **Statistiques** : Suivi des performances des chauffeurs
8. **Sécurité** : RLS (Row Level Security) pour la protection des données
9. **Performance** : Index optimisés pour les requêtes fréquentes
10. **Géolocalisation** : Support des coordonnées GPS

Pour utiliser ce schéma :
1. Créez un projet Supabase
2. Exécutez ce script SQL dans l'éditeur SQL
3. Configurez l'authentification Supabase dans votre app React Native
4. Utilisez les politiques RLS pour sécuriser les données
*/ 