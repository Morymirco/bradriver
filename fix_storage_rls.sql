-- Script pour corriger les politiques RLS du bucket de stockage
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer les anciennes politiques RLS
DROP POLICY IF EXISTS "Chauffeurs peuvent uploader leurs avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatars publics pour lecture" ON storage.objects;
DROP POLICY IF EXISTS "Chauffeurs peuvent mettre à jour leurs avatars" ON storage.objects;
DROP POLICY IF EXISTS "Chauffeurs peuvent supprimer leurs avatars" ON storage.objects;

-- 2. Créer des politiques RLS plus permissives pour le développement
-- Politique pour permettre l'upload d'avatars
CREATE POLICY "Allow avatar uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'driver-avatars'
);

-- Politique pour permettre la lecture des avatars
CREATE POLICY "Allow avatar reads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'driver-avatars'
);

-- Politique pour permettre la mise à jour des avatars
CREATE POLICY "Allow avatar updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'driver-avatars'
);

-- Politique pour permettre la suppression des avatars
CREATE POLICY "Allow avatar deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'driver-avatars'
);

-- 3. Vérifier que le bucket existe, sinon le créer
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-avatars',
  'driver-avatars',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Vérifier les politiques créées
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

-- 5. Vérifier le bucket
SELECT * FROM storage.buckets WHERE id = 'driver-avatars';
