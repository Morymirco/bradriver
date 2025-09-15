-- Script pour configurer les politiques RLS pour la table notifications
-- Selon le schéma Supabase fourni

-- 1. Vérifier que la table notifications existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
  ) THEN
    RAISE EXCEPTION 'La table notifications n''existe pas';
  END IF;
END $$;

-- 2. Activer RLS sur la table notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can manage all notifications" ON public.notifications;

-- 4. Créer les politiques RLS

-- Politique pour la lecture (SELECT)
-- Les utilisateurs peuvent voir uniquement leurs propres notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (
  auth.uid()::text = user_id::text
);

-- Politique pour l'insertion (INSERT)
-- Les utilisateurs peuvent créer des notifications pour eux-mêmes
-- Le système peut créer des notifications pour n'importe quel utilisateur
CREATE POLICY "Users can insert their own notifications" ON public.notifications
FOR INSERT WITH CHECK (
  auth.uid()::text = user_id::text OR
  auth.role() = 'service_role'
);

-- Politique pour la mise à jour (UPDATE)
-- Les utilisateurs peuvent mettre à jour leurs propres notifications
-- Le système peut mettre à jour toutes les notifications
CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (
  auth.uid()::text = user_id::text OR
  auth.role() = 'service_role'
);

-- Politique pour la suppression (DELETE)
-- Les utilisateurs peuvent supprimer leurs propres notifications
-- Le système peut supprimer toutes les notifications
CREATE POLICY "Users can delete their own notifications" ON public.notifications
FOR DELETE USING (
  auth.uid()::text = user_id::text OR
  auth.role() = 'service_role'
);

-- 5. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);

-- 6. Créer une fonction pour nettoyer automatiquement les notifications expirées
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications 
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 7. Créer un trigger pour nettoyer automatiquement les notifications expirées
-- (Optionnel - peut être exécuté manuellement ou via une tâche cron)
DROP TRIGGER IF EXISTS trigger_cleanup_expired_notifications ON public.notifications;
CREATE TRIGGER trigger_cleanup_expired_notifications
  AFTER INSERT ON public.notifications
  EXECUTE FUNCTION cleanup_expired_notifications();

-- 8. Créer une fonction pour créer des notifications système
CREATE OR REPLACE FUNCTION create_system_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_priority text DEFAULT 'medium',
  p_data jsonb DEFAULT '{}'::jsonb,
  p_expires_at timestamp with time zone DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    priority,
    data,
    expires_at,
    is_read,
    created_at
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_priority,
    p_data,
    p_expires_at,
    false,
    NOW()
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Créer une fonction pour créer des notifications de commande
CREATE OR REPLACE FUNCTION create_order_notification(
  p_user_id uuid,
  p_order_id uuid,
  p_order_number text,
  p_status text,
  p_message text
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
  v_priority text;
BEGIN
  -- Déterminer la priorité selon le statut
  CASE p_status
    WHEN 'cancelled', 'delivered' THEN v_priority := 'high';
    ELSE v_priority := 'medium';
  END CASE;
  
  SELECT create_system_notification(
    p_user_id,
    'order',
    'Commande ' || p_order_number,
    p_message,
    v_priority,
    jsonb_build_object(
      'order_id', p_order_id,
      'order_number', p_order_number,
      'status', p_status
    )
  ) INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Créer une fonction pour créer des notifications de paiement
CREATE OR REPLACE FUNCTION create_payment_notification(
  p_user_id uuid,
  p_order_id uuid,
  p_order_number text,
  p_status text,
  p_amount integer
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
  v_priority text;
  v_message text;
BEGIN
  -- Déterminer la priorité et le message selon le statut
  CASE p_status
    WHEN 'failed' THEN 
      v_priority := 'high';
      v_message := 'Problème avec le paiement de ' || p_amount || ' GNF pour la commande ' || p_order_number;
    ELSE 
      v_priority := 'medium';
      v_message := 'Paiement de ' || p_amount || ' GNF confirmé pour la commande ' || p_order_number;
  END CASE;
  
  SELECT create_system_notification(
    p_user_id,
    'payment',
    'Paiement - Commande ' || p_order_number,
    v_message,
    v_priority,
    jsonb_build_object(
      'order_id', p_order_id,
      'order_number', p_order_number,
      'status', p_status,
      'amount', p_amount
    )
  ) INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Vérifier les politiques créées
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
WHERE tablename = 'notifications' 
AND schemaname = 'public'
ORDER BY policyname;

-- 12. Vérifier les index créés
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
ORDER BY indexname;

-- 13. Vérifier les fonctions créées
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname IN (
  'cleanup_expired_notifications',
  'create_system_notification',
  'create_order_notification',
  'create_payment_notification'
);

RAISE NOTICE 'Configuration des notifications terminée avec succès!';
