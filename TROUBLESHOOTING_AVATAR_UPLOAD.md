# 🔧 Guide de Dépannage - Upload d'Avatars

## 🚨 Problème Identifié
Les images uploadées font 0 bytes, ce qui indique un problème lors de la conversion de l'image en blob.

## 📋 Étapes de Résolution

### 1. **Exécuter le Script SQL de Correction**
```sql
-- Exécuter le fichier fix_storage_rls_final.sql dans l'éditeur SQL de Supabase
```

Ce script va :
- ✅ Créer le bucket `driver-avatars` s'il n'existe pas
- ✅ Supprimer les anciennes politiques RLS conflictuelles
- ✅ Créer de nouvelles politiques RLS simplifiées
- ✅ Configurer les triggers pour le nettoyage automatique
- ✅ Vérifier la configuration

### 2. **Tester l'Upload avec l'Image de Test**
1. Aller dans l'application
2. Naviguer vers **Profil**
3. Cliquer sur **"Test Upload Avatar"**
4. Vérifier les logs dans la console

### 3. **Vérifier les Logs de Débogage**
Les logs suivants devraient apparaître :
```
🔍 Test d'upload avec image de test...
🔍 Image de test créée, taille base64: [nombre]
🔍 Début upload avatar pour driver: [driver-id]
🔍 Image en format data URI détectée
🔍 Type MIME détecté: image/png
🔍 Taille du blob (data URI): [nombre] bytes
🔍 Upload vers Supabase Storage...
✅ Upload réussi (data URI), données: [données]
🔍 URL publique: [url]
✅ Test d'upload réussi: [url]
```

### 4. **Diagnostic des Erreurs Courantes**

#### ❌ Erreur : "Unauthorized"
**Cause :** Politiques RLS trop restrictives
**Solution :** Exécuter le script SQL de correction

#### ❌ Erreur : "L'image est vide (0 bytes)"
**Cause :** Problème de conversion URI → Blob
**Solution :** Vérifier que l'URI de l'image est valide

#### ❌ Erreur : "Type de fichier invalide"
**Cause :** Format d'image non supporté
**Solution :** Utiliser JPEG, PNG ou WEBP

#### ❌ Erreur : "Bucket not found"
**Cause :** Bucket `driver-avatars` n'existe pas
**Solution :** Exécuter le script SQL de correction

### 5. **Test Manuel dans Supabase**

#### Vérifier le Bucket
```sql
SELECT * FROM storage.buckets WHERE id = 'driver-avatars';
```

#### Vérifier les Politiques RLS
```sql
SELECT 
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

#### Lister les Fichiers Uploadés
```sql
SELECT * FROM storage.objects WHERE bucket_id = 'driver-avatars';
```

### 6. **Améliorations Apportées**

#### ✅ Gestion des Data URIs
- Support des images en format `data:image/png;base64,...`
- Conversion automatique base64 → Blob
- Validation de la taille et du type MIME

#### ✅ Logs Détaillés
- Suivi complet du processus d'upload
- Affichage des erreurs avec contexte
- Validation à chaque étape

#### ✅ Politiques RLS Simplifiées
- Politiques moins restrictives pour le développement
- Support des dossiers `avatars/`
- Permissions publiques pour la lecture

#### ✅ Nettoyage Automatique
- Suppression automatique des anciens avatars
- Trigger sur mise à jour du profil
- Gestion des erreurs de suppression

### 7. **Test de l'Upload Réel**

Une fois le test réussi :

1. **Sélectionner une image depuis la galerie**
   - Cliquer sur l'icône caméra sur l'avatar
   - Choisir "Galerie"
   - Sélectionner une image

2. **Prendre une photo avec la caméra**
   - Cliquer sur l'icône caméra sur l'avatar
   - Choisir "Caméra"
   - Prendre une photo

3. **Vérifier l'Upload**
   - L'avatar devrait se mettre à jour automatiquement
   - Vérifier les logs pour confirmer le succès

### 8. **Vérification Finale**

#### Dans l'Application
- ✅ L'avatar s'affiche correctement
- ✅ Pas d'erreur dans la console
- ✅ L'URL de l'avatar est mise à jour

#### Dans Supabase
- ✅ Le fichier existe dans `storage.objects`
- ✅ La taille du fichier > 0 bytes
- ✅ L'URL publique est accessible

### 9. **En Cas d'Échec Persistant**

#### Vérifier les Permissions
```sql
-- Vérifier que l'utilisateur a les bonnes permissions
SELECT auth.uid() as current_user_id;
```

#### Tester la Connexion Storage
```sql
-- Tester l'accès au bucket
SELECT * FROM storage.objects 
WHERE bucket_id = 'driver-avatars' 
LIMIT 1;
```

#### Vérifier les Triggers
```sql
-- Vérifier que les triggers sont actifs
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'driver_profiles';
```

## 🎯 Résultat Attendu

Après avoir suivi ces étapes :
- ✅ L'upload d'avatars fonctionne correctement
- ✅ Les images ne font plus 0 bytes
- ✅ L'avatar s'affiche dans l'interface
- ✅ Le nettoyage automatique fonctionne
- ✅ Les politiques RLS sont correctement configurées

## 📞 Support

Si le problème persiste après avoir suivi toutes ces étapes, vérifiez :
1. Les logs de la console pour des erreurs spécifiques
2. La configuration du bucket dans Supabase
3. Les permissions de l'utilisateur authentifié
4. La connectivité réseau de l'application
