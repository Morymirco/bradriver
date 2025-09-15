import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation';

// Couleurs du design system BraPrime
const PRIMARY = '#E31837';
const PRIMARY_LIGHT = '#FF4D6A';
const GRAY_100 = '#F3F4F6';
const GRAY_200 = '#E5E7EB';
const GRAY_300 = '#D1D5DB';
const GRAY_500 = '#6B7280';
const GRAY_700 = '#374151';
const WHITE = '#FFFFFF';
const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#FFFFFF';
const DARK_HEADER = '#23262F';
const DARK_GRAY = '#353945';

// Types selon le schéma Supabase
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

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { unreadCount, loadNotifications } = useNotifications();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Charger les notifications
  const loadNotificationsData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Appliquer le filtre
      if (filter === 'unread') {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors du chargement des notifications:', error);
        Alert.alert('Erreur', 'Impossible de charger les notifications');
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Erreur inattendue:', error);
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Erreur lors du marquage comme lu:', error);
        return;
      }

      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );

      // Recharger les notifications pour mettre à jour le compteur
      await loadNotifications();
    } catch (error) {
      console.error('Erreur inattendue:', error);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Erreur lors du marquage de toutes les notifications:', error);
        Alert.alert('Erreur', 'Impossible de marquer toutes les notifications comme lues');
        return;
      }

      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );

      // Recharger les notifications pour mettre à jour le compteur
      await loadNotifications();
      
      Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Erreur inattendue:', error);
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

              if (error) {
                console.error('Erreur lors de la suppression:', error);
                Alert.alert('Erreur', 'Impossible de supprimer la notification');
                return;
              }

              // Mettre à jour l'état local
              setNotifications(prev => 
                prev.filter(n => n.id !== notificationId)
              );

              // Recharger les notifications pour mettre à jour le compteur
              await loadNotifications();
            } catch (error) {
              console.error('Erreur inattendue:', error);
              Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
            }
          }
        }
      ]
    );
  };

  // Refresh des notifications
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotificationsData();
    setRefreshing(false);
  };

  // Charger les notifications au montage
  useEffect(() => {
    loadNotificationsData();
  }, [user?.id, filter]);

  // Obtenir l'icône selon le type de notification
  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'order':
      case 'delivery':
        return 'local-shipping';
      case 'payment':
        return 'payment';
      case 'system':
        return 'settings';
      case 'promotion':
        return 'local-offer';
      case 'warning':
        return 'warning';
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error';
      default:
        return 'notifications';
    }
  };

  // Obtenir la couleur selon la priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return GRAY_500;
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  // Rendu d'une notification
  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.is_read && styles.unreadCard
      ]}
      onPress={() => markAsRead(item.id)}
      onLongPress={() => deleteNotification(item.id)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={getNotificationIcon(item.type) as any}
            size={24}
            color={item.is_read ? GRAY_500 : PRIMARY}
          />
          {!item.is_read && (
            <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]} />
          )}
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={[
            styles.notificationTitle,
            !item.is_read && styles.unreadTitle
          ]}>
            {item.title}
          </Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>
            {formatDate(item.created_at)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteNotification(item.id)}
        >
          <MaterialIcons name="delete-outline" size={20} color={GRAY_500} />
        </TouchableOpacity>
      </View>

      {item.priority === 'high' && (
        <View style={styles.highPriorityBadge}>
          <MaterialIcons name="priority-high" size={12} color={WHITE} />
          <Text style={styles.highPriorityText}>Priorité élevée</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Rendu de l'état vide
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="notifications-none" size={64} color={GRAY_500} />
      <Text style={styles.emptyTitle}>
        {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
      </Text>
      <Text style={styles.emptyMessage}>
        {filter === 'unread' 
          ? 'Vous êtes à jour avec toutes vos notifications'
          : 'Vous recevrez des notifications ici pour vos commandes et activités'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={DARK_TEXT} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Tout marquer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.activeFilterButton
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterText,
            filter === 'all' && styles.activeFilterText
          ]}>
            Toutes ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'unread' && styles.activeFilterButton
          ]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[
            styles.filterText,
            filter === 'unread' && styles.activeFilterText
          ]}>
            Non lues ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste des notifications */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Chargement des notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: DARK_HEADER,
    borderBottomWidth: 1,
    borderBottomColor: DARK_GRAY,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: DARK_GRAY,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: DARK_BG,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: PRIMARY,
  },
  filterText: {
    color: GRAY_500,
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: WHITE,
  },
  notificationsList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  notificationCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: DARK_GRAY,
  },
  unreadCard: {
    borderColor: PRIMARY,
    borderWidth: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  priorityIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GRAY_500,
    marginBottom: 4,
  },
  unreadTitle: {
    color: DARK_TEXT,
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: GRAY_300,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: GRAY_500,
  },
  deleteButton: {
    padding: 4,
  },
  highPriorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  highPriorityText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: GRAY_500,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: GRAY_500,
    fontSize: 14,
    marginTop: 12,
  },
});
