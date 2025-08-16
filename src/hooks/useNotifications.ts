import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Interface adaptée pour le nouveau schéma
interface Notification {
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

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const driverId = user?.id;

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    if (!driverId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', driverId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (err) {
      console.error('Erreur loadNotifications:', err);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (err) {
      console.error('Erreur markAsRead:', err);
      return false;
    }
  }, []);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    if (!driverId) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', driverId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);

      return true;
    } catch (err) {
      console.error('Erreur markAllAsRead:', err);
      return false;
    }
  }, [driverId]);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Mettre à jour le compteur si la notification n'était pas lue
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      return true;
    } catch (err) {
      console.error('Erreur deleteNotification:', err);
      return false;
    }
  }, [notifications]);

  // Écouter les nouvelles notifications en temps réel
  useEffect(() => {
    if (!driverId) return;

    const subscription = supabase
      .channel('driver_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${driverId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${driverId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );
          
          // Mettre à jour le compteur
          if (updatedNotification.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [driverId]);

  // Charger les notifications au montage
  useEffect(() => {
    if (driverId) {
      loadNotifications();
    }
  }, [driverId, loadNotifications]);

  return {
    // État
    notifications,
    unreadCount,
    loading,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications,

    // Utilitaires
    hasUnread: unreadCount > 0,
    recentNotifications: notifications.slice(0, 5),
  };
}; 