# Adaptation des Offres - Commandes Programmées

## 📋 Vue d'ensemble

Les **offres** dans l'application BraPrime Driver représentent les **commandes programmées** qui sont à l'état **"prêt"** et disponibles pour les chauffeurs. Cette adaptation permet aux chauffeurs de voir et d'accepter des commandes qui ont été programmées à l'avance.

## 🔄 Changements apportés

### 1. **Nouvelle interface `ProgrammedOrder`**
```typescript
interface ProgrammedOrder {
  id: string;
  order_id: string;
  business_name: string;
  customer_name: string;
  order_details: string;
  pickup_address: string;
  delivery_address: string;
  estimated_distance: number;
  estimated_duration: number;
  driver_earnings: number;
  scheduled_delivery_window_start: string;
  scheduled_delivery_window_end: string;
  created_at: string;
}
```

### 2. **Requête Supabase adaptée**
La requête récupère maintenant les vraies commandes depuis la base de données :

```typescript
let query = supabase
  .from('orders')
  .select(`
    id,
    business_id,
    user_id,
    status,
    grand_total,
    delivery_fee,
    delivery_address,
    pickup_coordinates,
    delivery_coordinates,
    scheduled_delivery_window_start,
    scheduled_delivery_window_end,
    created_at,
    business:businesses(id, name, address),
    user:user_profiles(id, name, phone_number),
    order_items(id, name, quantity, price)
  `)
  .eq('status', 'ready')                    // Commandes prêtes
  .eq('available_for_drivers', true)        // Disponibles pour les chauffeurs
  .is('driver_id', null)                    // Non assignées
  .order('scheduled_delivery_window_start', { ascending: true });
```

### 3. **Filtrage selon le type de chauffeur**
- **Chauffeurs indépendants** : Voir toutes les commandes programmées disponibles
- **Chauffeurs de service** : Voir uniquement les commandes de leur business

### 4. **Calcul automatique des gains**
```typescript
// Calculer les gains du chauffeur (15% par défaut)
const driverEarnings = Math.round((order.grand_total * 0.15) / 100);
```

### 5. **Affichage des fenêtres de livraison**
```typescript
const formatDeliveryTime = (startTime: string, endTime: string) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const startFormatted = start.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const endFormatted = end.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return `${startFormatted} - ${endFormatted}`;
};
```

## 🎯 Fonctionnalités implémentées

### **Chargement des offres**
- Récupération des commandes programmées à l'état "prêt"
- Filtrage selon le type de chauffeur (indépendant/service)
- Calcul automatique des gains, distances et durées
- Tri par fenêtre de livraison

### **Acceptation d'offres**
- Mise à jour de la commande avec l'ID du chauffeur
- Changement du statut vers "confirmed"
- Désactivation de la disponibilité pour les autres chauffeurs
- Ajout au contexte local pour le calendrier

### **Interface utilisateur**
- Affichage de l'heure de livraison programmée
- Détails de la commande (articles et quantités)
- Informations du client
- Gains estimés, distance et durée
- Pull-to-refresh pour actualiser les offres

## 📊 Structure des données

### **Table `orders` (selon le schéma)**
```sql
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  business_id integer,
  status character varying DEFAULT 'pending',
  grand_total integer NOT NULL,
  delivery_fee integer DEFAULT 0,
  delivery_address text,
  pickup_coordinates jsonb,
  delivery_coordinates jsonb,
  driver_id uuid,
  scheduled_delivery_window_start timestamp with time zone,
  scheduled_delivery_window_end timestamp with time zone,
  available_for_drivers boolean DEFAULT false,
  -- ... autres champs
);
```

### **Champs clés utilisés**
- `status = 'ready'` : Commande prête à être livrée
- `available_for_drivers = true` : Disponible pour les chauffeurs
- `driver_id IS NULL` : Non assignée à un chauffeur
- `scheduled_delivery_window_*` : Fenêtre de livraison programmée

## 🔧 Logique métier

### **Pour les chauffeurs indépendants**
- Peuvent voir toutes les commandes programmées disponibles
- Pas de restriction par business
- Accès à un plus large éventail d'offres

### **Pour les chauffeurs de service**
- Voir uniquement les commandes de leur business
- Filtrage automatique par `business_id`
- Offres plus ciblées et cohérentes

### **Calcul des gains**
- **15% par défaut** du montant total de la commande
- Calcul basé sur `grand_total`
- Conversion en centimes pour la précision

## 🎨 Améliorations UI/UX

### **Nouveaux éléments visuels**
- **Header avec sous-titre** : "Commandes programmées prêtes à être livrées"
- **Horloge de livraison** : Affichage de la fenêtre de livraison
- **Informations client** : Nom du client avec icône
- **Durée estimée** : Temps de livraison estimé
- **États de chargement** : Indicateurs visuels pendant le chargement

### **Messages contextuels**
- **Chauffeurs indépendants** : "Aucune commande programmée disponible pour le moment"
- **Chauffeurs de service** : "Aucune commande de votre service disponible pour le moment"

## 🔄 Intégration avec le système

### **Contexte des offres**
Les offres acceptées sont ajoutées au `OffersContext` pour :
- Affichage dans le calendrier
- Gestion des commandes acceptées
- Suivi des livraisons programmées

### **Navigation**
- Intégration dans l'onglet "Offres" de la navigation principale
- Accessible depuis le menu de navigation
- Synchronisation avec les autres écrans

## ✅ Avantages de cette approche

1. **Données réelles** : Utilisation des vraies commandes de la base de données
2. **Flexibilité** : Adaptation selon le type de chauffeur
3. **Précision** : Calculs automatiques des gains et distances
4. **Programmation** : Gestion des fenêtres de livraison
5. **Performance** : Requêtes optimisées avec filtres appropriés
6. **UX améliorée** : Interface claire et informative

## 🚀 Prochaines étapes possibles

1. **Notifications en temps réel** : Alertes pour nouvelles offres
2. **Géolocalisation** : Calcul de distance basé sur la position GPS
3. **Historique des offres** : Suivi des offres acceptées/refusées
4. **Système de notation** : Évaluation des offres par les chauffeurs
5. **Optimisation des gains** : Algorithme de calcul plus sophistiqué
