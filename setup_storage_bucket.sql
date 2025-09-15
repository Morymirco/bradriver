-- Script de configuration du bucket de stockage pour les avatars des chauffeurs
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer le bucket pour les avatars des chauffeurs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-avatars',
  'driver-avatars',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- 2. Créer une politique RLS pour permettre l'upload d'avatars
CREATE POLICY "Chauffeurs peuvent uploader leurs avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'driver-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Créer une politique RLS pour permettre la lecture des avatars
CREATE POLICY "Avatars publics pour lecture" ON storage.objects
FOR SELECT USING (
  bucket_id = 'driver-avatars'
);

-- 4. Créer une politique RLS pour permettre la mise à jour des avatars
CREATE POLICY "Chauffeurs peuvent mettre à jour leurs avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'driver-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Créer une politique RLS pour permettre la suppression des avatars
CREATE POLICY "Chauffeurs peuvent supprimer leurs avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'driver-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Fonction pour nettoyer automatiquement les anciens avatars
CREATE OR REPLACE FUNCTION cleanup_old_avatars()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer l'ancien avatar si il existe
  IF OLD.avatar_url IS NOT NULL AND OLD.avatar_url != NEW.avatar_url THEN
    -- Extraire le nom du fichier de l'URL
    DELETE FROM storage.objects 
    WHERE bucket_id = 'driver-avatars' 
    AND name LIKE '%' || split_part(OLD.avatar_url, '/', -1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Déclencher pour nettoyer automatiquement les anciens avatars
CREATE TRIGGER cleanup_old_avatars_trigger
  AFTER UPDATE ON driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_avatars();

-- 8. Fonction pour générer automatiquement un avatar par défaut
CREATE OR REPLACE FUNCTION set_default_avatar()
RETURNS TRIGGER AS $$
BEGIN
  -- Si aucun avatar n'est défini, utiliser un avatar par défaut
  IF NEW.avatar_url IS NULL THEN
    NEW.avatar_url = 'https://randomuser.me/api/portraits/men/32.jpg';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Déclencher pour définir un avatar par défaut
CREATE TRIGGER set_default_avatar_trigger
  BEFORE INSERT ON driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_default_avatar();

-- 10. Vérifier que le bucket a été créé
SELECT * FROM storage.buckets WHERE id = 'driver-avatars';

-- 11. Vérifier les politiques créées
SELECT * FROM storage.policies WHERE bucket_id = 'driver-avatars';
