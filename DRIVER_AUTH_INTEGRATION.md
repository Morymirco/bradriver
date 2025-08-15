# Intégration de l'Authentification des Drivers

## Vue d'ensemble

Cette documentation décrit l'intégration de la nouvelle logique d'authentification des drivers dans l'application BraPrime Driver. La nouvelle implémentation utilise un service dédié (`DriverAuthService`) qui gère l'authentification, l'inscription et la gestion des profils des drivers.

## Architecture

### 1. Service d'Authentification (`src/services/driverAuthService.ts`)

Le service `DriverAuthService` fournit toutes les fonctionnalités d'authentification :

- **Inscription** : Création de compte driver avec validation
- **Connexion** : Authentification avec vérification du rôle driver
- **Déconnexion** : Fermeture de session sécurisée
- **Gestion de profil** : Mise à jour des informations du driver
- **Gestion des mots de passe** : Changement et réinitialisation
- **Vérifications** : Validation d'email, statut du compte, etc.

### 2. Contexte d'Authentification (`src/contexts/AuthContext.tsx`)

Le contexte a été mis à jour pour intégrer le nouveau service :

- Gestion de l'état du driver connecté
- Intégration avec Supabase Auth
- Synchronisation automatique des données du driver
- Gestion des changements d'état d'authentification

### 3. Hook personnalisé (`src/hooks/useDriver.ts`)

Le hook `useDriver` fournit une interface simplifiée pour :

- Accéder aux données du driver connecté
- Mettre à jour le profil
- Gérer les mots de passe
- Vérifier les emails

## Fonctionnalités implémentées

### Authentification

#### Connexion
```typescript
const { signIn } = useAuth();
const { error } = await signIn(email, password);
```

#### Inscription
```typescript
const { signUp } = useAuth();
const driverData: DriverRegistrationData = {
  email: 'driver@example.com',
  phone: '+33 6 12 34 56 78',
  name: 'John Doe',
  password: 'password123',
  driver_type: 'independent',
  vehicle_type: 'Scooter',
  vehicle_plate: 'AB-123-CD'
};
const { error } = await signUp(driverData);
```

#### Déconnexion
```typescript
const { signOut } = useAuth();
await signOut();
```

### Gestion du profil

#### Accès aux données du driver
```typescript
const { driver } = useAuth();
// driver contient toutes les informations du driver connecté
```

#### Mise à jour du profil
```typescript
const { updateProfile } = useDriver();
const { error } = await updateProfile({
  name: 'Nouveau nom',
  phone: '+33 6 98 76 54 32',
  vehicle_type: 'Voiture'
});
```

### Validation et sécurité

- Validation des emails
- Vérification des mots de passe
- Contrôle du statut du compte (actif/inactif)
- Vérification du rôle driver
- Gestion des erreurs d'authentification

## Écrans mis à jour

### 1. Écran de Connexion (`LoginScreen.tsx`)
- Intégration avec le nouveau service d'authentification
- Gestion des erreurs améliorée
- Lien vers l'écran d'inscription

### 2. Écran d'Inscription (`RegisterScreen.tsx`)
- Formulaire complet d'inscription
- Validation des champs
- Gestion des erreurs
- Navigation vers la connexion après inscription

### 3. Écran de Profil (`ProfileScreen.tsx`)
- Affichage des données réelles du driver
- Statistiques dynamiques (livraisons, gains, note)
- Fonctionnalité de déconnexion

## Navigation

La navigation a été mise à jour pour inclure :

- Route `Register` pour l'inscription
- Gestion automatique de l'authentification
- Redirection basée sur l'état de connexion

## Structure des données

### Interface DriverAuthData
```typescript
interface DriverAuthData {
  id: string;
  email: string;
  phone: string;
  name: string;
  driver_type: 'independent' | 'service';
  business_id?: number;
  business_name?: string;
  is_verified: boolean;
  is_active: boolean;
  avatar_url?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
  documents_count: number;
  total_deliveries: number;
  total_earnings: number;
  rating: number;
  active_sessions: number;
  created_at: string;
}
```

## Utilisation

### Dans un composant
```typescript
import { useAuth } from '../contexts/AuthContext';
import { useDriver } from '../hooks/useDriver';

const MyComponent = () => {
  const { driver, signOut } = useAuth();
  const { updateProfile, loading } = useDriver();

  // Utiliser les données du driver
  console.log(driver?.name, driver?.total_earnings);

  // Mettre à jour le profil
  const handleUpdate = async () => {
    const { error } = await updateProfile({
      name: 'Nouveau nom'
    });
    if (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    // Votre JSX
  );
};
```

## Gestion des erreurs

Le système gère automatiquement :

- Erreurs de connexion (identifiants invalides)
- Erreurs d'inscription (email déjà utilisé)
- Erreurs de réseau
- Erreurs de validation
- Comptes désactivés

## Sécurité

- Validation côté client et serveur
- Hachage sécurisé des mots de passe
- Vérification des rôles utilisateur
- Gestion des sessions sécurisée
- Protection contre les attaques courantes

## Tests recommandés

1. **Inscription** : Créer un nouveau compte driver
2. **Connexion** : Se connecter avec les identifiants
3. **Validation** : Tester les validations de formulaire
4. **Erreurs** : Tester les cas d'erreur
5. **Profil** : Mettre à jour les informations
6. **Déconnexion** : Fermer la session
7. **Persistance** : Vérifier la persistance de session

## Prochaines étapes

- [ ] Ajouter la vérification d'email
- [ ] Implémenter la récupération de mot de passe
- [ ] Ajouter la gestion des documents
- [ ] Intégrer les notifications push
- [ ] Ajouter la géolocalisation
- [ ] Implémenter le système de notation 