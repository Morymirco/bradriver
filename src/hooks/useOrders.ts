import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Order } from '../lib/supabase';
import { useDriver } from './useDriver';

export interface OrderWithDetails extends Order {
  business: {
    id: number;
    name: string;
    address: string;
    phone?: string;
    rating: number;
    business_type_id: number;
    business_type_name?: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    special_instructions?: string;
  }>;
}

export const useOrders = () => {
  const { user } = useAuth();
  const { profile } = useDriver();
  const [assignedOrders, setAssignedOrders] = useState<OrderWithDetails[]>([]);
  const [availableOffers, setAvailableOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const driverId = user?.id;
  const businessId = profile?.business_id;
  const isIndependent = profile?.is_independent;

  // Charger les commandes assignées
  const loadAssignedOrders = useCallback(async () => {
    if (!driverId) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('orders')
        .select(`
          *,
          business:businesses(
            id,
            name,
            address,
            phone,
            rating,
            business_type_id,
            business_types(name)
          )
        `)
        .eq('driver_id', driverId)
        .neq('status', 'delivered')
        .order('created_at', { ascending: false });

      // Si le chauffeur appartient à un business, filtrer par ce business
      if (businessId && !isIndependent) {
        query = query.eq('business_id', businessId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transformer les données pour correspondre à l'interface
      const transformedData = data?.map(order => ({
        ...order,
        business: {
          ...order.business,
          business_type_name: order.business?.business_types?.name,
        },
        items: Array.isArray(order.items) ? order.items : [],
      })) || [];

      setAssignedOrders(transformedData);
    } catch (err) {
      setError('Erreur lors du chargement des commandes');
      console.error('Erreur loadAssignedOrders:', err);
    } finally {
      setLoading(false);
    }
  }, [driverId, businessId, isIndependent]);

  // Charger les offres disponibles
  const loadAvailableOffers = useCallback(async () => {
    if (!driverId) return;

    try {
      let query = supabase
        .from('delivery_offers')
        .select(`
          *,
          order:orders(
            *,
            business:businesses(
              id,
              name,
              address,
              phone,
              rating,
              business_type_id,
              business_types(name)
            )
          )
        `)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      // Si le chauffeur appartient à un business, filtrer par ce business
      if (businessId && !isIndependent) {
        query = query.eq('order.business_id', businessId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transformer les données
      const transformedData = data?.map(offer => ({
        ...offer,
        order: {
          ...offer.order,
          business: {
            ...offer.order?.business,
            business_type_name: offer.order?.business?.business_types?.name,
          },
        },
      })) || [];

      setAvailableOffers(transformedData);
    } catch (err) {
      console.error('Erreur loadAvailableOffers:', err);
    }
  }, [driverId, businessId, isIndependent]);

  // Accepter une offre
  const acceptOffer = useCallback(async (offerId: string) => {
    if (!driverId) return false;

    try {
      const { error } = await supabase
        .from('delivery_offers')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', offerId)
        .eq('driver_id', driverId);

      if (error) {
        throw error;
      }

      // Recharger les offres et commandes
      await Promise.all([
        loadAvailableOffers(),
        loadAssignedOrders(),
      ]);

      return true;
    } catch (err) {
      console.error('Erreur acceptOffer:', err);
      return false;
    }
  }, [driverId, loadAvailableOffers, loadAssignedOrders]);

  // Mettre à jour le statut d'une commande
  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    if (!driverId) return false;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .eq('driver_id', driverId);

      if (error) {
        throw error;
      }

      // Recharger les commandes
      await loadAssignedOrders();

      return true;
    } catch (err) {
      console.error('Erreur updateOrderStatus:', err);
      return false;
    }
  }, [driverId, loadAssignedOrders]);

  // Marquer une commande comme récupérée
  const markAsPickedUp = useCallback(async (orderId: string) => {
    return updateOrderStatus(orderId, 'picked_up');
  }, [updateOrderStatus]);

  // Marquer une commande comme livrée
  const markAsDelivered = useCallback(async (orderId: string) => {
    return updateOrderStatus(orderId, 'delivered');
  }, [updateOrderStatus]);

  // Obtenir les détails d'une commande
  const getOrderDetails = useCallback(async (orderId: string): Promise<OrderWithDetails | null> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          business:businesses(
            id,
            name,
            address,
            phone,
            rating,
            business_type_id,
            business_types(name)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        business: {
          ...data.business,
          business_type_name: data.business?.business_types?.name,
        },
        items: Array.isArray(data.items) ? data.items : [],
      };
    } catch (err) {
      console.error('Erreur getOrderDetails:', err);
      return null;
    }
  }, []);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!driverId) return;

    // Écouter les nouvelles commandes assignées
    const ordersSubscription = supabase
      .channel('driver_orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `driver_id=eq.${driverId}`,
        },
        () => {
          loadAssignedOrders();
        }
      )
      .subscribe();

    // Écouter les nouvelles offres
    const offersSubscription = supabase
      .channel('driver_offers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_offers',
          filter: 'status=eq.pending',
        },
        () => {
          loadAvailableOffers();
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      offersSubscription.unsubscribe();
    };
  }, [driverId, loadAssignedOrders, loadAvailableOffers]);

  // Charger les données au montage et quand le profil change
  useEffect(() => {
    if (driverId) {
      Promise.all([
        loadAssignedOrders(),
        loadAvailableOffers(),
      ]);
    }
  }, [driverId, businessId, isIndependent, loadAssignedOrders, loadAvailableOffers]);

  return {
    // État
    assignedOrders,
    availableOffers,
    loading,
    error,

    // Actions
    acceptOffer,
    updateOrderStatus,
    markAsPickedUp,
    markAsDelivered,
    getOrderDetails,

    // Utilitaires
    hasActiveOrders: assignedOrders.length > 0,
    hasAvailableOffers: availableOffers.length > 0,
    
    // Informations sur le business
    businessId,
    isIndependent,
    businessName: profile?.business_name,
    businessType: profile?.business_type,
  };
}; 