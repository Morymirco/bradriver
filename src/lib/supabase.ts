import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config/env';

// Types pour les tables Supabase
export interface Driver {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  is_available: boolean;
  is_verified: boolean;
  rating: number;
  total_deliveries: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  rating: number;
  is_active: boolean;
  coordinates?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  coordinates?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  restaurant_id: string;
  client_id: string;
  driver_id?: string;
  status: 'pending' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
  pickup_address: string;
  delivery_address: string;
  pickup_coordinates?: string;
  delivery_coordinates?: string;
  estimated_pickup_time?: string;
  estimated_delivery_time?: string;
  actual_pickup_time?: string;
  actual_delivery_time?: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  created_at: string;
}

export interface DeliveryOffer {
  id: string;
  order_id: string;
  driver_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  offered_amount: number;
  estimated_duration?: number;
  estimated_distance?: number;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  user_type: 'driver' | 'client' | 'restaurant';
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  data?: any;
  created_at: string;
}

// Créer le client Supabase avec la configuration
export const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Fonctions utilitaires pour les chauffeurs
export const driverApi = {
  // Récupérer le profil du chauffeur connecté
  async getProfile(driverId: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .single();
    
    if (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
    
    return data;
  },

  // Mettre à jour le profil du chauffeur
  async updateProfile(driverId: string, updates: Partial<Driver>): Promise<boolean> {
    const { error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', driverId);
    
    if (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return false;
    }
    
    return true;
  },

  // Changer la disponibilité du chauffeur
  async updateAvailability(driverId: string, isAvailable: boolean): Promise<boolean> {
    return this.updateProfile(driverId, { is_available: isAvailable });
  }
};

// Fonctions utilitaires pour les commandes
export const orderApi = {
  // Récupérer les commandes assignées au chauffeur
  async getAssignedOrders(driverId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(name, address, phone),
        client:clients(first_name, last_name, phone, email)
      `)
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      return [];
    }
    
    return data || [];
  },

  // Mettre à jour le statut d'une commande
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
    if (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return false;
    }
    
    return true;
  },

  // Récupérer les détails d'une commande
  async getOrderDetails(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(name, address, phone, rating),
        client:clients(first_name, last_name, phone, email),
        order_items(*)
      `)
      .eq('id', orderId)
      .single();
    
    if (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      return null;
    }
    
    return data;
  }
};

// Fonctions utilitaires pour les offres
export const offerApi = {
  // Récupérer les offres disponibles
  async getAvailableOffers(): Promise<DeliveryOffer[]> {
    const { data, error } = await supabase
      .from('delivery_offers')
      .select(`
        *,
        order:orders(
          *,
          restaurant:restaurants(name, address),
          client:clients(first_name, last_name)
        )
      `)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des offres:', error);
      return [];
    }
    
    return data || [];
  },

  // Accepter une offre
  async acceptOffer(offerId: string, driverId: string): Promise<boolean> {
    const { error } = await supabase
      .from('delivery_offers')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', offerId)
      .eq('driver_id', driverId);
    
    if (error) {
      console.error('Erreur lors de l\'acceptation de l\'offre:', error);
      return false;
    }
    
    return true;
  }
};

// Fonctions utilitaires pour les notifications
export const notificationApi = {
  // Récupérer les notifications non lues
  async getUnreadNotifications(userId: string, userType: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
    
    return data || [];
  },

  // Marquer une notification comme lue
  async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      return false;
    }
    
    return true;
  }
};

export default supabase; 