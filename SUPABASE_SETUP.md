# 🚀 Configuration Supabase pour BraPrime Driver

Ce guide vous explique comment configurer Supabase pour votre application BraPrime Driver.

## 📋 Prérequis

- Un compte Supabase ([supabase.com](https://supabase.com))
- Node.js et npm installés
- Votre projet React Native configuré

## 🔧 Étapes de Configuration

### 1. Créer un Projet Supabase

1. Connectez-vous à [supabase.com](https://supabase.com)
2. Cliquez sur "New Project"
3. Choisissez votre organisation
4. Donnez un nom à votre projet (ex: "braprime-driver")
5. Créez un mot de passe pour la base de données
6. Choisissez une région proche de vos utilisateurs
7. Cliquez sur "Create new project"

### 2. Exécuter le Schéma SQL

1. Dans votre projet Supabase, allez dans "SQL Editor"
2. Copiez le contenu du fichier `supabase_schema.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur "Run" pour exécuter le script

### 3. Récupérer les Clés d'API

1. Dans votre projet Supabase, allez dans "Settings" > "API"
2. Copiez l'URL du projet (ex: `https://votre-projet.supabase.co`)
3. Copiez la clé anonyme publique (Anon public key)

### 4. Configurer les Variables d'Environnement

1. Ouvrez le fichier `src/config/env.ts`
2. Remplacez les valeurs par vos vraies clés :

```typescript
export const SUPABASE_CONFIG = {
  URL: 'https://votre-projet.supabase.co', // Votre URL Supabase
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // Votre clé anonyme
  SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // Votre clé de service
};
```

### 5. Configurer l'Authentification

1. Dans Supabase, allez dans "Authentication" > "Settings"
2. Configurez les paramètres suivants :
   - **Site URL** : `http://localhost:3000` (pour le développement)
   - **Redirect URLs** : Ajoutez les URLs de votre app
   - **Enable email confirmations** : Désactivé pour les tests
   - **Enable email change confirmations** : Désactivé pour les tests

### 6. Créer un Utilisateur de Test

1. Dans Supabase, allez dans "Authentication" > "Users"
2. Cliquez sur "Add user"
3. Créez un utilisateur avec :
   - Email : `chauffeur@braprime.com`
   - Password : `password123`
   - User metadata : 
     ```json
     {
       "first_name": "Ibrahim",
       "last_name": "Diallo",
       "phone": "+33 6 12 34 56 78"
     }
     ```

### 7. Configurer les Politiques RLS

Les politiques RLS sont déjà configurées dans le schéma SQL, mais vous pouvez les ajuster selon vos besoins dans "Authentication" > "Policies".

## 🧪 Tester la Configuration

### 1. Démarrer l'Application

```bash
npm start
```

### 2. Tester la Connexion

1. Ouvrez l'application
2. Utilisez les identifiants de test :
   - Email : `chauffeur@braprime.com`
   - Mot de passe : `password123`
3. Vérifiez que la connexion fonctionne

### 3. Vérifier les Données

1. Dans Supabase, allez dans "Table Editor"
2. Vérifiez que les tables sont créées
3. Vérifiez que les données de test sont présentes

## 🔒 Sécurité

### Variables d'Environnement (Production)

Pour la production, utilisez des variables d'environnement :

1. Créez un fichier `.env` :
```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Installez `react-native-dotenv` :
```bash
npm install react-native-dotenv
```

3. Configurez babel.config.js :
```javascript
module.exports = {
  plugins: [
    ["module:react-native-dotenv", {
      "moduleName": "@env",
      "path": ".env",
    }]
  ]
};
```

4. Utilisez les variables dans `src/config/env.ts` :
```typescript
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export const SUPABASE_CONFIG = {
  URL: SUPABASE_URL,
  ANON_KEY: SUPABASE_ANON_KEY,
};
```

## 🚨 Dépannage

### Erreur de Connexion

- Vérifiez que l'URL et la clé sont correctes
- Vérifiez que le projet Supabase est actif
- Vérifiez les logs dans la console

### Erreur d'Authentification

- Vérifiez que l'utilisateur existe dans Supabase
- Vérifiez que l'email est confirmé
- Vérifiez les politiques RLS

### Erreur de Base de Données

- Vérifiez que le schéma SQL a été exécuté
- Vérifiez les permissions des tables
- Vérifiez les contraintes de clés étrangères

## 📚 Ressources Utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Guide React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [API Reference](https://supabase.com/docs/reference/javascript)

## 🎯 Prochaines Étapes

1. **Configurer les notifications push** avec Supabase
2. **Intégrer la géolocalisation** en temps réel
3. **Configurer les paiements** avec Stripe
4. **Mettre en place les tests** automatisés
5. **Déployer en production** avec les bonnes variables d'environnement

---

**Note** : N'oubliez pas de ne jamais commiter vos vraies clés Supabase dans le code source. Utilisez toujours des variables d'environnement pour la production. 