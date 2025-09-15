-- ============================================================================
-- SYSTÈME D'AVIS POUR LES LIVREURS - BraPrime
-- ============================================================================
-- Ce fichier contient le schéma complet pour la gestion des avis des livreurs
-- Inclut : tables, fonctions, triggers, RLS et index
-- ============================================================================

-- ============================================================================
-- 1. TABLE POUR STOCKER LES AVIS DES LIVREURS
-- ============================================================================

-- Table pour stocker les avis des livreurs
CREATE TABLE IF NOT EXISTS driver_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes d'unicité
    UNIQUE(order_id), -- Un avis par commande
    UNIQUE(driver_id, customer_id, order_id) -- Un avis par client par commande
);

-- ============================================================================
-- 2. AJOUT DES CHAMPS MANQUANTS À DRIVER_PROFILES
-- ============================================================================

-- Ajouter les champs manquants à driver_profiles
ALTER TABLE driver_profiles 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_deliveries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- ============================================================================
-- 3. INDEX POUR LES PERFORMANCES
-- ============================================================================

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_driver_reviews_driver_id ON driver_reviews(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_customer_id ON driver_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_order_id ON driver_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_rating ON driver_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_created_at ON driver_reviews(created_at);

-- Index pour driver_profiles
CREATE INDEX IF NOT EXISTS idx_driver_profiles_rating ON driver_profiles(rating);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_total_deliveries ON driver_profiles(total_deliveries);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_review_count ON driver_profiles(review_count);

-- ============================================================================
-- 4. FONCTIONS POUR LA GESTION DES AVIS
-- ============================================================================

-- Fonction pour calculer et mettre à jour les statistiques d'un livreur
CREATE OR REPLACE FUNCTION update_driver_stats(driver_uuid UUID)
RETURNS VOID AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    total_reviews INTEGER;
    total_delivered INTEGER;
BEGIN
    -- Calculer la note moyenne
    SELECT COALESCE(AVG(rating), 0.0) INTO avg_rating
    FROM driver_reviews 
    WHERE driver_id = driver_uuid;
    
    -- Compter le nombre d'avis
    SELECT COUNT(*) INTO total_reviews
    FROM driver_reviews 
    WHERE driver_id = driver_uuid;
    
    -- Compter les livraisons terminées
    SELECT COUNT(*) INTO total_delivered
    FROM orders 
    WHERE driver_id = driver_uuid AND status = 'delivered';
    
    -- Mettre à jour le profil du livreur
    UPDATE driver_profiles 
    SET 
        rating = avg_rating,
        review_count = total_reviews,
        total_deliveries = total_delivered,
        updated_at = NOW()
    WHERE id = driver_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer un avis sur un livreur
CREATE OR REPLACE FUNCTION create_driver_review(
    p_driver_id UUID,
    p_order_id UUID,
    p_customer_id UUID,
    p_rating INTEGER,
    p_comment TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    review_id UUID;
    result JSON;
BEGIN
    -- Vérifier que la commande appartient au client et au livreur
    IF NOT EXISTS (
        SELECT 1 FROM orders 
        WHERE id = p_order_id 
        AND user_id = p_customer_id 
        AND driver_id = p_driver_id
        AND status = 'delivered'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Commande non trouvée ou non livrée'
        );
    END IF;
    
    -- Vérifier qu'il n'y a pas déjà un avis pour cette commande
    IF EXISTS (
        SELECT 1 FROM driver_reviews 
        WHERE order_id = p_order_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Un avis existe déjà pour cette commande'
        );
    END IF;
    
    -- Créer l'avis
    INSERT INTO driver_reviews (driver_id, order_id, customer_id, rating, comment)
    VALUES (p_driver_id, p_order_id, p_customer_id, p_rating, p_comment)
    RETURNING id INTO review_id;
    
    -- Mettre à jour les statistiques du livreur
    PERFORM update_driver_stats(p_driver_id);
    
    -- Retourner le résultat
    RETURN json_build_object(
        'success', true,
        'review_id', review_id,
        'message', 'Avis créé avec succès'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Erreur lors de la création de l\'avis: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les avis d'un livreur
CREATE OR REPLACE FUNCTION get_driver_reviews(
    p_driver_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    reviews JSON;
    total_count INTEGER;
BEGIN
    -- Récupérer les avis avec une sous-requête pour éviter les problèmes de GROUP BY
    WITH reviews_data AS (
        SELECT 
            dr.id,
            dr.rating,
            dr.comment,
            dr.created_at,
            COALESCE(up.name, 'Client anonyme') as customer_name,
            dr.order_id
        FROM driver_reviews dr
        LEFT JOIN user_profiles up ON up.id = dr.customer_id
        WHERE dr.driver_id = p_driver_id
        ORDER BY dr.created_at DESC
        LIMIT p_limit OFFSET p_offset
    )
    SELECT json_agg(
        json_build_object(
            'id', id,
            'rating', rating,
            'comment', comment,
            'created_at', created_at,
            'customer_name', customer_name,
            'order_id', order_id
        )
    ) INTO reviews
    FROM reviews_data;
    
    -- Compter le total
    SELECT COUNT(*) INTO total_count
    FROM driver_reviews
    WHERE driver_id = p_driver_id;
    
    RETURN json_build_object(
        'success', true,
        'reviews', COALESCE(reviews, '[]'::json),
        'total_count', total_count,
        'average_rating', (
            SELECT COALESCE(AVG(rating), 0.0) 
            FROM driver_reviews 
            WHERE driver_id = p_driver_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les statistiques d'un livreur
CREATE OR REPLACE FUNCTION get_driver_review_stats(p_driver_id UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'driver_id', p_driver_id,
        'rating', COALESCE(dp.rating, 0.0),
        'total_deliveries', COALESCE(dp.total_deliveries, 0),
        'review_count', COALESCE(dp.review_count, 0),
        'rating_distribution', (
            SELECT json_build_object(
                '5_stars', COUNT(*) FILTER (WHERE rating = 5),
                '4_stars', COUNT(*) FILTER (WHERE rating = 4),
                '3_stars', COUNT(*) FILTER (WHERE rating = 3),
                '2_stars', COUNT(*) FILTER (WHERE rating = 2),
                '1_star', COUNT(*) FILTER (WHERE rating = 1)
            )
            FROM driver_reviews
            WHERE driver_id = p_driver_id
        )
    ) INTO stats
    FROM driver_profiles dp
    WHERE dp.id = p_driver_id;
    
    RETURN json_build_object(
        'success', true,
        'stats', stats
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. TRIGGERS POUR AUTOMATISER LES MISES À JOUR
-- ============================================================================

-- Trigger pour mettre à jour les stats quand un avis est ajouté
CREATE OR REPLACE FUNCTION trigger_update_driver_stats_on_review()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_driver_stats(NEW.driver_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS trigger_driver_review_insert ON driver_reviews;
DROP TRIGGER IF EXISTS trigger_driver_review_delete ON driver_reviews;

CREATE TRIGGER trigger_driver_review_insert
    AFTER INSERT ON driver_reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_driver_stats_on_review();

-- Trigger pour mettre à jour les stats quand un avis est supprimé
CREATE TRIGGER trigger_driver_review_delete
    AFTER DELETE ON driver_reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_driver_stats_on_review();

-- Trigger pour mettre à jour les stats quand le statut d'une commande change
CREATE OR REPLACE FUNCTION trigger_update_driver_stats_on_order_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la commande est livrée et qu'elle a un driver
    IF NEW.status = 'delivered' AND NEW.driver_id IS NOT NULL THEN
        PERFORM update_driver_stats(NEW.driver_id);
    END IF;
    
    -- Si le driver change
    IF OLD.driver_id IS DISTINCT FROM NEW.driver_id THEN
        IF OLD.driver_id IS NOT NULL THEN
            PERFORM update_driver_stats(OLD.driver_id);
        END IF;
        IF NEW.driver_id IS NOT NULL THEN
            PERFORM update_driver_stats(NEW.driver_id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS trigger_order_status_change ON orders;

CREATE TRIGGER trigger_order_status_change
    AFTER UPDATE OF status, driver_id ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_driver_stats_on_order_status();

-- ============================================================================
-- 6. RLS (Row Level Security) POUR LA SÉCURITÉ
-- ============================================================================

-- Activer RLS sur la table driver_reviews
ALTER TABLE driver_reviews ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes s'elles existent
DROP POLICY IF EXISTS "Customers can view their own reviews" ON driver_reviews;
DROP POLICY IF EXISTS "Customers can create reviews" ON driver_reviews;
DROP POLICY IF EXISTS "Customers can update their own reviews" ON driver_reviews;
DROP POLICY IF EXISTS "Customers can delete their own reviews" ON driver_reviews;
DROP POLICY IF EXISTS "Drivers can view their reviews" ON driver_reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON driver_reviews;
DROP POLICY IF EXISTS "Service role can manage all reviews" ON driver_reviews;

-- Politique : Les clients peuvent voir leurs propres avis
CREATE POLICY "Customers can view their own reviews" ON driver_reviews
    FOR SELECT USING (customer_id = auth.uid());

-- Politique : Les clients peuvent créer des avis
CREATE POLICY "Customers can create reviews" ON driver_reviews
    FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Politique : Les clients peuvent modifier leurs propres avis
CREATE POLICY "Customers can update their own reviews" ON driver_reviews
    FOR UPDATE USING (customer_id = auth.uid());

-- Politique : Les clients peuvent supprimer leurs propres avis
CREATE POLICY "Customers can delete their own reviews" ON driver_reviews
    FOR DELETE USING (customer_id = auth.uid());

-- Politique : Les livreurs peuvent voir les avis qui les concernent
CREATE POLICY "Drivers can view their reviews" ON driver_reviews
    FOR SELECT USING (driver_id = auth.uid());

-- Politique : Les admins peuvent tout faire
CREATE POLICY "Admins can manage all reviews" ON driver_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role_id IN (
                SELECT id FROM user_roles WHERE name = 'admin'
            )
        )
    );

-- Politique : Le service role peut tout faire
CREATE POLICY "Service role can manage all reviews" ON driver_reviews
    FOR ALL USING (true);

-- ============================================================================
-- 7. DONNÉES DE TEST (OPTIONNEL)
-- ============================================================================

-- Fonction pour créer des données de test
CREATE OR REPLACE FUNCTION create_test_driver_reviews()
RETURNS VOID AS $$
DECLARE
    test_driver_id UUID;
    test_customer_id UUID;
    test_order_id UUID;
BEGIN
    -- Récupérer un driver de test
    SELECT id INTO test_driver_id FROM driver_profiles LIMIT 1;
    
    -- Récupérer un client de test
    SELECT id INTO test_customer_id FROM user_profiles WHERE role_id = (
        SELECT id FROM user_roles WHERE name = 'customer'
    ) LIMIT 1;
    
    -- Récupérer une commande livrée de test
    SELECT id INTO test_order_id FROM orders 
    WHERE driver_id = test_driver_id 
    AND user_id = test_customer_id 
    AND status = 'delivered' 
    LIMIT 1;
    
    -- Créer des avis de test si les données existent
    IF test_driver_id IS NOT NULL AND test_customer_id IS NOT NULL AND test_order_id IS NOT NULL THEN
        -- Créer un avis de test
        PERFORM create_driver_review(
            test_driver_id,
            test_order_id,
            test_customer_id,
            5,
            'Excellent service, très ponctuel et professionnel !'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. COMMENTAIRES ET DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE driver_reviews IS 'Table pour stocker les avis des clients sur les livreurs';
COMMENT ON COLUMN driver_reviews.driver_id IS 'ID du livreur évalué';
COMMENT ON COLUMN driver_reviews.order_id IS 'ID de la commande liée à l''avis';
COMMENT ON COLUMN driver_reviews.customer_id IS 'ID du client qui a donné l''avis';
COMMENT ON COLUMN driver_reviews.rating IS 'Note de 1 à 5 étoiles';
COMMENT ON COLUMN driver_reviews.comment IS 'Commentaire optionnel du client';

COMMENT ON FUNCTION update_driver_stats IS 'Met à jour les statistiques d''un livreur (note moyenne, nombre d''avis, livraisons)';
COMMENT ON FUNCTION create_driver_review IS 'Crée un nouvel avis pour un livreur avec validation';
COMMENT ON FUNCTION get_driver_reviews IS 'Récupère les avis d''un livreur avec pagination';
COMMENT ON FUNCTION get_driver_review_stats IS 'Récupère les statistiques complètes d''un livreur';

-- ============================================================================
-- FIN DU SCHÉMA
-- ============================================================================
