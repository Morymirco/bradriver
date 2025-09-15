// Configuration des variables d'environnement
// Clés Supabase réelles

export const SUPABASE_CONFIG = {
  // URL de votre projet Supabase
  URL: 'https://jeumizxzlwjvgerrcpjr.supabase.co',
  
  // Clé anonyme publique (sécurisée pour le client)
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldW1penh6bHdqdmdlcnJjcGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTczNjEsImV4cCI6MjA2NjEzMzM2MX0.KnkibttgTcUkz0KZYzRxTeybghlCj_VnnVlcDyUFZ-Q',
  
  // Clé de service (à utiliser uniquement côté serveur)
  SERVICE_ROLE_KEY: 'VOTRE_CLE_SERVICE_SUPABASE', // À configurer si nécessaire
};

// Configuration de l'API backend
export const API_CONFIG = {
  // URL de l'API backend pour les notifications email
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
  
  // Endpoints pour les notifications
  ENDPOINTS: {
    DRIVER_NOTIFICATION: '/api/emails/driver-notification',
    ORDER_UPDATE: '/api/orders/update',
    PAYMENT_NOTIFICATION: '/api/payments/notification',
  },
};

// Configuration de l'application
export const APP_CONFIG = {
  // Nom de l'application
  NAME: 'BraPrime Driver',
  
  // Version de l'application
  VERSION: '1.0.0',
  
  // URL de l'API (si vous avez une API séparée)
  API_URL: 'https://api.braprime.com',
  
  // Configuration des notifications
  NOTIFICATIONS: {
    ENABLED: true,
    SOUND_ENABLED: true,
    VIBRATION_ENABLED: true,
  },
  
  // Configuration de la géolocalisation
  LOCATION: {
    ENABLED: true,
    ACCURACY: 'high', // 'low', 'balanced', 'high'
    DISTANCE_FILTER: 10, // en mètres
    UPDATE_INTERVAL: 5000, // en millisecondes
  },
  
  // Configuration des paiements
  PAYMENTS: {
    CURRENCY: 'EUR',
    STRIPE_PUBLISHABLE_KEY: 'VOTRE_CLE_STRIPE_PUBLISHABLE',
  },
};

// Messages d'erreur personnalisés
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion. Vérifiez votre connexion internet.',
  AUTH_ERROR: 'Erreur d\'authentification. Vérifiez vos identifiants.',
  PERMISSION_ERROR: 'Vous n\'avez pas les permissions nécessaires.',
  VALIDATION_ERROR: 'Données invalides. Vérifiez les informations saisies.',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite.',
};

// Statuts des commandes
export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// Statuts des offres
export const OFFER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

// Types de notifications
export const NOTIFICATION_TYPES = {
  ORDER_UPDATE: 'order_update',
  NEW_OFFER: 'new_offer',
  PAYMENT: 'payment',
  SYSTEM: 'system',
} as const;

// Configuration des couleurs (cohérente avec votre thème)
export const COLORS = {
  PRIMARY: '#E31837',
  PRIMARY_LIGHT: '#FF4D6A',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  DARK_BG: '#181A20',
  DARK_CARD: '#23262F',
  DARK_TEXT: '#FFFFFF',
  GRAY_100: '#F3F4F6',
  GRAY_200: '#E5E7EB',
  GRAY_300: '#D1D5DB',
  GRAY_500: '#6B7280',
  GRAY_700: '#374151',
} as const;

// Configuration des distances et durées
export const DELIVERY_CONFIG = {
  MAX_DISTANCE: 50, // km
  MAX_DURATION: 120, // minutes
  MIN_DELIVERY_FEE: 2.50, // euros
  MAX_DELIVERY_FEE: 15.00, // euros
  RATING_THRESHOLD: 4.0, // note minimum pour être éligible
} as const;

// Configuration des sessions de travail
export const WORK_SESSION_CONFIG = {
  MAX_HOURS_PER_DAY: 12, // heures
  MIN_BREAK_DURATION: 30, // minutes
  MAX_CONSECUTIVE_HOURS: 4, // heures
} as const; 