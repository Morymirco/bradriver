import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Alert,
  Modal,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation';
import { useDriver, useNotifications } from '../hooks';
import { DriverDashboardService, DriverOrder } from '../services/driverDashboardService';

// Couleurs du design system BraPrime
const PRIMARY = '#E31837';
const PRIMARY_LIGHT = '#FF4D6A';
const GRAY_100 = '#F3F4F6';
const GRAY_200 = '#E5E7EB';
const GRAY_300 = '#D1D5DB';
const GRAY_500 = '#6B7280';
const GRAY_700 = '#374151';
const WHITE = '#FFFFFF';
const STATUS_COLORS = {
  'En préparation': '#F59E0B',
  'Prête': '#10B981',
  'Livrée': '#3B82F6',
  'Annulée': '#EF4444',
  'À accepter': PRIMARY,
};

const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#fff';
const DARK_HEADER = '#23262F';
const DARK_GRAY = '#353945';

const assignedFilters = ['Toutes', 'En préparation', 'Prête', 'Livrée', 'Annulée'];

const SCREEN_WIDTH = Dimensions.get('window').width;

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const [filter, setFilter] = useState('Toutes');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<NavigationProp>();

  // Hooks
  const { 
    profile, 
    isIndependent,
    businessServiceName,
    serviceType,
    removeFromBusinessService
  } = useDriver();

  const { unreadCount } = useNotifications();

  // Charger les commandes
  const loadOrders = async () => {
    try {
      setLoading(true);
      const { orders: driverOrders, error } = await DriverDashboardService.getDriverOrders();
      if (error) {
        console.error('Erreur chargement commandes:', error);
        Alert.alert('Erreur', 'Impossible de charger les commandes');
      } else {
        setOrders(driverOrders || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh des commandes
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  // Charger les commandes au montage du composant
  useEffect(() => {
    loadOrders();
  }, []);

  // Filtrage des commandes
  const filteredOrders = orders.filter(order => {
    if (filter === 'Toutes') return true;
    return order.status === filter;
  });

  // Fonctions drawer
  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    closeDrawer();
    // Navigation vers l'écran de login
    navigation.navigate('Login' as never);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };



  return (
    <SafeAreaView style={styles.container}>
      {/* Drawer overlay */}
      {drawerOpen && (
        <Pressable style={styles.drawerOverlay} onPress={closeDrawer} />
      )}
      
      {/* Drawer */}
      {drawerOpen && (
        <View style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Menu</Text>
          </View>
          <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); navigation.navigate('Profile' as never); }}>
            <Text style={styles.drawerItemText}>👤 Profil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); navigation.navigate('History' as never); }}>
            <Text style={styles.drawerItemText}>📜 Historique</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); navigation.navigate('Calendar' as never); }}>
            <Text style={styles.drawerItemText}>📅 Calendrier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); navigation.navigate('Statistics' as never); }}>
            <Text style={styles.drawerItemText}>📊 Statistiques</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={handleLogout}>
            <Text style={[styles.drawerItemText, {color: '#E31837'}]}>🚪 Déconnexion</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de confirmation de déconnexion */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModal}>
            <MaterialIcons name="logout" size={48} color="#E31837" style={styles.logoutIcon} />
            <Text style={styles.logoutModalTitle}>Déconnexion</Text>
            <Text style={styles.logoutModalText}>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity style={styles.logoutModalButton} onPress={cancelLogout}>
                <Text style={styles.logoutModalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.logoutModalButton, styles.logoutModalButtonConfirm]} onPress={confirmLogout}>
                <Text style={[styles.logoutModalButtonText, styles.logoutModalButtonTextConfirm]}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
          <MaterialIcons name="menu" size={24} color={DARK_TEXT} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mes Commandes</Text>
          <Text style={styles.headerSubtitle}>
            {profile ? `${profile.first_name} ${profile.last_name}` : 'Chargement...'}
          </Text>
          {/* Affichage du service business */}
          {!isIndependent && businessServiceName && (
            <View style={styles.serviceBadge}>
              <MaterialIcons 
                name={serviceType === 'pharmacy' ? 'local-pharmacy' : 
                      serviceType === 'restaurant' ? 'restaurant' : 
                      serviceType === 'grocery' ? 'shopping-cart' : 'business'} 
                size={16} 
                color={WHITE} 
              />
              <Text style={styles.serviceBadgeText}>{businessServiceName}</Text>
            </View>
          )}
          {isIndependent && (
            <View style={styles.independentBadge}>
              <MaterialIcons name="person" size={16} color={PRIMARY} />
              <Text style={styles.independentBadgeText}>Indépendant</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialIcons name="notifications" size={24} color={DARK_TEXT} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>



      {/* Service Management (pour les chauffeurs indépendants) */}
      {isIndependent && (
        <View style={styles.serviceManagementContainer}>
          <Text style={styles.serviceManagementTitle}>Gestion du Service</Text>
          <TouchableOpacity 
            style={styles.serviceManagementButton}
            onPress={() => {
              navigation.navigate('ServiceSelection' as never);
            }}
          >
            <MaterialIcons name="business" size={20} color={WHITE} />
            <Text style={styles.serviceManagementButtonText}>Rejoindre un Service</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Service Info (pour les chauffeurs liés à un service) */}
      {!isIndependent && businessServiceName && (
        <View style={styles.serviceInfoContainer}>
          <View style={styles.serviceInfoHeader}>
            <MaterialIcons 
              name={serviceType === 'pharmacy' ? 'local-pharmacy' : 
                    serviceType === 'restaurant' ? 'restaurant' : 
                    serviceType === 'grocery' ? 'shopping-cart' : 'business'} 
              size={24} 
              color={PRIMARY} 
            />
            <Text style={styles.serviceInfoTitle}>{businessServiceName}</Text>
          </View>
          <TouchableOpacity 
            style={styles.serviceInfoButton}
            onPress={() => {
              Alert.alert(
                'Quitter le Service',
                `Voulez-vous quitter ${businessServiceName} et devenir indépendant ?`,
                [
                  { text: 'Annuler', style: 'cancel' },
                  { 
                    text: 'Quitter', 
                    style: 'destructive',
                    onPress: async () => {
                      const success = await removeFromBusinessService();
                      if (success) {
                        Alert.alert('Succès', 'Vous êtes maintenant indépendant');
                      } else {
                        Alert.alert('Erreur', 'Impossible de quitter le service');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.serviceInfoButtonText}>Quitter le Service</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter */}
      <View style={{ marginTop: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {assignedFilters.map((filterName) => (
          <TouchableOpacity
            key={filterName}
            style={[styles.filterChip, filter === filterName && styles.activeFilterChip]}
            onPress={() => setFilter(filterName)}
          >
            <Text style={[styles.filterChipText, filter === filterName && styles.activeFilterChipText]}>
              {filterName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView 
        style={styles.ordersList} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY]}
            tintColor={PRIMARY}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingState}>
            <MaterialIcons name="hourglass-empty" size={48} color={PRIMARY} />
            <Text style={styles.loadingText}>Chargement des commandes...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="local-shipping" size={64} color={GRAY_500} />
            <Text style={styles.emptyStateText}>
              Aucune commande assignée
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Les nouvelles commandes apparaîtront ici
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              activeOpacity={0.8}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderIdContainer}>
                  <MaterialIcons name="receipt" size={16} color={PRIMARY} />
                  <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || GRAY_500 }]}>
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>
              </View>
              
              <View style={styles.orderContent}>
                <View style={styles.businessInfo}>
                  <MaterialIcons name="store" size={18} color={PRIMARY} />
                  <Text style={styles.businessName}>{order.business_name}</Text>
                </View>
                
                <View style={styles.customerInfo}>
                  <MaterialIcons name="person" size={16} color={DARK_GRAY} />
                  <Text style={styles.customerName}>{order.customer_name}</Text>
                </View>
                
                <View style={styles.addressInfo}>
                  <MaterialIcons name="location-on" size={16} color={DARK_GRAY} />
                  <Text style={styles.addressText} numberOfLines={1}>
                    {order.customer_address}
                  </Text>
                </View>
                
                {order.items && order.items.length > 0 && (
                  <View style={styles.itemsInfo}>
                    <MaterialIcons name="restaurant" size={16} color={DARK_GRAY} />
                    <Text style={styles.itemsText} numberOfLines={2}>
                      {order.items.map(item => `${item.quantity || 1}x ${item.name || 'Article'}`).join(', ')}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.orderFooter}>
                <View style={styles.timeInfo}>
                  <MaterialIcons name="schedule" size={14} color={DARK_GRAY} />
                  <Text style={styles.timeText}>
                    {new Date(order.created_at).toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
                <View style={styles.amountInfo}>
                  <Text style={styles.amountLabel}>Total</Text>
                  <Text style={styles.orderAmount}>€{order.total_amount.toFixed(2)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: DARK_HEADER,
    borderBottomWidth: 1,
    borderBottomColor: '#353945',
  },
  menuButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_TEXT,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: DARK_TEXT,
    fontWeight: '600',
    textAlign: 'center',
  },
  notificationButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: WHITE,
  },

  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 280,
    height: '100%',
    backgroundColor: DARK_CARD,
    zIndex: 1001,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  drawerHeader: {
    marginBottom: 30,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  drawerItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#353945',
  },
  drawerItemText: {
    fontSize: 16,
    color: DARK_TEXT,
    fontWeight: '500',
  },
  logoutModal: {
    backgroundColor: DARK_CARD,
    borderRadius: 18,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logoutIcon: {
    marginBottom: 18,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 18,
    textAlign: 'center',
  },
  logoutModalText: {
    color: DARK_TEXT,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    width: '100%',
  },
  logoutModalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#353945',
    borderRadius: 8,
    marginRight: 12,
    flex: 1,
    alignItems: 'center',
  },
  logoutModalButtonText: {
    color: DARK_TEXT,
    fontWeight: '600',
    fontSize: 13,
  },
  logoutModalButtonConfirm: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: PRIMARY,
    borderRadius: 8,
    marginLeft: 12,
    flex: 1,
    alignItems: 'center',
  },
  logoutModalButtonTextConfirm: {
    color: DARK_TEXT,
    fontWeight: '700',
    fontSize: 13,
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    height: 40,
    marginVertical: 4,
    backgroundColor: DARK_GRAY,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  activeFilterChip: {
    backgroundColor: PRIMARY,
    borderRadius: 20,
    height: 40,
    marginVertical: 4,
    shadowColor: PRIMARY,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    color: DARK_TEXT,
    fontWeight: '600',
    fontSize: 13,
  },
  activeFilterChipText: {
    color: DARK_TEXT,
    fontWeight: '700',
    fontSize: 13,
  },
  ordersList: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: DARK_TEXT,
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    color: DARK_TEXT,
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: DARK_TEXT,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: DARK_CARD,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 18,
    fontWeight: '800',
    color: WHITE,
    marginLeft: 8,
  },
  statusBadge: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    color: WHITE,
    fontWeight: '800',
    fontSize: 13,
  },
  orderContent: {
    marginBottom: 20,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  businessName: {
    fontSize: 17,
    fontWeight: '700',
    color: PRIMARY,
    marginLeft: 10,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: WHITE,
    marginLeft: 8,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  itemsInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemsText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 6,
    fontWeight: '500',
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '500',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modalContent: {
    backgroundColor: DARK_CARD,
    borderRadius: 18,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 18,
    textAlign: 'center',
  },
  offerCard: {
    backgroundColor: DARK_HEADER,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    width: 260,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  acceptBtn: {
    marginTop: 10,
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignSelf: 'flex-end',
  },
  acceptBtnText: {
    color: DARK_TEXT,
    fontWeight: '700',
    fontSize: 14,
  },
  closeModalBtn: {
    marginTop: 18,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: DARK_GRAY,
    borderRadius: 8,
  },
  closeModalBtnText: {
    color: DARK_TEXT,
    fontWeight: '600',
    fontSize: 15,
  },
  horizontalOffersContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  horizontalOfferCard: {
    width: 280,
    marginHorizontal: 8,
    backgroundColor: DARK_CARD,
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
    alignItems: 'flex-start',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DARK_GRAY,
    marginHorizontal: 4,
    opacity: 0.4,
  },
  paginationDotActive: {
    backgroundColor: PRIMARY,
    opacity: 1,
  },
  horizontalOffersContainerStatic: {
    marginTop: 20,
  },
  cancelBtn: {
    marginTop: 10,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignSelf: 'flex-end',
  },
  cancelBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  serviceBadge: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  serviceBadgeText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  independentBadge: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  independentBadgeText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  serviceManagementContainer: {
    padding: 16,
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    marginTop: 16,
    marginHorizontal: 16,
  },
  serviceManagementTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 16,
  },
  serviceManagementButton: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceManagementButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  serviceInfoContainer: {
    padding: 16,
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    marginTop: 16,
    marginHorizontal: 16,
  },
  serviceInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY,
    marginLeft: 8,
  },
  serviceInfoButton: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfoButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '700',
  },
}); 