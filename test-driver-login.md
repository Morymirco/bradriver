# Test de Connexion Chauffeur - BraDriver

## 🚨 **Problème Identifié**

Le compte chauffeur a été créé avec succès dans `@BraPrime-admin/` :
```json
{
  "success": true,
  "userId": "51db46fa-0a10-4241-adb2-9596c1908e88",
  "driverProfileId": "51db46fa-0a10-4241-adb2-9596c1908e88",
  "tempPassword": "3*EVkU5FSIoP",
  "message": "Compte chauffeur créé avec succès pour John Doe"
}
```

Mais la connexion échoue dans `@bradriver/`.

## 🔍 **Diagnostic du Problème**

### **1. Vérifier la Configuration Supabase**

**BraPrime-admin** utilise probablement une base Supabase différente de **bradriver**.

**Vérifier dans `bradriver/src/config/env.ts` :**
```typescript
export const SUPABASE_CONFIG = {
  URL: 'https://jeumizxzlwjvgerrcpjr.supabase.co',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

**Vérifier dans `BraPrime-admin`** quelle base Supabase est utilisée.

### **2. Vérifier la Structure des Tables**

**bradriver** attend ces tables :
- `auth.users` (Supabase Auth)
- `user_profiles`
- `driver_profiles`
- `user_roles`

**BraPrime-admin** a créé le compte dans :
- `auth.users`
- `user_profiles` 
- `driver_profiles`

### **3. Test de Connexion Directe**

#### **Étape 1 : Vérifier la Base de Données**
```sql
-- Dans la base Supabase de bradriver
SELECT * FROM auth.users WHERE email = 'test.driver@example.com';
SELECT * FROM user_profiles WHERE email = 'test.driver@example.com';
SELECT * FROM driver_profiles WHERE email = 'test.driver@example.com';
```

#### **Étape 2 : Vérifier les Rôles**
```sql
-- Vérifier que le rôle 'driver' existe
SELECT * FROM user_roles WHERE name = 'driver';

-- Vérifier que l'utilisateur a le bon rôle
SELECT 
  up.id,
  up.name,
  up.email,
  ur.name as role_name
FROM user_profiles up
JOIN user_roles ur ON up.role_id = ur.id
WHERE up.email = 'test.driver@example.com';
```

#### **Étape 3 : Test de Connexion Supabase**
```typescript
// Dans la console du navigateur ou via une API
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test.driver@example.com',
  password: '3*EVkU5FSIoP'
});

console.log('Connexion:', { data, error });
```

## 🛠️ **Solutions Possibles**

### **Solution 1 : Synchroniser les Bases de Données**
Si les deux projets utilisent des bases différentes :

1. **Exporter le schéma** de `BraPrime-admin`
2. **Importer dans bradriver** ou vice versa
3. **Synchroniser les données** des utilisateurs

### **Solution 2 : Utiliser la Même Base Supabase**
1. **Vérifier** que les deux projets pointent vers la même base
2. **Mettre à jour** les variables d'environnement si nécessaire

### **Solution 3 : Créer le Compte Directement dans bradriver**
1. **Utiliser l'écran d'inscription** de bradriver
2. **Ou créer via l'API** de bradriver

## 🧪 **Tests à Effectuer**

### **Test 1 : Vérification de la Base**
```bash
# Dans bradriver
cd bradriver
npm start
# Tester la connexion avec les identifiants
```

### **Test 2 : Logs de Connexion**
Vérifier les logs dans la console :
- Erreurs Supabase
- Erreurs de validation
- Erreurs de rôle

### **Test 3 : Structure des Tables**
Comparer la structure des tables entre les deux projets :
- Noms des colonnes
- Types de données
- Contraintes

## 📋 **Checklist de Résolution**

- [ ] **Vérifier** que les deux projets utilisent la même base Supabase
- [ ] **Comparer** la structure des tables
- [ ] **Tester** la connexion directe via Supabase
- [ ] **Vérifier** les rôles et permissions
- [ ] **Synchroniser** les bases si nécessaire
- [ ] **Tester** la connexion dans bradriver

## 🔧 **Commandes de Test**

### **Vérifier la Connexion Supabase**
```typescript
// Dans la console du navigateur
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test.driver@example.com',
  password: '3*EVkU5FSIoP'
});
```

### **Vérifier le Profil Utilisateur**
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('email', 'test.driver@example.com')
  .single();
```

### **Vérifier le Profil Chauffeur**
```typescript
const { data, error } = await supabase
  .from('driver_profiles')
  .select('*')
  .eq('email', 'test.driver@example.com')
  .single();
```

## 📞 **Support**

Si le problème persiste :
1. **Vérifier** les logs d'erreur
2. **Comparer** les configurations Supabase
3. **Tester** avec un compte créé directement dans bradriver
4. **Vérifier** la synchronisation des bases de données
