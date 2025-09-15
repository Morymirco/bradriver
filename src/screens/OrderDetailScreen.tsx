import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DriverDashboardService } from '../services/driverDashboardService';

const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#FFFFFF';
const RED = '#E31837';
const DARK_HEADER = '#23262F';
const DARK_GRAY = '#6B7280';
const LIGHT_GRAY = '#9CA3AF';
const WHITE = '#FFFFFF';

// Types pour la navigation
export type OrderDetailParamList = {
  OrderDetail: {
    orderId: string;
  };
};

type OrderDetailRouteProp = RouteProp<OrderDetailParamList, 'OrderDetail'>;

// Configuration uniformisée des couleurs de statuts
const STATUS_COLORS = {
  // Statuts en anglais
  'pending': '#F59E0B',      // Orange/Ambre
  'confirmed': '#3B82F6',    // Bleu
  'preparing': '#F59E0B',    // Orange/Ambre
  'ready': '#10B981',        // Vert
  'picked_up': '#8B5CF6',    // Violet
  'out_for_delivery': '#FF9800', // Orange vif
  'delivered': '#10B981',    // Vert
  'cancelled': '#EF4444',    // Rouge
  
  // Statuts traduits en français
  'En attente': '#F59E0B',
  'Confirmée': '#3B82F6',
  'En préparation': '#F59E0B',
  'Prête': '#10B981',
  'Récupérée': '#8B5CF6',
  'En livraison': '#FF9800',
  'Livrée': '#10B981',
  'Annulée': '#EF4444',
  
  // Anciens statuts pour compatibilité
  'Commande reçue': '#3B82F6',
  'Prête pour livraison': '#10B981',
};

export const OrderDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<OrderDetailRouteProp>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    loadOrderDetails();
  }, [route.params.orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Chargement des détails pour orderId:', route.params.orderId);
      
      const { order: orderData, error: orderError } = await DriverDashboardService.getOrderDetails(route.params.orderId);
      
      if (orderError) {
        console.error('❌ Erreur lors du chargement:', orderError);
        setError(orderError);
        return;
      }
      
      console.log('✅ Données reçues:', JSON.stringify(orderData, null, 2));
      setOrder(orderData);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      setError('Erreur lors du chargement des détails de la commande');
    } finally {
      setLoading(false);
    }
  };

  const handleCallClient = () => {
    if (!order?.order?.user?.phone_number) {
      Alert.alert('Erreur', 'Numéro de téléphone du client non disponible');
      return;
    }
    
    Alert.alert('Appeler le client', `Appeler ${order.order.user.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Appeler', onPress: () => console.log('Appeler client:', order.order.user.phone_number) },
    ]);
  };

  const handleCallRestaurant = () => {
    if (!order?.order?.business?.phone) {
      Alert.alert('Erreur', 'Numéro de téléphone du restaurant non disponible');
      return;
    }
    
    Alert.alert('Appeler le restaurant', `Appeler ${order.order.business.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Appeler', onPress: () => console.log('Appeler restaurant:', order.order.business.phone) },
    ]);
  };

  // Fonction pour traduire les statuts
  const translateStatus = (status: string): string => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prête';
      case 'picked_up': return 'Récupérée';
      case 'out_for_delivery': return 'En livraison';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  // Fonction pour détecter si c'est une commande de colis
  const isPackageOrder = () => {
    // Vérifier plusieurs indicateurs pour détecter une commande de colis
    const hasPackageOrders = order?.order?.package_orders && order.order.package_orders.length > 0;
    const hasPackageInstructions = order?.customer_instructions?.includes('Service de colis') || 
                                  order?.delivery_instructions?.includes('Service de colis') ||
                                  order?.customer_instructions?.includes('Colis Léger');
    const hasPackageOrderId = order?.customer_instructions?.includes('package_order_id');
    const isPackageOrder = hasPackageOrders || hasPackageInstructions || hasPackageOrderId;
    
    console.log('📦 Détection commande de colis:', {
      hasPackageOrders,
      hasPackageInstructions,
      hasPackageOrderId,
      isPackageOrder,
      customerInstructions: order?.customer_instructions,
      deliveryInstructions: order?.delivery_instructions,
      packageOrders: order?.order?.package_orders,
      orderData: order
    });
    return isPackageOrder;
  };

  // Fonction pour obtenir le titre de la section selon le type de commande
  const getItemsSectionTitle = () => {
    return isPackageOrder() ? 'Détails du colis' : 'Articles commandés';
  };

  // Fonction pour obtenir l'icône de la section selon le type de commande
  const getItemsSectionIcon = () => {
    return isPackageOrder() ? 'inventory' : 'receipt';
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

  const handleCompleteOrder = () => {
    setShowVerificationModal(true);
    setVerificationCode('');
    setVerificationError('');
  };

  const handleVerificationSubmit = async () => {
    if (!verificationCode.trim()) {
      setVerificationError('Veuillez saisir le code de vérification');
      return;
    }

    // Validation basique du code (4 chiffres)
    if (!/^\d{4}$/.test(verificationCode.trim())) {
      setVerificationError('Le code doit contenir 4 chiffres');
      return;
    }

    try {
      // Vérifier le code de vérification avec celui stocké dans la base de données
      const { success: codeValid, error: codeError } = await DriverDashboardService.verifyOrderCode(order.id, verificationCode.trim());
      
      if (!codeValid) {
        setVerificationError(codeError || 'Code de vérification incorrect');
        return;
      }

      // Si le code est correct, marquer la commande comme livrée
      const { success, error } = await DriverDashboardService.completeOrder(order.id);
      if (success) {
        setShowVerificationModal(false);
        setVerificationCode('');
        setVerificationError('');
        Alert.alert('Succès', 'Commande livrée avec succès');
        loadOrderDetails(); // Recharger les détails
      } else {
        setVerificationError(error || 'Erreur lors de la finalisation');
      }
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      setVerificationError('Erreur lors de la finalisation de la commande');
    }
  };

  const handleVerificationCancel = () => {
    setShowVerificationModal(false);
    setVerificationCode('');
    setVerificationError('');
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
        <Text style={styles.headerTitle}>Commande {order.order?.order_number || order.id}</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <MaterialIcons name="more-vert" size={26} color={DARK_TEXT} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || DARK_GRAY }]}>
              <Text style={styles.statusText}>{translateStatus(order.status)}</Text>
            </View>
            <Text style={styles.estimatedTime}>{order.delivery?.estimatedTime || '25-35 min'}</Text>
          </View>
          <Text style={styles.orderId}>Commande #{order.order?.order_number || order.id}</Text>
        </View>

        {/* Restaurant/Service Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons 
              name={isPackageOrder() ? "local-shipping" : "restaurant"} 
              size={20} 
              color={RED} 
            />
            <Text style={styles.sectionTitle}>
              {isPackageOrder() ? 'Service de Colis' : 'Restaurant'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.serviceHeader}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>
                  {order.order?.business?.name || (isPackageOrder() ? 'Service de Colis' : 'Restaurant')}
                </Text>
                <Text style={styles.serviceAddress}>{order.order?.business?.address || 'Adresse non disponible'}</Text>
             {order.order?.business?.phone && (
                  <Text style={styles.servicePhone}>{order.order.business.phone}</Text>
                )}
              </View>
              {order.order?.business?.rating && !isPackageOrder() && (
                <View style={styles.ratingBadge}>
                  <MaterialIcons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{order.order.business.rating}</Text>
             </View>
             )}
            </View>
             {order.order?.business?.phone && (
              <TouchableOpacity style={styles.callButton} onPress={handleCallRestaurant}>
                <MaterialIcons name="phone" size={18} color={WHITE} />
                <Text style={styles.callButtonText}>
                  {isPackageOrder() ? 'Appeler le service' : 'Appeler le restaurant'}
                </Text>
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
            <View style={styles.clientHeader}>
              <View style={styles.clientInfo}>
                         <Text style={styles.clientName}>{order.order?.user?.name || 'Client'}</Text>
             {order.order?.user?.phone_number && (
                  <Text style={styles.clientPhone}>{order.order.user.phone_number}</Text>
             )}
             {order.order?.user?.email && (
                  <Text style={styles.clientEmail}>{order.order.user.email}</Text>
             )}
              </View>
              <View style={styles.clientAvatar}>
                <MaterialIcons name="person" size={24} color={DARK_GRAY} />
              </View>
            </View>
             {order.order?.user?.phone_number && (
              <TouchableOpacity style={styles.callButton} onPress={handleCallClient}>
                <MaterialIcons name="phone" size={18} color={WHITE} />
                <Text style={styles.callButtonText}>Appeler le client</Text>
             </TouchableOpacity>
             )}
          </View>
        </View>

        {/* Delivery Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="local-shipping" size={20} color={RED} />
            <Text style={styles.sectionTitle}>
              {isPackageOrder() ? 'Informations de livraison de colis' : 'Livraison'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.deliveryRoutes}>
              <View style={styles.routeItem}>
                <View style={styles.routeIcon}>
                  <MaterialIcons name="location-on" size={20} color="#3B82F6" />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeLabel}>
                    {isPackageOrder() ? 'Point de collecte' : 'Point de retrait'}
                  </Text>
                  <Text style={styles.routeAddress}>
                    {isPackageOrder() 
                      ? (order.pickup_address || order.order?.business?.address || 'Adresse non disponible')
                      : (order.order?.business?.address || 'Adresse non disponible')
                    }
                  </Text>
              </View>
                </View>
              
              <View style={styles.routeArrow}>
                <MaterialIcons name="keyboard-arrow-down" size={24} color={DARK_GRAY} />
              </View>
              
              <View style={styles.routeItem}>
                <View style={styles.routeIcon}>
                  <MaterialIcons name="home" size={20} color={RED} />
            </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeLabel}>Adresse de livraison</Text>
                  <Text style={styles.routeAddress}>
                    {isPackageOrder()
                      ? (order.delivery_address || 'Adresse non disponible')
                      : (order.delivery_address || 'Adresse non disponible')
                    }
                  </Text>
              </View>
              </View>
            </View>
            
            {/* Instructions spécifiques pour les colis */}
            {isPackageOrder() && (
              <View style={styles.deliveryInstructions}>
                {order.customer_instructions && (
                  <View style={styles.instructionBadge}>
                    <MaterialIcons name="upload" size={16} color="#3B82F6" />
                    <Text style={styles.instructionText}>
                      Collecte: {order.customer_instructions}
                    </Text>
          </View>
                )}
                {order.delivery_instructions && (
                  <View style={styles.instructionBadge}>
                    <MaterialIcons name="download" size={16} color="#10B981" />
                    <Text style={styles.instructionText}>
                      Livraison: {order.delivery_instructions}
                    </Text>
        </View>
                )}
              </View>
            )}
            
            <View style={styles.deliveryMetrics}>
              <View style={styles.metricCard}>
                <MaterialIcons name="straighten" size={20} color="#3B82F6" />
                <Text style={styles.metricValue}>{order.estimated_distance || 'N/A'} km</Text>
                <Text style={styles.metricLabel}>Distance</Text>
              </View>
              <View style={styles.metricCard}>
                <MaterialIcons name="schedule" size={20} color="#F59E0B" />
                <Text style={styles.metricValue}>{order.estimated_duration || 'N/A'} min</Text>
                <Text style={styles.metricLabel}>Temps estimé</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Items / Package Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name={getItemsSectionIcon()} size={20} color={RED} />
            <Text style={styles.sectionTitle}>{getItemsSectionTitle()}</Text>
          </View>
          <View style={styles.infoCard}>
            {isPackageOrder() ? (
              // Affichage amélioré pour les commandes de colis
              <View style={styles.packageDetails}>
                                 {/* En-tête du colis */}
                 <View style={styles.packageHeader}>
                   <View style={styles.packageTypeContainer}>
                     <MaterialIcons name="inventory" size={24} color="#3B82F6" />
                     <View style={styles.packageTypeInfo}>
                                               <Text style={styles.packageTypeTitle}>
                          {order.order?.package_orders?.[0]?.service_name || 'Service de Colis'}
                        </Text>
                       <Text style={styles.packageTypeSubtitle}>
                         {order.order?.package_orders?.[0]?.package_weight ? 
                           `Poids: ${order.order.package_orders[0].package_weight} kg` : 
                           'Livraison spécialisée'
                         }
                       </Text>
                     </View>
                   </View>
                   <View style={[styles.packageStatusBadge, { backgroundColor: '#3B82F6' + '20' }]}>
                     <Text style={[styles.packageStatusText, { color: '#3B82F6' }]}>En cours</Text>
                   </View>
                 </View>

                                                   {/* Informations du destinataire */}
                  {(order.order?.package_orders?.[0]?.customer_name || 
                    order.order?.package_orders?.[0]?.recipient_name) && (
                    <View style={styles.packageSection}>
                      <View style={styles.packageSectionHeader}>
                        <MaterialIcons name="person" size={18} color="#10B981" />
                        <Text style={styles.packageSectionTitle}>Destinataire</Text>
                      </View>
                      <View style={styles.packageSectionContent}>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Nom:</Text>
                          <Text style={styles.infoValue}>
                            {order.order.package_orders[0].customer_name || order.order.package_orders[0].recipient_name}
                          </Text>
                        </View>
                        {(order.order.package_orders[0].customer_phone || order.order.package_orders[0].recipient_phone) && (
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Téléphone:</Text>
                            <Text style={styles.infoValue}>
                              {order.order.package_orders[0].customer_phone || order.order.package_orders[0].recipient_phone}
                            </Text>
                          </View>
                        )}
                        {order.order.package_orders[0].customer_email && (
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Email:</Text>
                            <Text style={styles.infoValue}>{order.order.package_orders[0].customer_email}</Text>
                          </View>
                        )}
                        {order.order.package_orders[0].contact_method && (
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Contact préféré:</Text>
                            <Text style={styles.infoValue}>
                              {order.order.package_orders[0].contact_method === 'phone' ? 'Téléphone' : 
                               order.order.package_orders[0].contact_method === 'email' ? 'Email' : 'Téléphone et Email'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                                                   {/* Horaires de service */}
                  {(order.order?.package_orders?.[0]?.pickup_date || order.order?.package_orders?.[0]?.drop_date || 
                    order.order?.package_orders?.[0]?.preferred_time) && (
                    <View style={styles.packageSection}>
                      <View style={styles.packageSectionHeader}>
                        <MaterialIcons name="schedule" size={18} color="#F59E0B" />
                        <Text style={styles.packageSectionTitle}>Horaires de Service</Text>
                      </View>
                      <View style={styles.packageSectionContent}>
                        {order.order.package_orders[0].pickup_date && (
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Collecte:</Text>
                            <Text style={styles.infoValue}>
                              {order.order.package_orders[0].pickup_date}
                              {order.order.package_orders[0].pickup_time && ` à ${order.order.package_orders[0].pickup_time}`}
                            </Text>
                          </View>
                        )}
                        {order.order.package_orders[0].drop_date && (
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Livraison:</Text>
                            <Text style={styles.infoValue}>
                              {order.order.package_orders[0].drop_date}
                              {order.order.package_orders[0].drop_time && ` à ${order.order.package_orders[0].drop_time}`}
                            </Text>
                          </View>
                        )}
                        {order.order.package_orders[0].preferred_time && (
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Heure préférée:</Text>
                            <Text style={styles.infoValue}>{order.order.package_orders[0].preferred_time}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                                 {/* Adresses spécifiques aux colis */}
                 {(order.order?.package_orders?.[0]?.pickup_address || order.order?.package_orders?.[0]?.delivery_address) && (
                   <View style={styles.packageSection}>
                     <View style={styles.packageSectionHeader}>
                       <MaterialIcons name="location-on" size={18} color="#3B82F6" />
                       <Text style={styles.packageSectionTitle}>Adresses de Service</Text>
                     </View>
                     <View style={styles.packageSectionContent}>
                       {order.order.package_orders[0].pickup_address && (
                         <View style={styles.instructionItem}>
                           <MaterialIcons name="upload" size={16} color="#3B82F6" />
                           <Text style={styles.instructionText}>
                             <Text style={styles.instructionLabel}>Point de collecte: </Text>
                             {order.order.package_orders[0].pickup_address}
                           </Text>
                         </View>
                       )}
                       {order.order.package_orders[0].delivery_address && (
                         <View style={styles.instructionItem}>
                           <MaterialIcons name="download" size={16} color="#10B981" />
                           <Text style={styles.instructionText}>
                             <Text style={styles.instructionLabel}>Point de livraison: </Text>
                             {order.order.package_orders[0].delivery_address}
                           </Text>
                         </View>
                       )}
                     </View>
                   </View>
                 )}

                 {/* Instructions spéciales */}
                 {(order.customer_instructions || order.delivery_instructions || 
                   order.order?.package_orders?.[0]?.pickup_instructions || 
                   order.order?.package_orders?.[0]?.delivery_instructions) && (
                   <View style={styles.packageSection}>
                     <View style={styles.packageSectionHeader}>
                       <MaterialIcons name="info" size={18} color="#8B5CF6" />
                       <Text style={styles.packageSectionTitle}>Instructions Spéciales</Text>
                     </View>
                     <View style={styles.packageSectionContent}>
                       {(order.customer_instructions || order.order?.package_orders?.[0]?.pickup_instructions) && (
                         <View style={styles.instructionItem}>
                           <MaterialIcons name="upload" size={16} color="#3B82F6" />
                           <Text style={styles.instructionText}>
                             <Text style={styles.instructionLabel}>Collecte: </Text>
                             {order.order?.package_orders?.[0]?.pickup_instructions || order.customer_instructions}
                           </Text>
                         </View>
                       )}
                       {(order.delivery_instructions || order.order?.package_orders?.[0]?.delivery_instructions) && (
                         <View style={styles.instructionItem}>
                           <MaterialIcons name="download" size={16} color="#10B981" />
                           <Text style={styles.instructionText}>
                             <Text style={styles.instructionLabel}>Livraison: </Text>
                             {order.order?.package_orders?.[0]?.delivery_instructions || order.delivery_instructions}
                           </Text>
                         </View>
                       )}
                     </View>
                   </View>
                 )}

                                                   {/* Caractéristiques du colis */}
                  <View style={styles.packageSection}>
                    <View style={styles.packageSectionHeader}>
                      <MaterialIcons name="straighten" size={18} color="#EF4444" />
                      <Text style={styles.packageSectionTitle}>Caractéristiques</Text>
                    </View>
                    <View style={styles.packageSectionContent}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Distance:</Text>
                        <Text style={styles.infoValue}>{order.estimated_distance || 'N/A'} km</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Durée:</Text>
                        <Text style={styles.infoValue}>{order.estimated_duration || 'N/A'} min</Text>
                      </View>
                      {order.order?.package_orders?.[0]?.package_weight && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Poids:</Text>
                          <Text style={styles.infoValue}>{order.order.package_orders[0].package_weight} kg</Text>
                        </View>
                      )}
                      {order.order?.package_orders?.[0]?.package_dimensions && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Dimensions:</Text>
                          <Text style={styles.infoValue}>{order.order.package_orders[0].package_dimensions} cm</Text>
                        </View>
                      )}
                      {order.order?.package_orders?.[0]?.service_name && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Service:</Text>
                          <Text style={styles.infoValue}>{order.order.package_orders[0].service_name}</Text>
                        </View>
                      )}
                      {order.order?.package_orders?.[0]?.package_description && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Description:</Text>
                          <Text style={styles.infoValue}>{order.order.package_orders[0].package_description}</Text>
                        </View>
                      )}
                      {order.order?.package_orders?.[0]?.service_price && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Prix service:</Text>
                          <Text style={styles.infoValue}>{order.order.package_orders[0].service_price.toLocaleString('fr-FR')} GNF</Text>
                        </View>
                      )}
                    </View>
                  </View>

                                                   {/* Options de service */}
                  {(order.order?.package_orders?.[0]?.is_fragile || 
                    order.order?.package_orders?.[0]?.is_urgent) && (
                    <View style={styles.packageSection}>
                      <View style={styles.packageSectionHeader}>
                        <MaterialIcons name="settings" size={18} color="#8B5CF6" />
                        <Text style={styles.packageSectionTitle}>Options de Service</Text>
                      </View>
                      <View style={styles.packageSectionContent}>
                        {order.order?.package_orders?.[0]?.is_fragile && (
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Assurance:</Text>
                            <Text style={[styles.infoValue, { color: '#EF4444', fontWeight: '600' }]}>Recommandée</Text>
                          </View>
                        )}
                        {order.order?.package_orders?.[0]?.is_urgent && (
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Livraison:</Text>
                            <Text style={[styles.infoValue, { color: '#F59E0B', fontWeight: '600' }]}>Express</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                 {/* Badges spéciaux */}
                 <View style={styles.packageBadges}>
                   {order.order?.package_orders?.[0]?.is_fragile && (
                     <View style={[styles.specialBadge, { backgroundColor: '#EF4444' + '20' }]}>
                       <MaterialIcons name="warning" size={14} color="#EF4444" />
                       <Text style={[styles.specialBadgeText, { color: '#EF4444' }]}>Fragile</Text>
                     </View>
                   )}
                   {order.order?.package_orders?.[0]?.is_urgent && (
                     <View style={[styles.specialBadge, { backgroundColor: '#F59E0B' + '20' }]}>
                       <MaterialIcons name="priority-high" size={14} color="#F59E0B" />
                       <Text style={[styles.specialBadgeText, { color: '#F59E0B' }]}>Urgent</Text>
                     </View>
                   )}

                 </View>
              </View>
            ) : (
              // Affichage pour les commandes normales
              order.order?.items && order.order.items.length > 0 ? (
              order.order.items.map((item: any, index: number) => (
                                 <View key={index} style={[styles.itemRow, index < order.order.items.length - 1 && styles.itemBorder]}>
                   {item.image && (
                     <View style={styles.itemImageContainer}>
                       <Image source={{ uri: item.image }} style={styles.itemImage} />
                     </View>
                   )}
                 <View style={styles.itemInfo}>
                     <Text style={styles.itemName}>{item.name || 'Article'}</Text>
                   {item.special_instructions && (
                     <Text style={styles.specialInstructions}>{item.special_instructions}</Text>
                   )}
                 </View>
                 <View style={styles.itemQuantity}>
                     <Text style={styles.quantityText}>x{item.quantity || 1}</Text>
                   </View>
                   <Text style={styles.itemPrice}>
                     {((item.price || 0) * (item.quantity || 1)).toLocaleString('fr-FR')} GNF
                   </Text>
                 </View>
              ))
            ) : (
              <Text style={styles.noItemsText}>Aucun article disponible</Text>
              )
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
             <View style={styles.paymentMethod}>
               <MaterialIcons name="credit-card" size={20} color="#10B981" />
               <Text style={styles.paymentMethodText}>
                 {order.order?.payment_method === 'cash' ? 'Espèces' :
                  order.order?.payment_method === 'card' ? 'Carte bancaire' :
                  order.order?.payment_method === 'mobile_money' ? 'Mobile Money' :
                  order.order?.payment_method || 'Non spécifié'}
               </Text>
            </View>
             
             <View style={styles.paymentBreakdown}>
               <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Sous-total</Text>
              <Text style={styles.paymentValue}>{(order.order?.total || 0).toLocaleString('fr-FR')} GNF</Text>
            </View>
               <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Frais de livraison</Text>
              <Text style={styles.paymentValue}>{(order.order?.delivery_fee || 0).toLocaleString('fr-FR')} GNF</Text>
            </View>
               {order.order?.service_price && (
                 <View style={styles.paymentItem}>
                   <Text style={styles.paymentLabel}>Frais de service</Text>
                   <Text style={styles.paymentValue}>{(order.order.service_price).toLocaleString('fr-FR')} GNF</Text>
                 </View>
               )}
             </View>
             
             <View style={styles.paymentTotal}>
              <Text style={styles.totalLabel}>Total</Text>
               <Text style={styles.totalValue}>{(order.order?.grand_total || order.order?.total || 0).toLocaleString('fr-FR')} GNF</Text>
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
              <View style={styles.timelineContainer}>
                {order.timeline.map((step: any, index: number) => (
                  <View key={index} style={styles.timelineStep}>
                    <View style={[styles.timelineDot, step.active && styles.timelineDotActive]}>
                  <MaterialIcons 
                    name={step.icon as any} 
                    size={16} 
                        color={step.active ? WHITE : DARK_GRAY} 
                  />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineStatus, step.active && styles.timelineStatusActive]}>
                    {step.status}
                  </Text>
                  <Text style={styles.timelineTime}>{step.time}</Text>
                </View>
                    {index < order.timeline.length - 1 && (
                      <View style={[styles.timelineConnector, step.active && styles.timelineConnectorActive]} />
                    )}
              </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyTimeline}>
                <MaterialIcons name="schedule" size={48} color={DARK_GRAY} />
                <Text style={styles.emptyTimelineText}>Aucun historique disponible</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
             style={[styles.actionButton, styles.navigateButton]}
            onPress={() => navigation.navigate('Navigation', { orderId: order.id })}
          >
             <MaterialIcons name="navigation" size={16} color={WHITE} />
             <Text style={styles.actionButtonText}>Naviguer</Text>
          </TouchableOpacity>
          {order.status !== 'delivered' && (
            <TouchableOpacity 
               style={[styles.actionButton, styles.primaryButton]}
              onPress={handleCompleteOrder}
            >
               <MaterialIcons name="check-circle" size={16} color={WHITE} />
               <Text style={styles.actionButtonText}>Livrer</Text>
          </TouchableOpacity>
          )}
                 </View>
       </ScrollView>

       {/* Modal de vérification */}
       <Modal
         visible={showVerificationModal}
         transparent
         animationType="fade"
         onRequestClose={handleVerificationCancel}
       >
         <View style={styles.modalOverlay}>
           <View style={styles.verificationModal}>
             <MaterialIcons name="verified-user" size={48} color={RED} style={styles.verificationIcon} />
             <Text style={styles.verificationModalTitle}>Vérification de livraison</Text>
             <Text style={styles.verificationModalText}>
               Veuillez saisir le code de vérification fourni par le client pour confirmer la livraison.
             </Text>
             
             <View style={styles.verificationInputContainer}>
               <Text style={styles.verificationInputLabel}>Code de vérification</Text>
               <TextInput
                 style={styles.verificationInput}
                 value={verificationCode}
                 onChangeText={setVerificationCode}
                 placeholder="Entrez le code"
                 placeholderTextColor={DARK_GRAY}
                 keyboardType="numeric"
                                   maxLength={4}
                 autoFocus
               />
               {verificationError ? (
                 <Text style={styles.verificationErrorText}>{verificationError}</Text>
               ) : null}
             </View>

             <View style={styles.verificationModalButtons}>
               <TouchableOpacity style={styles.verificationModalButton} onPress={handleVerificationCancel}>
                 <Text style={styles.verificationModalButtonText}>Annuler</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[styles.verificationModalButton, styles.verificationModalButtonConfirm]} 
                 onPress={handleVerificationSubmit}
               >
                 <Text style={[styles.verificationModalButtonText, styles.verificationModalButtonTextConfirm]}>
                   Confirmer
                 </Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
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
    color: DARK_TEXT,
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
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  // Styles pour Service/Restaurant
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 4,
  },
  serviceAddress: {
    fontSize: 14,
    color: DARK_GRAY,
    marginBottom: 4,
  },
  servicePhone: {
    fontSize: 14,
    color: RED,
    fontWeight: '600',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B' + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B' + '50',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    marginLeft: 4,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RED,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: RED,
  },
  callButtonText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  // Styles pour Client
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 4,
  },
  clientPhone: {
     fontSize: 14,
    color: RED,
    fontWeight: '600',
     marginBottom: 4,
   },
  clientEmail: {
     fontSize: 14,
    color: DARK_GRAY,
    marginBottom: 4,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DARK_HEADER,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DARK_GRAY + '30',
  },
  // Styles pour Livraison
  deliveryRoutes: {
    marginBottom: 20,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DARK_HEADER,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: DARK_GRAY + '30',
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: DARK_GRAY,
    fontWeight: '600',
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 14,
    color: DARK_TEXT,
    fontWeight: '500',
    lineHeight: 20,
  },
  routeArrow: {
    alignItems: 'center',
    marginVertical: 8,
    marginLeft: 20,
  },
  deliveryInstructions: {
    marginBottom: 20,
  },
  instructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_HEADER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DARK_GRAY + '30',
  },
  instructionText: {
    fontSize: 13,
    color: DARK_TEXT,
    marginLeft: 8,
    flex: 1,
  },
  deliveryMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: DARK_HEADER,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DARK_GRAY + '30',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_TEXT,
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: DARK_GRAY,
    fontWeight: '600',
  },
     itemRow: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingVertical: 8,
   },
   itemImageContainer: {
     marginRight: 12,
   },
   itemImage: {
     width: 50,
     height: 50,
     borderRadius: 8,
     backgroundColor: DARK_HEADER,
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
  // Styles pour Paiement
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_HEADER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: DARK_GRAY + '30',
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_TEXT,
    marginLeft: 12,
  },
  paymentBreakdown: {
    marginBottom: 20,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: DARK_GRAY,
    fontWeight: '500',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_TEXT,
  },
     paymentTotal: {
     borderTopWidth: 2,
     borderTopColor: DARK_GRAY + '50',
     paddingTop: 16,
    marginTop: 8,
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
  },
  totalLabel: {
     fontSize: 18,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  totalValue: {
     fontSize: 20,
    fontWeight: '700',
    color: RED,
  },
  // Styles pour Timeline
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineStep: {
    position: 'relative',
    marginBottom: 20,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DARK_HEADER,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: DARK_GRAY + '50',
  },
  timelineDotActive: {
    backgroundColor: RED,
    borderColor: RED,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 8,
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_GRAY,
    marginBottom: 4,
  },
  timelineStatusActive: {
    color: DARK_TEXT,
  },
  timelineTime: {
    fontSize: 13,
    color: DARK_GRAY,
    fontWeight: '500',
  },
  timelineConnector: {
    position: 'absolute',
    left: 20,
    top: 40,
    width: 2,
    height: 20,
    backgroundColor: DARK_GRAY + '30',
  },
  timelineConnectorActive: {
    backgroundColor: RED + '50',
  },
  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTimelineText: {
    color: DARK_GRAY,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  // Styles pour Actions
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  navigateButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  primaryButton: {
    backgroundColor: RED,
    borderColor: RED,
  },
  actionButtonText: {
    color: WHITE,
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
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
     
  // Styles pour les détails de colis améliorés
  packageDetails: {
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3B82F6' + '30',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: DARK_GRAY + '30',
  },
  packageTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  packageTypeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  packageTypeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 2,
  },
  packageTypeSubtitle: {
    fontSize: 14,
     color: DARK_GRAY,
    fontWeight: '500',
  },
  packageStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3B82F6' + '50',
  },
  packageStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  packageSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: DARK_GRAY + '20',
  },
  packageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageSectionTitle: {
     fontSize: 16,
    fontWeight: '700',
    color: DARK_TEXT,
    marginLeft: 8,
  },
     packageSectionContent: {
     paddingLeft: 26,
   },
   infoRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'flex-start',
     marginBottom: 8,
     paddingVertical: 4,
   },
   infoLabel: {
     fontSize: 14,
     fontWeight: '600',
     color: DARK_GRAY,
     flex: 0,
     minWidth: 80,
     marginRight: 12,
   },
   infoValue: {
     fontSize: 14,
     color: DARK_TEXT,
     fontWeight: '500',
     flex: 1,
     textAlign: 'right',
   },
   packageSectionText: {
     fontSize: 14,
     color: DARK_TEXT,
     marginBottom: 4,
     lineHeight: 20,
   },
   packageSectionLabel: {
     fontWeight: '600',
     color: DARK_GRAY,
   },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: DARK_TEXT,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  instructionLabel: {
    fontWeight: '600',
    color: DARK_GRAY,
  },
  packageCharacteristics: {
    paddingLeft: 26,
  },
  characteristicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  characteristicText: {
    fontSize: 14,
    color: DARK_TEXT,
    marginLeft: 8,
  },
  characteristicLabel: {
    fontWeight: '600',
    color: DARK_GRAY,
  },
  packageBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  specialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  specialBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  modalText: {
    fontSize: 15,
    color: DARK_TEXT,
    marginBottom: 4,
  },
  modalSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fragileText: {
    color: '#FF6B6B',
  },
  urgentText: {
    color: '#FF9800',
   },
       // Styles pour le modal de vérification
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    verificationModal: {
      backgroundColor: DARK_CARD,
      borderRadius: 18,
      padding: 24,
      width: '90%',
      maxWidth: 400,
      alignItems: 'center',
    },
   verificationIcon: {
     marginBottom: 18,
   },
   verificationModalTitle: {
     fontSize: 20,
     fontWeight: '700',
     color: RED,
     marginBottom: 12,
     textAlign: 'center',
   },
   verificationModalText: {
     color: DARK_TEXT,
     fontWeight: '500',
     fontSize: 14,
     textAlign: 'center',
     lineHeight: 20,
     marginBottom: 24,
   },
   verificationInputContainer: {
     width: '100%',
     marginBottom: 24,
   },
   verificationInputLabel: {
     fontSize: 14,
     fontWeight: '600',
     color: DARK_TEXT,
     marginBottom: 8,
   },
   verificationInput: {
     backgroundColor: DARK_HEADER,
     borderRadius: 8,
     paddingHorizontal: 16,
     paddingVertical: 12,
     fontSize: 16,
     color: DARK_TEXT,
     textAlign: 'center',
     borderWidth: 1,
     borderColor: DARK_GRAY,
   },
   verificationErrorText: {
     color: '#EF4444',
     fontSize: 12,
     marginTop: 8,
     textAlign: 'center',
   },
   verificationModalButtons: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     width: '100%',
   },
   verificationModalButton: {
     paddingHorizontal: 24,
     paddingVertical: 12,
     backgroundColor: DARK_HEADER,
     borderRadius: 8,
     marginHorizontal: 8,
     flex: 1,
     alignItems: 'center',
   },
   verificationModalButtonText: {
     color: DARK_TEXT,
     fontWeight: '600',
     fontSize: 14,
   },
   verificationModalButtonConfirm: {
     backgroundColor: RED,
   },
   verificationModalButtonTextConfirm: {
     color: DARK_TEXT,
     fontWeight: '700',
   },
 }); 