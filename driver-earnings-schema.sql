-- ============================================================================
-- SCHÉMA POUR LA GESTION DES GAINS DES DRIVERS
-- ============================================================================
-- Ce script crée les tables et fonctions nécessaires pour gérer les gains des drivers
-- avec un historique complet pour les statistiques

-- 1. Table pour l'historique des gains des drivers
CREATE TABLE IF NOT EXISTS public.driver_earnings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  driver_id uuid NOT NULL,
  order_id uuid NOT NULL,
  delivery_fee integer NOT NULL,
  driver_earnings integer NOT NULL, -- 40% des frais de livraison
  earnings_percentage numeric DEFAULT 0.40, -- Pourcentage des gains (configurable)
  status character varying DEFAULT 'pending'::character varying CHECK (status = ANY (ARRAY['pending'::character varying, 'confirmed'::character varying, 'paid'::character varying, 'cancelled'::character varying])),
  payment_date timestamp with time zone,
  payment_method character varying,
  payment_reference character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT driver_earnings_pkey PRIMARY KEY (id),
  CONSTRAINT driver_earnings_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.driver_profiles(id),
  CONSTRAINT driver_earnings_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);

-- 2. Table pour les statistiques mensuelles des drivers
CREATE TABLE IF NOT EXISTS public.driver_monthly_stats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  driver_id uuid NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  total_orders integer DEFAULT 0,
  total_delivery_fees integer DEFAULT 0,
  total_earnings integer DEFAULT 0,
  average_earnings_per_order numeric DEFAULT 0,
  best_day date,
  best_day_earnings integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT driver_monthly_stats_pkey PRIMARY KEY (id),
  CONSTRAINT driver_monthly_stats_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.driver_profiles(id),
  CONSTRAINT driver_monthly_stats_unique UNIQUE (driver_id, year, month)
);

-- 3. Ajouter des champs à la table driver_profiles pour les statistiques en temps réel
ALTER TABLE public.driver_profiles 
ADD COLUMN IF NOT EXISTS total_earnings integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_orders_completed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_month_earnings integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_payment_date timestamp with time zone;

-- 4. Fonction pour calculer automatiquement les gains (40% des frais de livraison)
CREATE OR REPLACE FUNCTION calculate_driver_earnings(delivery_fee integer, percentage numeric DEFAULT 0.40)
RETURNS integer AS $$
BEGIN
  RETURN ROUND(delivery_fee * percentage);
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction pour enregistrer les gains d'un driver
CREATE OR REPLACE FUNCTION record_driver_earnings(
  p_driver_id uuid,
  p_order_id uuid,
  p_delivery_fee integer,
  p_earnings_percentage numeric DEFAULT 0.40
)
RETURNS uuid AS $$
DECLARE
  v_earnings_id uuid;
  v_driver_earnings integer;
BEGIN
  -- Calculer les gains du driver
  v_driver_earnings := calculate_driver_earnings(p_delivery_fee, p_earnings_percentage);
  
  -- Enregistrer dans l'historique (en utilisant le service role pour contourner RLS)
  INSERT INTO public.driver_earnings (
    driver_id, 
    order_id, 
    delivery_fee, 
    driver_earnings, 
    earnings_percentage,
    status
  ) VALUES (
    p_driver_id, 
    p_order_id, 
    p_delivery_fee, 
    v_driver_earnings, 
    p_earnings_percentage,
    'confirmed'
  ) RETURNING id INTO v_earnings_id;
  
  -- Mettre à jour les statistiques du driver
  UPDATE public.driver_profiles 
  SET 
    total_earnings = total_earnings + v_driver_earnings,
    total_orders_completed = total_orders_completed + 1,
    current_month_earnings = current_month_earnings + v_driver_earnings,
    updated_at = now()
  WHERE id = p_driver_id;
  
  -- Mettre à jour les statistiques mensuelles
  INSERT INTO public.driver_monthly_stats (
    driver_id, 
    year, 
    month, 
    total_orders, 
    total_delivery_fees, 
    total_earnings
  ) VALUES (
    p_driver_id, 
    EXTRACT(YEAR FROM now()), 
    EXTRACT(MONTH FROM now()), 
    1, 
    p_delivery_fee, 
    v_driver_earnings
  ) ON CONFLICT (driver_id, year, month) 
  DO UPDATE SET 
    total_orders = driver_monthly_stats.total_orders + 1,
    total_delivery_fees = driver_monthly_stats.total_delivery_fees + p_delivery_fee,
    total_earnings = driver_monthly_stats.total_earnings + v_driver_earnings,
    average_earnings_per_order = (driver_monthly_stats.total_earnings + v_driver_earnings) / (driver_monthly_stats.total_orders + 1),
    updated_at = now();
  
  RETURN v_earnings_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fonction pour réinitialiser les gains mensuels (à exécuter chaque mois)
CREATE OR REPLACE FUNCTION reset_monthly_earnings()
RETURNS void AS $$
BEGIN
  UPDATE public.driver_profiles 
  SET current_month_earnings = 0;
END;
$$ LANGUAGE plpgsql;

-- 7. Vue pour les statistiques des drivers
CREATE OR REPLACE VIEW driver_earnings_summary AS
SELECT 
  dp.id as driver_id,
  dp.name as driver_name,
  dp.email,
  dp.phone_number,
  dp.total_earnings,
  dp.total_orders_completed,
  dp.current_month_earnings,
  dp.last_payment_date,
  COALESCE(dms.total_orders, 0) as current_month_orders,
  COALESCE(dms.total_earnings, 0) as current_month_earnings_detailed,
  COALESCE(dms.average_earnings_per_order, 0) as avg_earnings_per_order,
  CASE 
    WHEN dp.total_orders_completed > 0 
    THEN ROUND(dp.total_earnings::numeric / dp.total_orders_completed, 2)
    ELSE 0 
  END as lifetime_avg_earnings_per_order
FROM public.driver_profiles dp
LEFT JOIN public.driver_monthly_stats dms ON dp.id = dms.driver_id 
  AND dms.year = EXTRACT(YEAR FROM now()) 
  AND dms.month = EXTRACT(MONTH FROM now());

-- 8. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver_id ON public.driver_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_order_id ON public.driver_earnings(order_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_created_at ON public.driver_earnings(created_at);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_status ON public.driver_earnings(status);
CREATE INDEX IF NOT EXISTS idx_driver_monthly_stats_driver_id ON public.driver_monthly_stats(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_monthly_stats_year_month ON public.driver_monthly_stats(year, month);

-- ============================================================================
-- 9. SYSTÈME D'AVIS POUR LES LIVREURS
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

-- Ajouter les champs manquants à driver_profiles
ALTER TABLE driver_profiles 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_deliveries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_driver_reviews_driver_id ON driver_reviews(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_customer_id ON driver_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_order_id ON driver_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_rating ON driver_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_created_at ON driver_reviews(created_at);

-- ============================================================================
-- 10. FONCTIONS POUR LA GESTION DES AVIS
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
    -- Récupérer les avis
    SELECT json_agg(
        json_build_object(
            'id', dr.id,
            'rating', dr.rating,
            'comment', dr.comment,
            'created_at', dr.created_at,
            'customer_name', COALESCE(up.name, 'Client anonyme'),
            'order_id', dr.order_id
        )
    ) INTO reviews
    FROM driver_reviews dr
    LEFT JOIN user_profiles up ON up.id = dr.customer_id
    WHERE dr.driver_id = p_driver_id
    ORDER BY dr.created_at DESC
    LIMIT p_limit OFFSET p_offset;
    
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

-- ============================================================================
-- 11. TRIGGERS POUR AUTOMATISER LES MISES À JOUR
-- ============================================================================

-- Trigger pour mettre à jour les stats quand un avis est ajouté
CREATE OR REPLACE FUNCTION trigger_update_driver_stats_on_review()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_driver_stats(NEW.driver_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE TRIGGER trigger_order_status_change
    AFTER UPDATE OF status, driver_id ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_driver_stats_on_order_status();

-- ============================================================================
-- 12. RLS (Row Level Security) pour la sécurité
ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_monthly_stats ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Drivers can view their own earnings" ON public.driver_earnings;
DROP POLICY IF EXISTS "Drivers can view their own monthly stats" ON public.driver_monthly_stats;
DROP POLICY IF EXISTS "Admins can view all earnings" ON public.driver_earnings;
DROP POLICY IF EXISTS "Admins can view all monthly stats" ON public.driver_monthly_stats;
DROP POLICY IF EXISTS "Service role can manage earnings" ON public.driver_earnings;
DROP POLICY IF EXISTS "Service role can manage monthly stats" ON public.driver_monthly_stats;

-- Politique pour le service role (permet toutes les opérations)
CREATE POLICY "Service role can manage earnings" ON public.driver_earnings
  FOR ALL USING (true);

CREATE POLICY "Service role can manage monthly stats" ON public.driver_monthly_stats
  FOR ALL USING (true);

-- Politique pour que les drivers ne voient que leurs propres gains
CREATE POLICY "Drivers can view their own earnings" ON public.driver_earnings
  FOR SELECT USING (driver_id = auth.uid());

CREATE POLICY "Drivers can view their own monthly stats" ON public.driver_monthly_stats
  FOR SELECT USING (driver_id = auth.uid());

-- Politique pour les admins (peuvent voir tous les gains)
CREATE POLICY "Admins can view all earnings" ON public.driver_earnings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role_id IN (SELECT id FROM public.user_roles WHERE name = 'admin')
    )
  );

CREATE POLICY "Admins can view all monthly stats" ON public.driver_monthly_stats
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role_id IN (SELECT id FROM public.user_roles WHERE name = 'admin')
    )
  );

-- 10. Trigger pour enregistrer automatiquement les gains quand une commande est livrée
CREATE OR REPLACE FUNCTION trigger_record_driver_earnings()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si la commande est passée à "delivered" et a un driver assigné
  IF NEW.status = 'delivered' AND NEW.driver_id IS NOT NULL AND OLD.status != 'delivered' THEN
    -- Enregistrer les gains du driver
    PERFORM record_driver_earnings(NEW.driver_id, NEW.id, NEW.delivery_fee);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_driver_earnings
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_record_driver_earnings();

-- 11. Exemples de requêtes utiles

-- Récupérer les gains d'un driver pour le mois actuel
/*
SELECT 
  de.*,
  o.order_number,
  o.created_at as order_date,
  b.name as business_name
FROM public.driver_earnings de
JOIN public.orders o ON de.order_id = o.id
JOIN public.businesses b ON o.business_id = b.id
WHERE de.driver_id = 'driver-uuid-here'
  AND EXTRACT(YEAR FROM de.created_at) = EXTRACT(YEAR FROM now())
  AND EXTRACT(MONTH FROM de.created_at) = EXTRACT(MONTH FROM now())
ORDER BY de.created_at DESC;
*/

-- Statistiques mensuelles d'un driver
/*
SELECT 
  year,
  month,
  total_orders,
  total_earnings,
  average_earnings_per_order
FROM public.driver_monthly_stats
WHERE driver_id = 'driver-uuid-here'
ORDER BY year DESC, month DESC;
*/

-- Top 10 des drivers par gains du mois
/*
SELECT 
  dp.name,
  dp.email,
  dms.total_earnings,
  dms.total_orders
FROM public.driver_monthly_stats dms
JOIN public.driver_profiles dp ON dms.driver_id = dp.id
WHERE dms.year = EXTRACT(YEAR FROM now())
  AND dms.month = EXTRACT(MONTH FROM now())
ORDER BY dms.total_earnings DESC
LIMIT 10;
*/
