# 📸 Configuration de l'Upload d'Avatar et Modification de Profil

Ce guide explique comment configurer et utiliser les fonctionnalités d'upload d'avatar et de modification de profil pour les chauffeurs.

## 🚀 Configuration Initiale

### 1. Installation des Dépendances

Assurez-vous d'avoir installé `expo-image-picker` :

```bash
npx expo install expo-image-picker
```

### 2. Configuration du Bucket Supabase Storage

Exécutez le script SQL `setup_storage_bucket.sql` dans l'éditeur SQL de Supabase pour :

- Créer le bucket `driver-avatars`
- Configurer les politiques RLS
- Créer les triggers pour la gestion automatique des avatars

### 3. Permissions Android/iOS

#### Android (app.json)
```json
{
  "expo": {
    "android": {
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

#### iOS (app.json)
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "Cette app utilise la caméra pour prendre des photos de profil",
        "NSPhotoLibraryUsageDescription": "Cette app accède à votre galerie pour sélectionner des photos de profil"
      }
    }
  }
}
```

## 📱 Fonctionnalités Implémentées

### 1. Upload d'Avatar

#### Fonctionnalités :
- **Sélection depuis la galerie** : Choisir une image existante
- **Prise de photo** : Prendre une nouvelle photo avec la caméra
- **Redimensionnement automatique** : Images redimensionnées à 1:1 (carré)
- **Compression** : Qualité réduite à 80% pour optimiser la taille
- **Nettoyage automatique** : Suppression de l'ancien avatar lors du remplacement

#### Utilisation :
```typescript
// Dans ProfileScreen.tsx
const handleAvatarUpload = async () => {
  // Affiche un menu pour choisir entre galerie et caméra
  Alert.alert('Changer l\'avatar', 'Choisissez une option', [
    { text: 'Galerie', onPress: () => pickFromGallery() },
    { text: 'Caméra', onPress: () => takePhoto() }
  ]);
};
```

### 2. Modification de Profil

#### Champs modifiables :
- **Nom complet** : Nom et prénom du chauffeur
- **Email** : Adresse email de contact
- **Téléphone** : Numéro de téléphone
- **Type de véhicule** : Moto, Voiture, Camion, etc.
- **Plaque d'immatriculation** : Numéro d'immatriculation du véhicule

#### Validation :
- Vérification des champs obligatoires
- Validation du format email
- Mise à jour en temps réel dans l'interface

## 🔧 Services Créés

### ProfileService

#### Méthodes principales :

```typescript
// Upload d'un avatar
static async uploadAvatar(imageUri: string, driverId: string): Promise<UploadResult>

// Sélection d'image depuis la galerie
static async pickImage(): Promise<string | null>

// Prise de photo avec la caméra
static async takePhoto(): Promise<string | null>

// Mise à jour du profil
static async updateProfile(driverId: string, updateData: ProfileUpdateData): Promise<{ success: boolean; error?: string }>

// Suppression de l'ancien avatar
static async deleteOldAvatar(avatarPath: string): Promise<void>

// Récupération du profil complet
static async getProfile(driverId: string): Promise<any>
```

## 🗄️ Structure de la Base de Données

### Tables concernées :

#### `driver_profiles`
```sql
CREATE TABLE driver_profiles (
  id uuid PRIMARY KEY REFERENCES user_profiles(id),
  name text,
  email text,
  phone_number text,
  vehicle_type varchar,
  vehicle_plate varchar,
  avatar_url text,
  -- autres champs...
);
```

#### `user_profiles`
```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name varchar NOT NULL,
  email varchar NOT NULL UNIQUE,
  phone_number varchar,
  address text,
  -- autres champs...
);
```

### Bucket Storage
```sql
-- Bucket pour les avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-avatars',
  'driver-avatars',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

## 🔒 Sécurité et Permissions

### Politiques RLS pour le Storage :

1. **Upload** : Seuls les chauffeurs peuvent uploader leurs propres avatars
2. **Lecture** : Les avatars sont publics pour l'affichage
3. **Mise à jour** : Seuls les propriétaires peuvent modifier leurs avatars
4. **Suppression** : Seuls les propriétaires peuvent supprimer leurs avatars

### Politiques RLS pour les Profils :

1. **Lecture** : Les chauffeurs peuvent lire leur propre profil
2. **Mise à jour** : Les chauffeurs peuvent modifier leur propre profil
3. **Suppression** : Restrictions sur la suppression des profils

## 🎨 Interface Utilisateur

### Écran de Profil Principal :
- **Avatar** : Affichage de l'avatar actuel avec bouton de modification
- **Informations** : Nom, email, téléphone
- **Statistiques** : Livraisons, note, gains
- **Actions** : Modifier le profil, documents, support, déconnexion

### Écran de Modification :
- **Formulaire** : Champs modifiables avec validation
- **Sauvegarde** : Bouton avec indicateur de chargement
- **Navigation** : Retour vers l'écran principal

## 🚨 Gestion des Erreurs

### Types d'erreurs gérées :
1. **Permissions** : Accès refusé à la caméra/galerie
2. **Upload** : Échec de l'upload vers Supabase Storage
3. **Base de données** : Échec de mise à jour du profil
4. **Réseau** : Problèmes de connexion
5. **Validation** : Données invalides

### Messages d'erreur :
- Messages en français
- Explications claires pour l'utilisateur
- Suggestions de résolution

## 🔄 Mise à Jour en Temps Réel

### Refresh des Données :
- **Context API** : Utilisation du contexte d'authentification
- **Mise à jour automatique** : Rechargement après modification
- **Synchronisation** : Données cohérentes dans toute l'app

### Fonction refreshDriver :
```typescript
// Dans AuthContext
const refreshDriver = async () => {
  await getCurrentDriver();
};

// Dans ProfileScreen
await refreshDriver(); // Après modification réussie
```

## 📋 Checklist de Déploiement

- [ ] Exécuter le script SQL de configuration du bucket
- [ ] Installer expo-image-picker
- [ ] Configurer les permissions dans app.json
- [ ] Tester l'upload d'avatar
- [ ] Tester la modification de profil
- [ ] Vérifier les politiques RLS
- [ ] Tester la gestion des erreurs
- [ ] Valider l'interface utilisateur

## 🐛 Dépannage

### Problèmes courants :

1. **Erreur de permissions** : Vérifier la configuration dans app.json
2. **Upload échoue** : Vérifier les politiques RLS du bucket
3. **Image ne s'affiche pas** : Vérifier l'URL publique du bucket
4. **Profil ne se met pas à jour** : Vérifier les politiques RLS des tables

### Logs utiles :
```typescript
console.log('🔍 Upload avatar:', result);
console.log('🔍 Update profile:', updateResult);
console.log('🔍 Refresh driver:', driver);
```
