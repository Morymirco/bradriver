# Services et Hooks BraPrime Driver

Ce dossier contient tous les services et hooks personnalisés pour l'application BraPrime Driver.

## 📁 Structure

```
src/
├── services/
│   ├── driverService.ts     # Service principal pour les chauffeurs
│   └── README.md           # Cette documentation
└── hooks/
    ├── useDriver.ts         # Hook pour la gestion du profil chauffeur
    ├── useOrders.ts         # Hook pour la gestion des commandes
    ├── useNotifications.ts  # Hook pour la gestion des notifications
    ├── useLocation.ts       # Hook pour la géolocalisation
    └── index.ts            # Export centralisé
```

## 🚗 Services

### DriverService

Le service principal qui gère toutes les interactions avec la base de données Supabase pour les chauffeurs.

#### Fonctionnalités principales :

- **Gestion du profil** : Récupération, mise à jour du profil chauffeur
- **Statistiques** : Récupération des performances et gains
- **Sessions de travail** : Démarrage/arrêt des sessions
- **Documents** : Gestion des documents du chauffeur
- **Notifications** : Gestion des notifications
- **Paiements** : Historique et solde

#### Exemple d'utilisation :

```typescript
import { DriverService } from '../services/driverService';

// Récupérer le profil
const profile = await DriverService.getProfile(driverId);

// Mettre à jour la disponibilité
await DriverService.updateAvailability(driverId, true);

// Démarrer une session
const sessionId = await DriverService.startWorkSession(driverId);
```

## 🎣 Hooks Personnalisés

### useDriver

Hook principal pour gérer l'état du chauffeur connecté.

#### État retourné :
- `profile` : Profil du chauffeur
- `stats` : Statistiques de performance
- `activeSession` : Session de travail active
- `loading` : État de chargement
- `error` : Erreurs éventuelles

#### Actions disponibles :
- `updateAvailability()` : Changer la disponibilité
- `startWorkSession()` : Démarrer une session
- `endWorkSession()` : Terminer une session
- `updateProfile()` : Mettre à jour le profil
- `refresh()` : Recharger toutes les données

#### Exemple d'utilisation :

```typescript
import { useDriver } from '../hooks';

const MyComponent = () => {
  const { 
    profile, 
    stats, 
    isAvailable, 
    updateAvailability,
    startWorkSession 
  } = useDriver();

  const handleToggleAvailability = async () => {
    await updateAvailability(!isAvailable);
  };

  return (
    <View>
      <Text>Bonjour {profile?.first_name}</Text>
      <Text>Gains totaux : €{stats?.total_earnings}</Text>
    </View>
  );
};
```

### useOrders

Hook pour gérer les commandes et offres de livraison.

#### État retourné :
- `assignedOrders` : Commandes assignées au chauffeur
- `availableOffers` : Offres disponibles
- `loading` : État de chargement
- `error` : Erreurs éventuelles

#### Actions disponibles :
- `acceptOffer()` : Accepter une offre
- `markAsPickedUp()` : Marquer comme récupéré
- `markAsDelivered()` : Marquer comme livré
- `getOrderDetails()` : Obtenir les détails d'une commande

#### Exemple d'utilisation :

```typescript
import { useOrders } from '../hooks';

const OrdersComponent = () => {
  const { 
    assignedOrders, 
    availableOffers, 
    acceptOffer,
    markAsDelivered 
  } = useOrders();

  const handleAcceptOffer = async (offerId: string) => {
    const success = await acceptOffer(offerId);
    if (success) {
      console.log('Offre acceptée !');
    }
  };

  return (
    <View>
      {assignedOrders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </View>
  );
};
```

### useNotifications

Hook pour gérer les notifications en temps réel.

#### État retourné :
- `notifications` : Liste des notifications
- `unreadCount` : Nombre de notifications non lues
- `loading` : État de chargement

#### Actions disponibles :
- `markAsRead()` : Marquer comme lue
- `markAllAsRead()` : Marquer toutes comme lues
- `deleteNotification()` : Supprimer une notification

#### Exemple d'utilisation :

```typescript
import { useNotifications } from '../hooks';

const NotificationComponent = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead,
    markAllAsRead 
  } = useNotifications();

  return (
    <View>
      <Text>Notifications ({unreadCount})</Text>
      {notifications.map(notification => (
        <TouchableOpacity 
          key={notification.id}
          onPress={() => markAsRead(notification.id)}
        >
          <Text>{notification.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

### useLocation

Hook pour gérer la géolocalisation du chauffeur.

#### État retourné :
- `location` : Position actuelle
- `isTracking` : État du suivi GPS
- `permissionStatus` : Statut des permissions
- `error` : Erreurs éventuelles

#### Actions disponibles :
- `requestPermissions()` : Demander les permissions
- `getCurrentLocation()` : Obtenir la position actuelle
- `startLocationTracking()` : Démarrer le suivi
- `stopLocationTracking()` : Arrêter le suivi
- `calculateDistance()` : Calculer la distance entre deux points

#### Exemple d'utilisation :

```typescript
import { useLocation } from '../hooks';

const LocationComponent = () => {
  const { 
    location, 
    isTracking, 
    startLocationTracking,
    stopLocationTracking,
    hasPermission 
  } = useLocation();

  const toggleTracking = async () => {
    if (isTracking) {
      stopLocationTracking();
    } else {
      await startLocationTracking();
    }
  };

  return (
    <View>
      <Text>Position : {location?.latitude}, {location?.longitude}</Text>
      <TouchableOpacity onPress={toggleTracking}>
        <Text>{isTracking ? 'Arrêter GPS' : 'Démarrer GPS'}</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## 🔄 Temps Réel

Les hooks utilisent les subscriptions Supabase pour les mises à jour en temps réel :

- **Commandes** : Nouvelles commandes assignées
- **Offres** : Nouvelles offres disponibles
- **Notifications** : Nouvelles notifications
- **Statut** : Changements de statut des commandes

## 🎯 Bonnes Pratiques

1. **Toujours utiliser les hooks** plutôt que d'appeler directement les services
2. **Gérer les états de chargement** pour une meilleure UX
3. **Traiter les erreurs** avec des messages utilisateur appropriés
4. **Utiliser les callbacks** pour éviter les re-renders inutiles
5. **Nettoyer les subscriptions** dans les useEffect

## 🚀 Exemple d'Intégration Complète

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useDriver, useOrders, useNotifications, useLocation } from '../hooks';

const DashboardScreen = () => {
  const { profile, stats, isAvailable, updateAvailability } = useDriver();
  const { assignedOrders, availableOffers } = useOrders();
  const { unreadCount } = useNotifications();
  const { location, isTracking } = useLocation();

  return (
    <View>
      {/* Header avec profil */}
      <View>
        <Text>Bonjour {profile?.first_name}</Text>
        <Text>Gains : €{stats?.total_earnings}</Text>
        <Text>Notifications : {unreadCount}</Text>
      </View>

      {/* Statuts */}
      <View>
        <TouchableOpacity onPress={() => updateAvailability(!isAvailable)}>
          <Text>Statut : {isAvailable ? 'Disponible' : 'Indisponible'}</Text>
        </TouchableOpacity>
        <Text>GPS : {isTracking ? 'Actif' : 'Inactif'}</Text>
      </View>

      {/* Commandes */}
      <View>
        <Text>Commandes assignées : {assignedOrders.length}</Text>
        <Text>Offres disponibles : {availableOffers.length}</Text>
      </View>
    </View>
  );
};
```

## 📝 Notes Importantes

- Tous les hooks nécessitent que l'utilisateur soit connecté
- Les permissions de localisation sont gérées automatiquement
- Les erreurs sont loggées dans la console pour le debug
- Les données sont mises en cache localement pour de meilleures performances 