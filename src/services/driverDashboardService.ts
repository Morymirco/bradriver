import { supabase } from '../lib/supabase';

export interface DriverOrder {
  id: string;
  order_id: string;
  pickup_address: string;
  delivery_address: string;
  pickup_coordinates: any;
  delivery_coordinates: any;
  delivery_instructions?: string;
  customer_instructions?: string;
  estimated_distance?: number;
  actual_distance?: number;
  estimated_duration?: number;
  actual_duration?: number;
  driver_earnings: number;
  driver_commission_percentage: number;
  assigned_at: string;
  picked_up_at?: string;
  delivered_at?: string;
  customer_rating?: number;
  driver_rating?: number;
  customer_review?: string;
  driver_review?: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
  metadata: any;
  created_at: string;
  updated_at: string;
  // Données de la commande principale
  order?: {
    id: string;
    order_number: string;
    total: number;
  delivery_fee: number;
    grand_total: number;
    delivery_method: string;
    payment_method: string;
    payment_status: string;
    estimated_delivery?: string;
    actual_delivery?: string;
    customer_rating?: number;
    customer_review?: string;
  created_at: string;
    business?: {
      id: number;
      name: string;
      address: string;
      phone?: string;
      rating: number;
    };
    user?: {
      id: string;
      name: string;
      phone_number?: string;
      email: string;
    };
  };
}

export interface DriverStats {
  total_deliveries: number;
  total_earnings: number;
  average_rating: number;
  total_distance: number;
  total_time: number;
  current_month_deliveries: number;
  current_month_earnings: number;
  is_available: boolean;
  is_active: boolean;
}

export class DriverDashboardService {
  // Récupérer les commandes du chauffeur
  static async getDriverOrders(): Promise<{ orders?: DriverOrder[]; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer le profil driver pour obtenir l'ID du driver
      const { data: driverProfile, error: profileError } = await supabase
        .from('driver_profiles')
        .select('id')
          .eq('id', user.id)
          .single();

        if (profileError) {
        throw new Error(profileError.message);
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          business_id,
          user_id,
          status,
          total,
          delivery_fee,
          grand_total,
          delivery_method,
          payment_method,
          payment_status,
          delivery_address,
          delivery_instructions,
          pickup_coordinates,
          delivery_coordinates,
          estimated_delivery,
          actual_delivery,
          customer_rating,
          customer_review,
          created_at,
          updated_at,
          assigned_at,
          businesses!inner(
            id,
            name,
            address,
            phone,
            rating
          ),
          user_profiles!inner(
            id,
            name,
            phone_number,
            email
          ),
          order_items(
            id,
            name,
            price,
            quantity,
            image,
            special_instructions
          )
        `)
        .eq('driver_id', driverProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Transformer les données pour correspondre à l'interface DriverOrder
      const transformedOrders: DriverOrder[] = (orders || []).map(order => {
        // Calculer les gains du chauffeur (15% par défaut)
        const driverEarnings = Math.round((order.grand_total * 0.15) / 100);
        
        // Calculer la distance estimée (simulation)
        const estimatedDistance = Math.round(Math.random() * 8 + 2);
        
        // Calculer la durée estimée (simulation)
        const estimatedDuration = Math.round(estimatedDistance * 3 + Math.random() * 10);

        return {
          id: order.id,
          order_id: order.id,
          pickup_address: order.businesses?.address || 'Adresse de récupération',
          delivery_address: order.delivery_address || 'Adresse de livraison',
          pickup_coordinates: order.pickup_coordinates,
          delivery_coordinates: order.delivery_coordinates,
          delivery_instructions: order.delivery_instructions,
          customer_instructions: order.delivery_instructions,
          estimated_distance: estimatedDistance,
          actual_distance: estimatedDistance,
          estimated_duration: estimatedDuration,
          actual_duration: estimatedDuration,
          driver_earnings: driverEarnings,
          driver_commission_percentage: 15,
          assigned_at: order.assigned_at || order.created_at,
          picked_up_at: order.actual_delivery,
          delivered_at: order.actual_delivery,
          customer_rating: order.customer_rating,
          driver_rating: order.customer_rating,
          customer_review: order.customer_review,
          driver_review: '',
          status: order.status as any,
          metadata: {},
          created_at: order.created_at,
          updated_at: order.updated_at,
          order: {
            id: order.id,
            order_number: order.order_number || order.id,
            total: order.total,
          delivery_fee: order.delivery_fee,
            grand_total: order.grand_total,
            delivery_method: order.delivery_method,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
          estimated_delivery: order.estimated_delivery,
          actual_delivery: order.actual_delivery,
            customer_rating: order.customer_rating,
            customer_review: order.customer_review,
            created_at: order.created_at,
            business: order.businesses ? {
              id: order.businesses.id,
              name: order.businesses.name,
              address: order.businesses.address,
              phone: order.businesses.phone,
              rating: order.businesses.rating
            } : undefined,
            user: order.user_profiles ? {
              id: order.user_profiles.id,
              name: order.user_profiles.name,
              phone_number: order.user_profiles.phone_number,
              email: order.user_profiles.email
            } : undefined,
            items: order.order_items || []
          }
        };
      });

      return { orders: transformedOrders };
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      return { error: error instanceof Error ? error.message : 'Erreur lors de la récupération' };
    }
  }

  // Récupérer les statistiques du chauffeur
  static async getDriverStats(): Promise<{ stats?: DriverStats; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer le profil driver
      const { data: driverProfile, error: profileError } = await supabase
        .from('driver_profiles')
        .select('is_available, is_active')
          .eq('id', user.id)
          .single();

        if (profileError) {
        throw new Error(profileError.message);
      }

      // Récupérer toutes les commandes du chauffeur
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          grand_total,
          customer_rating,
          status,
          created_at
        `)
        .eq('driver_id', driverProfile.id);
      
      if (ordersError) {
        throw new Error(ordersError.message);
      }

      const ordersList = orders || [];

      // Calculer les statistiques
      const totalDeliveries = ordersList.filter(order => order.status === 'delivered').length;
      const totalEarnings = ordersList.reduce((sum, order) => {
        const driverEarnings = Math.round((order.grand_total * 0.15) / 100);
        return sum + driverEarnings;
      }, 0);
      
      const ratings = ordersList
        .filter(order => order.customer_rating)
        .map(order => order.customer_rating!);
      const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

      // Simulation des distances et durées
      const totalDistance = ordersList.length * 5; // 5km par commande en moyenne
      const totalTime = ordersList.length * 20; // 20 min par commande en moyenne

      // Statistiques du mois en cours
      const currentMonth = new Date();
      const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const currentMonthOrders = ordersList.filter(order => 
        new Date(order.created_at) >= currentMonthStart
      );
      
      const currentMonthDeliveries = currentMonthOrders.filter(order => order.status === 'delivered').length;
      const currentMonthEarnings = currentMonthOrders.reduce((sum, order) => {
        const driverEarnings = Math.round((order.grand_total * 0.15) / 100);
        return sum + driverEarnings;
      }, 0);

      const stats: DriverStats = {
        total_deliveries: totalDeliveries,
        total_earnings: totalEarnings,
        average_rating: Math.round(averageRating * 10) / 10, // Arrondir à 1 décimale
        total_distance: Math.round(totalDistance * 100) / 100, // Arrondir à 2 décimales
        total_time: totalTime,
        current_month_deliveries: currentMonthDeliveries,
        current_month_earnings: currentMonthEarnings,
        is_available: driverProfile?.is_available || false,
        is_active: driverProfile?.is_active || false
      };

      return { stats };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { error: error instanceof Error ? error.message : 'Erreur lors de la récupération' };
    }
  }

  // Mettre à jour le statut d'une commande
  static async updateOrderStatus(orderId: string, status: DriverOrder['status']): Promise<{ error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer le profil driver pour obtenir l'ID du driver
      const { data: driverProfile, error: profileError } = await supabase
        .from('driver_profiles')
        .select('id')
          .eq('id', user.id)
          .single();

        if (profileError) {
        throw new Error(profileError.message);
      }

      const updateData: any = { status };

      // Ajouter les timestamps selon le statut
      if (status === 'picked_up') {
        updateData.picked_up_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .eq('driver_id', driverProfile.id);

      if (error) {
        throw new Error(error.message);
      }

      return {};
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return { error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour' };
    }
  }

  // Récupérer les détails d'une commande
  static async getOrderDetails(orderId: string): Promise<{ order?: DriverOrder; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer le profil driver pour obtenir l'ID du driver
      const { data: driverProfile, error: profileError } = await supabase
        .from('driver_profiles')
        .select('id')
          .eq('id', user.id)
          .single();

        if (profileError) {
        throw new Error(profileError.message);
      }

      // D'abord, vérifier que la commande appartient bien au chauffeur
      console.log('🔍 Recherche de la commande:', orderId);
      console.log('🔍 Driver ID:', driverProfile.id);
      
      const { data: orderCheck, error: checkError } = await supabase
        .from('orders')
        .select('id, driver_id')
        .eq('id', orderId)
        .single();

      if (checkError) {
        console.error('❌ Erreur lors de la vérification:', checkError);
        throw new Error('Commande non trouvée');
      }

      console.log('✅ Commande trouvée:', orderCheck);

      if (!orderCheck || orderCheck.driver_id !== driverProfile.id) {
        console.error('❌ Accès non autorisé - Driver ID de la commande:', orderCheck?.driver_id);
        throw new Error('Vous n\'êtes pas autorisé à accéder à cette commande');
      }

      // Maintenant récupérer les détails complets
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          business_id,
          user_id,
          status,
          total,
          delivery_fee,
          grand_total,
          delivery_method,
          payment_method,
          payment_status,
          delivery_address,
          delivery_instructions,
          pickup_coordinates,
          delivery_coordinates,
          estimated_delivery,
          actual_delivery,
          customer_rating,
          customer_review,
          created_at,
          updated_at,
          assigned_at,
          businesses(
            id,
            name,
            address,
            phone,
            rating
          ),
          user_profiles(
            id,
            name,
            phone_number,
            email
          ),
          order_items(
            id,
            name,
            price,
            quantity,
            image,
            special_instructions
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Transformer les données pour correspondre à l'interface DriverOrder
      if (order) {
        const driverEarnings = Math.round((order.grand_total * 0.15) / 100);
        const estimatedDistance = Math.round(Math.random() * 8 + 2);
        const estimatedDuration = Math.round(estimatedDistance * 3 + Math.random() * 10);

        const transformedOrder: DriverOrder = {
          id: order.id,
          order_id: order.id,
          pickup_address: order.businesses?.address || 'Adresse de récupération',
          delivery_address: order.delivery_address || 'Adresse de livraison',
          pickup_coordinates: order.pickup_coordinates,
          delivery_coordinates: order.delivery_coordinates,
          delivery_instructions: order.delivery_instructions,
          customer_instructions: order.delivery_instructions,
          estimated_distance: estimatedDistance,
          actual_distance: estimatedDistance,
          estimated_duration: estimatedDuration,
          actual_duration: estimatedDuration,
          driver_earnings: driverEarnings,
          driver_commission_percentage: 15,
          assigned_at: order.assigned_at || order.created_at,
          picked_up_at: order.actual_delivery,
          delivered_at: order.actual_delivery,
          customer_rating: order.customer_rating,
          driver_rating: order.customer_rating,
          customer_review: order.customer_review,
          driver_review: '',
          status: order.status as any,
          metadata: {},
          created_at: order.created_at,
          updated_at: order.updated_at,
          order: {
            id: order.id,
            order_number: order.order_number || order.id,
            total: order.total,
            delivery_fee: order.delivery_fee,
            grand_total: order.grand_total,
            delivery_method: order.delivery_method,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            estimated_delivery: order.estimated_delivery,
            actual_delivery: order.actual_delivery,
            customer_rating: order.customer_rating,
            customer_review: order.customer_review,
            created_at: order.created_at,
            business: order.businesses ? {
              id: order.businesses.id,
              name: order.businesses.name,
              address: order.businesses.address,
              phone: order.businesses.phone,
              rating: order.businesses.rating
            } : undefined,
            user: order.user_profiles ? {
              id: order.user_profiles.id,
              name: order.user_profiles.name,
              phone_number: order.user_profiles.phone_number,
              email: order.user_profiles.email
            } : undefined,
            items: order.order_items || []
          }
        };

        return { order: transformedOrder };
      }

      return { error: 'Commande non trouvée' };
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      return { error: error instanceof Error ? error.message : 'Erreur lors de la récupération' };
    }
  }

  // Vérifier le code de vérification d'une commande
  static async verifyOrderCode(orderId: string, code: string): Promise<{ success?: boolean; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer le profil driver pour obtenir l'ID du driver
      const { data: driverProfile, error: profileError } = await supabase
        .from('driver_profiles')
        .select('id')
          .eq('id', user.id)
          .single();

        if (profileError) {
        throw new Error(profileError.message);
      }

      const { data: order, error } = await supabase
        .from('orders')
        .select('verification_code')
        .eq('id', orderId)
        .eq('driver_id', driverProfile.id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!order) {
        throw new Error('Commande non trouvée');
      }

      // Vérifier si le code correspond
      if (order.verification_code !== code) {
        return { error: 'Code de vérification incorrect' };
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la vérification du code:', error);
      return { error: error instanceof Error ? error.message : 'Erreur lors de la vérification du code' };
    }
  }

  // Marquer une commande comme livrée
  static async completeOrder(orderId: string): Promise<{ success?: boolean; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer le profil driver pour obtenir l'ID du driver
      const { data: driverProfile, error: profileError } = await supabase
        .from('driver_profiles')
        .select('id')
          .eq('id', user.id)
          .single();

        if (profileError) {
        throw new Error(profileError.message);
      }

      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          actual_delivery: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('driver_id', driverProfile.id);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      return { error: error instanceof Error ? error.message : 'Erreur lors de la finalisation' };
    }
  }

  // Noter une commande
  static async rateOrder(orderId: string, rating: number, review?: string): Promise<{ error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non connecté');
      }

      if (rating < 1 || rating > 5) {
        throw new Error('La note doit être entre 1 et 5');
      }

      // Récupérer le profil driver pour obtenir l'ID du driver
      const { data: driverProfile, error: profileError } = await supabase
        .from('driver_profiles')
        .select('id')
          .eq('id', user.id)
          .single();

        if (profileError) {
        throw new Error(profileError.message);
      }

      // Note: Dans le nouveau schéma, nous n'avons pas de champs driver_rating et driver_review
      // Nous pouvons stocker ces informations dans un champ metadata ou créer une table séparée
      const { error } = await supabase
        .from('orders')
        .update({ 
          customer_rating: rating,
          customer_review: review
        })
        .eq('id', orderId)
        .eq('driver_id', driverProfile.id);

      if (error) {
        throw new Error(error.message);
      }

      return {};
    } catch (error) {
      console.error('Erreur lors de la notation:', error);
      return { error: error instanceof Error ? error.message : 'Erreur lors de la notation' };
    }
  }
} 