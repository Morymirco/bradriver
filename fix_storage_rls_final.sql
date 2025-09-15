-- Script pour corriger les politiques RLS du bucket de stockage
-- et résoudre le problème d'upload d'images de 0 bytes

-- 1. Vérifier si le bucket existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'driver-avatars'
  ) THEN
    -- Créer le bucket s'il n'existe pas
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'driver-avatars',
      'driver-avatars',
      true,
      5242880, -- 5MB
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    );
    RAISE NOTICE 'Bucket driver-avatars créé';
  ELSE
    RAISE NOTICE 'Bucket driver-avatars existe déjà';
  END IF;
END $$;

-- 2. Supprimer toutes les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Allow avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar deletes" ON storage.objects;
DROP POLICY IF EXISTS "Chauffeurs peuvent uploader leurs avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatars publics pour lecture" ON storage.objects;
DROP POLICY IF EXISTS "Chauffeurs peuvent mettre à jour leurs avatars" ON storage.objects;
DROP POLICY IF EXISTS "Chauffeurs peuvent supprimer leurs avatars" ON storage.objects;

-- 3. Créer des politiques RLS simplifiées pour le développement
-- Politique pour l'upload (INSERT)
CREATE POLICY "Allow avatar uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'driver-avatars' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Politique pour la lecture (SELECT)
CREATE POLICY "Allow avatar reads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'driver-avatars'
);

-- Politique pour la mise à jour (UPDATE)
CREATE POLICY "Allow avatar updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'driver-avatars' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Politique pour la suppression (DELETE)
CREATE POLICY "Allow avatar deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'driver-avatars' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- 4. Vérifier que RLS est activé sur storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Créer une fonction pour nettoyer les anciens avatars
CREATE OR REPLACE FUNCTION cleanup_old_avatars()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer l'ancien avatar si l'avatar_url a changé
  IF OLD.avatar_url IS NOT NULL AND OLD.avatar_url != NEW.avatar_url THEN
    -- Extraire le chemin du fichier de l'URL
    DECLARE
      file_path TEXT;
    BEGIN
      -- Extraire le nom du fichier de l'URL
      file_path := substring(OLD.avatar_url from 'avatars/[^?]+');
      
      IF file_path IS NOT NULL THEN
        -- Supprimer le fichier du storage
        DELETE FROM storage.objects 
        WHERE bucket_id = 'driver-avatars' 
        AND name = file_path;
        
        RAISE NOTICE 'Ancien avatar supprimé: %', file_path;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la suppression de l''ancien avatar: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer le trigger pour nettoyer automatiquement les anciens avatars
DROP TRIGGER IF EXISTS trigger_cleanup_old_avatars ON driver_profiles;
CREATE TRIGGER trigger_cleanup_old_avatars
  AFTER UPDATE ON driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_avatars();

-- 7. Créer une fonction pour définir un avatar par défaut
CREATE OR REPLACE FUNCTION set_default_avatar()
RETURNS TRIGGER AS $$
BEGIN
  -- Définir un avatar par défaut si aucun n'est fourni
  IF NEW.avatar_url IS NULL THEN
    NEW.avatar_url := 'https://randomuser.me/api/portraits/men/32.jpg';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer le trigger pour définir un avatar par défaut
DROP TRIGGER IF EXISTS trigger_set_default_avatar ON driver_profiles;
CREATE TRIGGER trigger_set_default_avatar
  BEFORE INSERT ON driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_default_avatar();

-- 9. Vérifier les politiques créées
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
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- 10. Afficher les informations du bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'driver-avatars';

-- 11. Vérifier les triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'driver_profiles';

RAISE NOTICE 'Configuration du bucket de stockage terminée avec succès!';
