# 🔄 Adaptation du Flux de Connexion - Nouveau Schéma Supabase

## 📋 **Résumé des Changements**

Le flux de connexion de BraPrime Driver a été adapté pour correspondre au nouveau schéma Supabase qui utilise une architecture plus modulaire avec séparation des responsabilités.

## 🏗️ **Nouvelle Architecture**

### **Structure des Tables**

#### **1. `user_profiles` (Profil Utilisateur Central)**
```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name varchar NOT NULL,
  email varchar NOT NULL UNIQUE,
  role_id integer REFERENCES user_roles(id),
  phone_number varchar,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  -- ... autres champs
);
```

#### **2. `driver_profiles` (Profil Spécifique Chauffeur)**
```sql
CREATE TABLE driver_profiles (
  id uuid PRIMARY KEY REFERENCES user_profiles(id),
  name text,
  email text,
  phone_number text,
  type driver_type DEFAULT 'independent',
  business_id integer REFERENCES businesses(id),
  vehicle_type varchar,
  vehicle_plate varchar,
  is_active boolean DEFAULT true,
  is_available boolean DEFAULT true,
  avatar_url text,
  -- ... autres champs
);
```

#### **3. `driver_orders` (Commandes Spécifiques Chauffeur)**
```sql
CREATE TABLE driver_orders (
  id uuid PRIMARY KEY,
  driver_id uuid REFERENCES driver_profiles(id),
  order_id uuid REFERENCES orders(id),
  pickup_address text NOT NULL,
  delivery_address text NOT NULL,
  driver_earnings numeric DEFAULT 0,
  status driver_order_type DEFAULT 'pending',
  -- ... autres champs
);
```

## 🔐 **Nouveau Flux de Connexion**

### **Étape 1 : Authentification Supabase**
```typescript
// DriverAuthService.login()
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: loginData.email,
  password: loginData.password
});
```

### **Étape 2 : Vérification du Rôle**
```typescript
// Vérifier que l'utilisateur a le rôle 'driver'
const { data: userProfile } = await supabase
  .from('user_profiles')
  .select(`
    id, name, email, phone_number, is_active, is_verified,
    user_roles (name)
  `)
  .eq('id', authUserId)
  .single();

if (userProfile.user_roles?.name !== 'driver') {
  throw new Error('Utilisateur non autorisé (rôle driver requis)');
}
```

### **Étape 3 : Récupération du Profil Driver**
```typescript
// Récupérer les données spécifiques du chauffeur
const { data: driver } = await supabase
  .from('driver_profiles')
  .select(`
    id, name, email, phone_number, type, business_id,
    is_active, is_available, vehicle_type, vehicle_plate,
    avatar_url, created_at,
    businesses (name)
  `)
  .eq('id', authUserId)
  .single();
```

### **Étape 4 : Calcul des Statistiques**
```typescript
// Calculer les statistiques depuis driver_orders
const { data: driverStats } = await supabase
  .from('driver_orders')
  .select('id, driver_earnings, status')
  .eq('driver_id', authUserId);

const totalDeliveries = driverStats?.filter(order => order.status === 'delivered').length || 0;
const totalEarnings = driverStats?.reduce((sum, order) => sum + (order.driver_earnings || 0), 0) || 0;
```

## 🔄 **Adaptations des Services**

### **1. DriverAuthService**

#### **Changements Principaux :**
- **Inscription** : Création dans `user_profiles` + `driver_profiles`
- **Connexion** : Vérification du rôle + récupération des données driver
- **Profil** : Mise à jour synchronisée entre les deux tables

#### **Nouvelle Interface DriverAuthData :**
```typescript
interface DriverAuthData {
  id: string;
  email: string;
  phone_number: string; // Changé de 'phone'
  name: string;
  type: 'independent' | 'service'; // Changé de 'driver_type'
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
  is_available: boolean; // Changé de 'active_sessions'
  created_at: string;
}
```

### **2. DriverDashboardService**

#### **Changements Principaux :**
- **Commandes** : Utilisation de `driver_orders` au lieu de `orders`
- **Statistiques** : Calcul depuis `driver_orders`
- **Détails** : Jointure avec `orders` pour les informations complètes

#### **Nouvelle Interface DriverOrder :**
```typescript
interface DriverOrder {
  id: string;
  order_id: string;
  pickup_address: string;
  delivery_address: string;
  driver_earnings: number;
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
  // ... autres champs
  order?: {
    id: string;
    order_number: string;
    business?: { name: string; address: string; };
    user?: { name: string; phone_number: string; };
    // ... autres données de la commande principale
  };
}
```

### **3. Hook useDriver**

#### **Adaptations :**
- **Propriétés** : Adaptation aux nouveaux noms de champs
- **Actions** : Mise à jour synchronisée des profils
- **Statistiques** : Calcul en temps réel depuis `driver_orders`

## 🔒 **Sécurité et Politiques RLS**

### **Politiques Mises à Jour :**
```sql
-- Politiques pour user_profiles
CREATE POLICY "Users can view own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid()::text = id::text);

-- Politiques pour driver_profiles
CREATE POLICY "Drivers can view own profile" 
ON driver_profiles FOR SELECT 
USING (auth.uid()::text = id::text);

-- Politiques pour driver_orders
CREATE POLICY "Drivers can view own orders" 
ON driver_orders FOR SELECT 
USING (driver_id::text = auth.uid()::text);
```

## 📊 **Avantages de la Nouvelle Architecture**

### **1. Séparation des Responsabilités**
- **`user_profiles`** : Données utilisateur générales
- **`driver_profiles`** : Données spécifiques chauffeur
- **`driver_orders`** : Commandes et gains chauffeur

### **2. Flexibilité**
- Support de différents types d'utilisateurs (clients, restaurants, chauffeurs)
- Extension facile pour de nouveaux rôles
- Gestion centralisée des rôles

### **3. Performance**
- Requêtes optimisées avec jointures appropriées
- Index sur les clés étrangères
- Calculs de statistiques en temps réel

### **4. Maintenabilité**
- Code modulaire et réutilisable
- Interfaces TypeScript cohérentes
- Gestion d'erreurs centralisée

## 🚀 **Migration et Compatibilité**

### **Points d'Attention :**
1. **Noms de champs** : `phone` → `phone_number`, `driver_type` → `type`
2. **Tables** : `drivers` → `driver_profiles`, `orders` → `driver_orders`
3. **Relations** : Nouvelle logique de jointures
4. **Statistiques** : Calcul depuis `driver_orders` au lieu de champs stockés

### **Tests Recommandés :**
1. **Inscription** : Création complète des profils
2. **Connexion** : Vérification du rôle et récupération des données
3. **Commandes** : Affichage et mise à jour des statuts
4. **Statistiques** : Calcul correct des gains et livraisons
5. **Profil** : Mise à jour synchronisée

## 📝 **Conclusion**

Le nouveau flux de connexion offre une architecture plus robuste et scalable, avec une meilleure séparation des responsabilités et une gestion plus fine des données utilisateur. Les adaptations maintiennent la compatibilité avec l'interface utilisateur existante tout en améliorant la structure backend.
