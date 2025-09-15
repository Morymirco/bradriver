import { supabase } from '../lib/supabase';

// Types selon le schéma Supabase
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  data: any;
  expires_at?: string;
  created_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  data?: any;
  expires_at?: string;
}

export class NotificationService {
  /**
   * Récupérer toutes les notifications d'un utilisateur
   */
  static async getNotifications(userId: string, filter?: 'all' | 'unread'): Promise<{ data: Notification[] | null; error: any }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Appliquer le filtre si spécifié
      if (filter === 'unread') {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erreur inattendue lors de la récupération des notifications:', error);
      return { data: null, error };
    }
  }

  /**
   * Récupérer les notifications non lues
   */
  static async getUnreadNotifications(userId: string): Promise<{ data: Notification[] | null; error: any }> {
    return this.getNotifications(userId, 'unread');
  }

  /**
   * Compter les notifications non lues
   */
  static async getUnreadCount(userId: string): Promise<{ count: number; error: any }> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Erreur lors du comptage des notifications non lues:', error);
        return { count: 0, error };
      }

      return { count: count || 0, error: null };
    } catch (error) {
      console.error('Erreur inattendue lors du comptage:', error);
      return { count: 0, error };
    }
  }

  /**
   * Marquer une notification comme lue
   */
  static async markAsRead(notificationId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Erreur lors du marquage comme lu:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Erreur inattendue lors du marquage:', error);
      return { success: false, error };
    }
  }

  /**
   * Marquer toutes les notifications d'un utilisateur comme lues
   */
  static async markAllAsRead(userId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Erreur lors du marquage de toutes les notifications:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Erreur inattendue lors du marquage de toutes les notifications:', error);
      return { success: false, error };
    }
  }

  /**
   * Supprimer une notification
   */
  static async deleteNotification(notificationId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Erreur lors de la suppression de la notification:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Erreur inattendue lors de la suppression:', error);
      return { success: false, error };
    }
  }

  /**
   * Créer une nouvelle notification
   */
  static async createNotification(notificationData: CreateNotificationData): Promise<{ data: Notification | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...notificationData,
          priority: notificationData.priority || 'medium',
          data: notificationData.data || {},
          is_read: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création de la notification:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erreur inattendue lors de la création:', error);
      return { data: null, error };
    }
  }

  /**
   * Créer une notification de commande
   */
  static async createOrderNotification(
    userId: string,
    orderId: string,
    orderNumber: string,
    status: string,
    message: string
  ): Promise<{ data: Notification | null; error: any }> {
    const title = `Commande ${orderNumber}`;
    const type = 'order';
    const priority = status === 'cancelled' || status === 'delivered' ? 'high' : 'medium';
    
    return this.createNotification({
      user_id: userId,
      type,
      title,
      message,
      priority,
      data: {
        order_id: orderId,
        order_number: orderNumber,
        status
      }
    });
  }

  /**
   * Créer une notification de paiement
   */
  static async createPaymentNotification(
    userId: string,
    orderId: string,
    orderNumber: string,
    status: string,
    amount: number
  ): Promise<{ data: Notification | null; error: any }> {
    const title = `Paiement - Commande ${orderNumber}`;
    const type = 'payment';
    const priority = status === 'failed' ? 'high' : 'medium';
    const message = status === 'completed' 
      ? `Paiement de ${amount.toLocaleString('fr-FR')} GNF confirmé pour la commande ${orderNumber}`
      : `Problème avec le paiement de ${amount.toLocaleString('fr-FR')} GNF pour la commande ${orderNumber}`;
    
    return this.createNotification({
      user_id: userId,
      type,
      title,
      message,
      priority,
      data: {
        order_id: orderId,
        order_number: orderNumber,
        status,
        amount
      }
    });
  }

  /**
   * Créer une notification système
   */
  static async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    data?: any
  ): Promise<{ data: Notification | null; error: any }> {
    return this.createNotification({
      user_id: userId,
      type: 'system',
      title,
      message,
      priority,
      data
    });
  }

  /**
   * Créer une notification de promotion
   */
  static async createPromotionNotification(
    userId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<{ data: Notification | null; error: any }> {
    return this.createNotification({
      user_id: userId,
      type: 'promotion',
      title,
      message,
      priority: 'low',
      data
    });
  }

  /**
   * Nettoyer les notifications expirées
   */
  static async cleanupExpiredNotifications(): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Erreur lors du nettoyage des notifications expirées:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Erreur inattendue lors du nettoyage:', error);
      return { success: false, error };
    }
  }

  /**
   * S'abonner aux changements de notifications en temps réel
   */
  static subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  /**
   * Se désabonner des notifications
   */
  static unsubscribeFromNotifications(userId: string) {
    supabase.channel(`notifications:${userId}`).unsubscribe();
  }
}
