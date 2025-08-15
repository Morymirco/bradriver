import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { DriverDashboardService } from '../services/driverDashboardService';

const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#FFFFFF';
const RED = '#E31837';
const DARK_HEADER = '#23262F';
const DARK_GRAY = '#6B7280';
const LIGHT_GRAY = '#9CA3AF';

// Types pour la navigation
export type OrderDetailParamList = {
  OrderDetail: {
    orderId: string;
  };
};

type OrderDetailRouteProp = RouteProp<OrderDetailParamList, 'OrderDetail'>;

const STATUS_COLORS = {
  'pending': '#F59E0B',
  'confirmed': '#3B82F6',
  'preparing': '#F59E0B',
  'ready': '#10B981',
  'picked_up': '#10B981',
  'delivered': '#10B981',
  'cancelled': '#EF4444',
  'Commande reçue': '#3B82F6',
  'En préparation': '#F59E0B',
  'Prête pour livraison': '#10B981',
  'Livrée': '#10B981',
  'Annulée': '#EF4444',
};

export const OrderDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<OrderDetailRouteProp>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrderDetails();
  }, [route.params.orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { order: orderData, error: orderError } = await DriverDashboardService.getOrderDetails(route.params.orderId);
      
      if (orderError) {
        setError(orderError);
        return;
      }
      
      setOrder(orderData);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      setError('Erreur lors du chargement des détails de la commande');
    } finally {
      setLoading(false);
    }
  };

  const handleCallClient = () => {
    if (!order?.customer?.phone) {
      Alert.alert('Erreur', 'Numéro de téléphone du client non disponible');
      return;
    }
    
    Alert.alert('Appeler le client', `Appeler ${order.customer.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Appeler', onPress: () => console.log('Appeler client:', order.customer.phone) },
    ]);
  };

  const handleCallRestaurant = () => {
    if (!order?.business?.phone) {
      Alert.alert('Erreur', 'Numéro de téléphone du restaurant non disponible');
      return;
    }
    
    Alert.alert('Appeler le restaurant', `Appeler ${order.business.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Appeler', onPress: () => console.log('Appeler restaurant:', order.business.phone) },
    ]);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    Alert.alert('Mettre à jour le statut', `Changer le statut à "${newStatus}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { 
        text: 'Confirmer', 
        onPress: async () => {
          try {
            const { success, error } = await DriverDashboardService.updateOrderStatus(order.id, newStatus);
            if (success) {
              Alert.alert('Succès', 'Statut mis à jour avec succès');
              loadOrderDetails(); // Recharger les détails
            } else {
              Alert.alert('Erreur', error || 'Erreur lors de la mise à jour');
            }
          } catch (error) {
            Alert.alert('Erreur', 'Erreur lors de la mise à jour du statut');
          }
        }
      },
    ]);
  };

  const handleCompleteOrder = async () => {
    Alert.alert('Terminer la commande', 'Marquer cette commande comme livrée ?', [
      { text: 'Annuler', style: 'cancel' },
      { 
        text: 'Confirmer', 
        onPress: async () => {
          try {
            const { success, error } = await DriverDashboardService.completeOrder(order.id);
            if (success) {
              Alert.alert('Succès', 'Commande terminée avec succès');
              loadOrderDetails(); // Recharger les détails
            } else {
              Alert.alert('Erreur', error || 'Erreur lors de la finalisation');
            }
          } catch (error) {
            Alert.alert('Erreur', 'Erreur lors de la finalisation de la commande');
          }
        }
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={26} color={DARK_TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chargement...</Text>
          <View style={{width: 32}} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RED} />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={26} color={DARK_TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Erreur</Text>
          <View style={{width: 32}} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color={DARK_GRAY} />
          <Text style={styles.errorText}>{error || 'Commande non trouvée'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadOrderDetails}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={26} color={DARK_TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commande {order.id}</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <MaterialIcons name="more-vert" size={26} color={DARK_TEXT} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || DARK_GRAY }]}>
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
            <Text style={styles.estimatedTime}>{order.delivery?.estimatedTime || '25-35 min'}</Text>
          </View>
          <Text style={styles.orderId}>Commande #{order.id}</Text>
        </View>

        {/* Restaurant Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="restaurant" size={20} color={RED} />
            <Text style={styles.sectionTitle}>Restaurant</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.restaurantName}>{order.business?.name || 'Restaurant'}</Text>
            <Text style={styles.address}>{order.business?.address || 'Adresse non disponible'}</Text>
            {order.business?.rating && (
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={16} color="#F59E0B" />
                <Text style={styles.rating}>{order.business.rating}</Text>
            </View>
            )}
            {order.business?.phone && (
            <TouchableOpacity style={styles.callBtn} onPress={handleCallRestaurant}>
              <MaterialIcons name="phone" size={18} color={RED} />
              <Text style={styles.callBtnText}>Appeler le restaurant</Text>
            </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={20} color={RED} />
            <Text style={styles.sectionTitle}>Client</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.clientName}>{order.customer?.name || 'Client'}</Text>
            {order.customer?.phone && (
              <Text style={styles.clientInfo}>{order.customer.phone}</Text>
            )}
            {order.customer?.email && (
              <Text style={styles.clientInfo}>{order.customer.email}</Text>
            )}
            {order.customer?.phone && (
            <TouchableOpacity style={styles.callBtn} onPress={handleCallClient}>
              <MaterialIcons name="phone" size={18} color={RED} />
              <Text style={styles.callBtnText}>Appeler le client</Text>
            </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Delivery Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="local-shipping" size={20} color={RED} />
            <Text style={styles.sectionTitle}>Livraison</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.addressContainer}>
              <View style={styles.addressItem}>
                <MaterialIcons name="location-on" size={16} color="#10B981" />
                <View style={styles.addressText}>
                  <Text style={styles.addressLabel}>Point de retrait</Text>
                  <Text style={styles.address}>{order.delivery?.pickupAddress || 'Adresse non disponible'}</Text>
                </View>
              </View>
              <View style={styles.addressDivider} />
              <View style={styles.addressItem}>
                <MaterialIcons name="home" size={16} color={RED} />
                <View style={styles.addressText}>
                  <Text style={styles.addressLabel}>Adresse de livraison</Text>
                  <Text style={styles.address}>{order.delivery?.deliveryAddress || 'Adresse non disponible'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.deliveryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{order.delivery?.distance || 'N/A'}</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{order.delivery?.estimatedTime || 'N/A'}</Text>
                <Text style={styles.statLabel}>Temps estimé</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="receipt" size={20} color={RED} />
            <Text style={styles.sectionTitle}>Articles commandés</Text>
          </View>
          <View style={styles.infoCard}>
            {order.items && order.items.length > 0 ? (
              order.items.map((item: any, index: number) => (
                <View key={index} style={[styles.itemRow, index < order.items.length - 1 && styles.itemBorder]}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name || 'Article'}</Text>
                  {item.specialInstructions && (
                    <Text style={styles.specialInstructions}>{item.specialInstructions}</Text>
                  )}
                </View>
                <View style={styles.itemQuantity}>
                    <Text style={styles.quantityText}>x{item.quantity || 1}</Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    {((item.price || 0) * (item.quantity || 1)).toFixed(2)} €
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noItemsText}>Aucun article disponible</Text>
            )}
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="payment" size={20} color={RED} />
            <Text style={styles.sectionTitle}>Paiement</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Méthode de paiement</Text>
              <Text style={styles.paymentValue}>{order.payment?.method || 'Non spécifié'}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Sous-total</Text>
              <Text style={styles.paymentValue}>{(order.payment?.subtotal || 0) / 100} €</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Frais de livraison</Text>
              <Text style={styles.paymentValue}>{(order.payment?.deliveryFee || 0) / 100} €</Text>
            </View>
            <View style={[styles.paymentRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{(order.payment?.total || 0) / 100} €</Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="timeline" size={20} color={RED} />
            <Text style={styles.sectionTitle}>Suivi de commande</Text>
          </View>
          <View style={styles.infoCard}>
            {order.timeline && order.timeline.length > 0 ? (
              order.timeline.map((step: any, index: number) => (
              <View key={index} style={styles.timelineItem}>
                <View style={[styles.timelineIcon, step.active && styles.timelineIconActive]}>
                  <MaterialIcons 
                    name={step.icon as any} 
                    size={16} 
                    color={step.active ? RED : DARK_GRAY} 
                  />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineStatus, step.active && styles.timelineStatusActive]}>
                    {step.status}
                  </Text>
                  <Text style={styles.timelineTime}>{step.time}</Text>
                </View>
                {index < order.timeline.length - 1 && <View style={styles.timelineLine} />}
              </View>
              ))
            ) : (
              <Text style={styles.noTimelineText}>Aucun historique disponible</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.navigateBtn]}
            onPress={() => navigation.navigate('Navigation' as never)}
          >
            <MaterialIcons name="navigation" size={20} color={DARK_TEXT} />
            <Text style={styles.actionBtnText}>Naviguer vers le client</Text>
          </TouchableOpacity>
          {order.status !== 'delivered' && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.primaryBtn]}
              onPress={handleCompleteOrder}
            >
            <MaterialIcons name="check-circle" size={20} color={DARK_TEXT} />
            <Text style={styles.actionBtnText}>Marquer comme livrée</Text>
          </TouchableOpacity>
          )}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: DARK_HEADER,
    borderBottomWidth: 1,
    borderBottomColor: DARK_GRAY,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  moreBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: DARK_CARD,
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: RED,
    fontWeight: '700',
    fontSize: 14,
  },
  estimatedTime: {
    fontSize: 14,
    color: DARK_GRAY,
    fontWeight: '600',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_TEXT,
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: DARK_GRAY,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    fontSize: 14,
    color: DARK_TEXT,
    marginLeft: 4,
    fontWeight: '600',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_HEADER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  callBtnText: {
    color: RED,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 4,
  },
  clientInfo: {
    fontSize: 14,
    color: DARK_GRAY,
    marginBottom: 4,
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    marginLeft: 8,
  },
  addressLabel: {
    fontSize: 12,
    color: DARK_GRAY,
    fontWeight: '600',
    marginBottom: 2,
  },
  addressDivider: {
    height: 20,
    width: 1,
    backgroundColor: DARK_GRAY,
    marginLeft: 8,
    marginVertical: 4,
  },
  deliveryStats: {
    flexDirection: 'row',
    backgroundColor: DARK_HEADER,
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: RED,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: DARK_GRAY,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: DARK_GRAY,
    marginHorizontal: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DARK_GRAY,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_TEXT,
    marginBottom: 2,
  },
  specialInstructions: {
    fontSize: 12,
    color: DARK_GRAY,
    fontStyle: 'italic',
  },
  itemQuantity: {
    backgroundColor: DARK_HEADER,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 12,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK_TEXT,
    minWidth: 50,
    textAlign: 'right',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  paymentLabel: {
    fontSize: 14,
    color: DARK_GRAY,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_TEXT,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: DARK_GRAY,
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: RED,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DARK_HEADER,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineIconActive: {
    backgroundColor: RED + '20',
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_GRAY,
    marginBottom: 2,
  },
  timelineStatusActive: {
    color: DARK_TEXT,
  },
  timelineTime: {
    fontSize: 12,
    color: DARK_GRAY,
  },
  timelineLine: {
    position: 'absolute',
    left: 16,
    top: 32,
    width: 1,
    height: 16,
    backgroundColor: DARK_GRAY,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DARK_CARD,
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: DARK_GRAY,
  },
  navigateBtn: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  primaryBtn: {
    backgroundColor: RED,
    borderColor: RED,
  },
  actionBtnText: {
    color: DARK_TEXT,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: DARK_TEXT,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: DARK_TEXT,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  retryBtn: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
  },
  retryBtnText: {
    color: DARK_TEXT,
    fontSize: 16,
    fontWeight: '700',
  },
  noItemsText: {
    color: DARK_GRAY,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  noTimelineText: {
    color: DARK_GRAY,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 