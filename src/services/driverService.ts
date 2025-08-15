import { supabase } from '../lib/supabase';
import { Driver, Order, DeliveryOffer, Notification } from '../lib/supabase';

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  business_id?: number;
  business_name?: string;
  business_type?: string;
  is_active: boolean;
  current_location?: any;
  current_order_id?: string;
  rating: number;
  total_deliveries: number;
  total_earnings: number;
  vehicle_type?: string;
  vehicle_plate?: string;
  is_verified: boolean;
  avatar_url?: string;
  // Champs calculés
  is_independent: boolean;
}

export interface Business {
  id: number;
  name: string;
  description?: string;
  business_type_id: number;
  business_type_name?: string;
  category_id: number;
  category_name?: string;
  cover_image?: string;
  logo?: string;
  rating: number;
  review_count: number;
  delivery_time: string;
  delivery_fee: number;
  address: string;
  phone?: string;
  email?: string;
  opening_hours?: string;
  cuisine_type?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  is_open: boolean;
  owner_id?: string;
}

export interface DriverStats {
  total_deliveries: number;
  total_earnings: number;
  current_month_deliveries: number;
  current_month_earnings: number;
  average_rating: number;
  online_hours: number;
  // Stats spécifiques au business
  business_deliveries?: number;
  business_earnings?: number;
}

export interface WorkSession {
  id: string;
  driver_id: string;
  start_time: string;
  end_time?: string;
  total_earnings: number;
  total_deliveries: number;
  total_distance: number;
  status: 'active' | 'completed' | 'paused';
  business_id?: number;
}

export interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: 'license' | 'registration' | 'insurance' | 'identity';
  document_number?: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  expiry_date?: string;
  verified_at?: string;
  verified_by?: string;
}

export class DriverService {
  // =====================================================
  // GESTION DU PROFIL
  // =====================================================

  /**
   * Récupérer le profil du chauffeur connecté
   */
  static async getProfile(driverId: string): Promise<DriverProfile | null> {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          business:businesses(
            id,
            name,
            business_type_id,
            category_id,
            business_types(name),
            categories(name)
          )
        `)
        .eq('id', driverId)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        return null;
      }

      // Transformer les données pour correspondre à l'interface
      const profile: DriverProfile = {
        ...data,
        business_id: data.business?.id,
        business_name: data.business?.name,
        business_type: data.business?.business_types?.name,
        is_independent: !data.business_id,
      };

      return profile;
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return null;
    }
  }

  /**
   * Mettre à jour le profil du chauffeur
   */
  static async updateProfile(driverId: string, updates: Partial<DriverProfile>): Promise<boolean> {
    try {
      // Filtrer les champs qui ne sont pas dans la table drivers
      const { business_id, business_name, business_type, is_independent, ...driverUpdates } = updates;

      const { error } = await supabase
        .from('drivers')
        .update(driverUpdates)
        .eq('id', driverId);

      if (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return false;
    }
  }

  /**
   * Assigner un chauffeur à un business
   */
  static async assignToBusiness(driverId: string, businessId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ business_id: businessId })
        .eq('id', driverId);

      if (error) {
        console.error('Erreur lors de l\'assignation au business:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return false;
    }
  }

  /**
   * Retirer un chauffeur d'un business (devenir indépendant)
   */
  static async removeFromBusiness(driverId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ business_id: null })
        .eq('id', driverId);

      if (error) {
        console.error('Erreur lors du retrait du business:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return false;
    }
  }

  /**
   * Récupérer les businesses disponibles
   */
  static async getBusinesses(): Promise<Business[]> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          business_types(name),
          categories(name)
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des businesses:', error);
        return [];
      }

      return data?.map(business => ({
        ...business,
        business_type_name: business.business_types?.name,
        category_name: business.categories?.name,
      })) || [];
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return [];
    }
  }

  /**
   * Récupérer les détails d'un business
   */
  static async getBusiness(businessId: number): Promise<Business | null> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          business_types(name),
          categories(name)
        `)
        .eq('id', businessId)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du business:', error);
        return null;
      }

      return {
        ...data,
        business_type_name: data.business_types?.name,
        category_name: data.categories?.name,
      };
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return null;
    }
  }

  /**
   * Changer la disponibilité du chauffeur
   */
  static async updateAvailability(driverId: string, isActive: boolean): Promise<boolean> {
    return this.updateProfile(driverId, { is_active: isActive });
  }

  /**
   * Mettre à jour l'avatar du chauffeur
   */
  static async updateAvatar(driverId: string, avatarUrl: string): Promise<boolean> {
    return this.updateProfile(driverId, { avatar_url: avatarUrl });
  }

  // =====================================================
  // STATISTIQUES ET PERFORMANCES
  // =====================================================

  /**
   * Récupérer les statistiques du chauffeur
   */
  static async getStats(driverId: string): Promise<DriverStats | null> {
    try {
      // Récupérer les données de base du chauffeur
      const profile = await this.getProfile(driverId);
      if (!profile) return null;

      // Calculer les statistiques depuis les commandes
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, delivery_fee, created_at, customer_rating')
        .eq('driver_id', driverId)
        .eq('status', 'delivered');

      if (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
        return null;
      }

      const totalDeliveries = orders?.length || 0;
      const totalEarnings = orders?.reduce((sum, order) => sum + (order.delivery_fee || 0), 0) || 0;
      const averageRating = orders?.length > 0 
        ? orders.reduce((sum, order) => sum + (order.customer_rating || 0), 0) / orders.length 
        : 0;

      // Calculer les stats du mois en cours
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const currentMonthOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startOfMonth && orderDate <= endOfMonth;
      }) || [];

      const currentMonthDeliveries = currentMonthOrders.length;
      const currentMonthEarnings = currentMonthOrders.reduce((sum, order) => sum + (order.delivery_fee || 0), 0);

      // Stats spécifiques au business si applicable
      let businessStats = {};
      if (profile.business_id) {
        const businessDeliveries = orders?.filter(order => order.business_id === profile.business_id).length || 0;
        const businessEarnings = orders
          ?.filter(order => order.business_id === profile.business_id)
          .reduce((sum, order) => sum + (order.delivery_fee || 0), 0) || 0;

        businessStats = {
          business_deliveries: businessDeliveries,
          business_earnings: businessEarnings,
        };
      }

      return {
        total_deliveries: totalDeliveries,
        total_earnings: totalEarnings,
        current_month_deliveries: currentMonthDeliveries,
        current_month_earnings: currentMonthEarnings,
        average_rating: averageRating,
        online_hours: 0, // À calculer depuis work_sessions
        ...businessStats,
      };
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return null;
    }
  }

  /**
   * Récupérer l'historique des livraisons
   */
  static async getDeliveryHistory(driverId: string, limit = 50, offset = 0, businessId?: number): Promise<Order[]> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          business:businesses(name, address, phone, rating)
        `)
        .eq('driver_id', driverId)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filtrer par business si spécifié
      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return [];
    }
  }

  // =====================================================
  // SESSIONS DE TRAVAIL
  // =====================================================

  /**
   * Démarrer une session de travail
   */
  static async startWorkSession(driverId: string, businessId?: number): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('work_sessions')
        .insert({
          driver_id: driverId,
          business_id: businessId,
          start_time: new Date().toISOString(),
          status: 'active',
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erreur lors du démarrage de la session:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return null;
    }
  }

  /**
   * Terminer une session de travail
   */
  static async endWorkSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('work_sessions')
        .update({
          end_time: new Date().toISOString(),
          status: 'completed',
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Erreur lors de la fin de session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return false;
    }
  }

  /**
   * Récupérer la session active
   */
  static async getActiveSession(driverId: string): Promise<WorkSession | null> {
    try {
      const { data, error } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('driver_id', driverId)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Aucune session active trouvée
          return null;
        }
        console.error('Erreur lors de la récupération de la session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return null;
    }
  }

  // =====================================================
  // DOCUMENTS
  // =====================================================

  /**
   * Récupérer les documents du chauffeur
   */
  static async getDocuments(driverId: string): Promise<DriverDocument[]> {
    try {
      const { data, error } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return [];
    }
  }

  /**
   * Ajouter un document
   */
  static async addDocument(driverId: string, document: Omit<DriverDocument, 'id' | 'driver_id'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('driver_documents')
        .insert({
          driver_id: driverId,
          ...document,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erreur lors de l\'ajout du document:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return null;
    }
  }

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  /**
   * Récupérer les notifications non lues
   */
  static async getUnreadNotifications(driverId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', driverId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return [];
    }
  }

  /**
   * Marquer une notification comme lue
   */
  static async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Erreur lors du marquage comme lu:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return false;
    }
  }

  // =====================================================
  // PAIEMENTS
  // =====================================================

  /**
   * Récupérer l'historique des paiements
   */
  static async getPaymentHistory(driverId: string, limit = 50, offset = 0, businessId?: number): Promise<any[]> {
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          order:orders(order_number, total, delivery_fee, business_id)
        `)
        .eq('order.driver_id', driverId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filtrer par business si spécifié
      if (businessId) {
        query = query.eq('order.business_id', businessId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des paiements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return [];
    }
  }

  /**
   * Récupérer le solde actuel
   */
  static async getCurrentBalance(driverId: string, businessId?: number): Promise<number> {
    try {
      let query = supabase
        .from('payments')
        .select('amount')
        .eq('order.driver_id', driverId)
        .eq('status', 'completed');

      // Filtrer par business si spécifié
      if (businessId) {
        query = query.eq('order.business_id', businessId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération du solde:', error);
        return 0;
      }

      return data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return 0;
    }
  }
} 