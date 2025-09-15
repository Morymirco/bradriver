import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOffers } from '../components/OffersContext';
import { useDriver } from '../hooks';
import { supabase } from '../lib/supabase';
import { DriverEarningsService } from '../services/driverEarningsService';

const PRIMARY = '#E31837';
const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#fff';
const DARK_GRAY = '#353945';
const WHITE = '#fff';

// Interface pour les items de commande
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  special_instructions?: string;
}

// Interface pour les offres de commandes programmées
interface ProgrammedOrder {
  id: string;
  order_id: string;
  business_name: string;
  customer_name: string;
  order_details: string;
  pickup_address: string;
  delivery_address: string;
  business_phone?: string;
  business_email?: string;
  customer_phone?: string;
  status: string;
  order_items: OrderItem[];
  estimated_distance: number;
  estimated_duration: number;
  delivery_fee: number; // Pour calculer les gains dynamiquement
  scheduled_delivery_window_start: string;
  scheduled_delivery_window_end: string;
  created_at: string;
  is_package_order?: boolean; // Nouveau champ pour identifier les commandes de colis
  is_grouped_delivery?: boolean; // Nouveau champ pour identifier les livraisons groupées
  // Détails spécifiques aux colis
  packageDetails?: {
    weight: string;
    dimensions?: string;
    description?: string;
    is_fragile: boolean;
    is_urgent: boolean;
  };
  pickupInstructions?: string;
  deliveryInstructions?: string;
  preferredTime?: string;
  contactMethod?: string;
}

// Interface pour les commandes de colis
interface PackageOrder {
  id: string;
  order_id: string;
  business_name: string;
  customer_name: string;
  service_name: string;
  pickup_address: string;
  delivery_address: string;
  business_phone?: string;
  business_email?: string;
  customer_phone?: string;
  status: string;
  package_details: {
    weight: string;
    dimensions: string;
    is_fragile: boolean;
    is_urgent: boolean;
    description?: string;
  };
  customer_info: {
    name: string;
    phone: string;
    email: string;
  };
  delivery_preferences: {
    preferred_time?: string;
    contact_method: string;
  };
  estimated_distance: number;
  estimated_duration: number;
  delivery_fee: number;
  service_price: number;
  grand_total: number;
  scheduled_delivery_window_start: string;
  scheduled_delivery_window_end: string;
  created_at: string;
}

type TabType = 'orders' | 'packages';

export const AvailableOffersScreen: React.FC = () => {
  const { acceptedOffers, acceptOffer } = useOffers();
  const { profile, isIndependent } = useDriver();
  
  const [availableOffers, setAvailableOffers] = useState<ProgrammedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('orders');

  // Modal state
  const [selectedOffer, setSelectedOffer] = useState<ProgrammedOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Pagination state
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Filtrer les offres selon l'onglet actif
  const filteredOffers = availableOffers.filter(offer => {
    if (activeTab === 'orders') {
      return !offer.is_package_order; // Commandes normales + groupes
    } else if (activeTab === 'packages') {
      return offer.is_package_order; // Seulement les colis
    }
    return false;
  });

  // Charger les offres disponibles (commandes programmées et commandes de colis à l'état "prêt")
  const loadAvailableOffers = async () => {
    try {
      setLoading(true);
      
      // Charger toutes les commandes disponibles (normales ET colis) depuis la table orders
      let query = supabase
        .from('orders')
        .select(`
          id,
          business_id,
          user_id,
          status,
          grand_total,
          delivery_fee,
          delivery_address,
          pickup_coordinates,
          delivery_coordinates,
          delivery_type,
          scheduled_delivery_window_start,
          scheduled_delivery_window_end,
          available_for_drivers,
          created_at,
          businesses!inner(name, address, phone, email),
          user_profiles!inner(name, phone_number, address),
          order_items(id, name, price, quantity, image, special_instructions)
        `)
        .is('driver_id', null)              // Non assignées à un livreur
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])  // Statuts appropriés
        .order('scheduled_delivery_window_start', { ascending: true });

      // Si le livreur appartient à un business, filtrer par ce business
      if (profile?.business_id && !isIndependent) {
        query = query.eq('business_id', profile.business_id);
      }

      const { data: orders, error } = await query;

      if (error) {
        console.error('Erreur lors du chargement des commandes:', error);
        Alert.alert('Erreur', 'Impossible de charger les offres disponibles');
        return;
      }

      // Identifier les commandes de colis en vérifiant directement dans package_orders
      let packageOrderIds = new Set<string>();
      
      // Récupérer les détails des commandes de colis
      let packageOrdersDetails: any[] = [];
      try {
        const { data: packageDetails } = await supabase
          .from('package_orders')
          .select('*')
          .in('order_id', orders?.map(o => o.id) || []);
        
        packageOrdersDetails = packageDetails || [];
        packageOrderIds = new Set(packageDetails?.map(pkg => pkg.order_id) || []);
      } catch (packageError) {
        console.error('Erreur lors du chargement des détails des colis:', packageError);
      }

      // Transformer toutes les commandes
      const transformedOffers: ProgrammedOrder[] = orders?.map((order) => {
        const isPackageOrder = packageOrderIds.has(order.id);
        const packageDetails = packageOrdersDetails.find(pkg => pkg.order_id === order.id);
        const isGroupedDelivery = order.is_grouped_delivery || false;
        
        // Calculer les gains du livreur (40% des frais de livraison)
        const driverEarnings = DriverEarningsService.calculateEarnings(order.delivery_fee);
       
        // Calculer la distance estimée (simulation)
        const estimatedDistance = Math.round(Math.random() * 8 + 2);
        
        // Calculer la durée estimée (simulation)
        const estimatedDuration = Math.round(estimatedDistance * 3 + Math.random() * 10);

        if (isPackageOrder && packageDetails) {
          // Commande de colis
          return {
            id: order.order_number || order.id,
            order_id: order.id,
            business_name: order.businesses?.name || 'Service de Colis',
            customer_name: packageDetails.customer_name || 'Client',
            order_details: `Colis - ${packageDetails.service_name}`,
            pickup_address: packageDetails.pickup_address || 'Point de collecte',
            delivery_address: packageDetails.delivery_address || 'Adresse de livraison',
            business_phone: order.businesses?.phone,
            business_email: order.businesses?.email,
            customer_phone: packageDetails.customer_phone,
            status: order.status,
            order_items: [], // Pas d'items pour les colis
            estimated_distance: estimatedDistance,
            estimated_duration: estimatedDuration,
            delivery_fee: order.delivery_fee,
            scheduled_delivery_window_start: packageDetails.estimated_delivery_time || order.created_at,
            scheduled_delivery_window_end: packageDetails.estimated_delivery_time || order.created_at,
            created_at: order.created_at,
            is_package_order: true,
            is_grouped_delivery: isGroupedDelivery,
            packageDetails: {
              weight: packageDetails.package_weight,
              dimensions: packageDetails.package_dimensions,
              description: packageDetails.package_description,
              is_fragile: packageDetails.is_fragile,
              is_urgent: packageDetails.is_urgent,
            },
            pickupInstructions: packageDetails.pickup_instructions,
            deliveryInstructions: packageDetails.delivery_instructions,
            preferredTime: packageDetails.preferred_time,
            contactMethod: packageDetails.contact_method,
          };
        } else if (isGroupedDelivery) {
          // Commande groupée
          return {
            id: order.order_number || order.id,
            order_id: order.id,
            business_name: order.businesses?.name || 'Livraison Groupée',
            customer_name: order.user_profiles?.name || 'Client',
            order_details: `Livraison groupée - ${order.group_sequence || 1} commande(s)`,
            pickup_address: order.businesses?.address || 'Adresse de récupération',
            delivery_address: order.delivery_address || order.user_profiles?.address || 'Adresse de livraison',
            business_phone: order.businesses?.phone,
            business_email: order.businesses?.email,
            customer_phone: order.user_profiles?.phone_number,
            status: order.status,
            order_items: order.order_items || [],
            estimated_distance: estimatedDistance,
            estimated_duration: estimatedDuration,
            delivery_fee: order.delivery_fee,
            scheduled_delivery_window_start: order.scheduled_delivery_window_start || order.created_at,
            scheduled_delivery_window_end: order.scheduled_delivery_window_end || order.created_at,
            created_at: order.created_at,
            is_package_order: false,
            is_grouped_delivery: true,
          };
        } else {
          // Commande normale
          return {
            id: order.order_number || order.id,
            order_id: order.id,
            business_name: order.businesses?.name || 'Restaurant',
            customer_name: order.user_profiles?.name || 'Client',
            order_details: 'Commande standard',
            pickup_address: order.businesses?.address || 'Adresse de récupération',
            delivery_address: order.delivery_address || order.user_profiles?.address || 'Adresse de livraison',
            business_phone: order.businesses?.phone,
            business_email: order.businesses?.email,
            customer_phone: order.user_profiles?.phone_number,
            status: order.status,
            order_items: order.order_items || [],
            estimated_distance: estimatedDistance,
            estimated_duration: estimatedDuration,
            delivery_fee: order.delivery_fee,
            scheduled_delivery_window_start: order.scheduled_delivery_window_start || order.created_at,
            scheduled_delivery_window_end: order.scheduled_delivery_window_end || order.created_at,
            created_at: order.created_at,
            is_package_order: false,
            is_grouped_delivery: false,
          };
        }
      }) || [];

      setAvailableOffers(transformedOffers);
    } catch (error) {
      console.error('Erreur lors du chargement des offres:', error);
      Alert.alert('Erreur', 'Impossible de charger les offres disponibles');
    } finally {
      setLoading(false);
    }
  };

  // Accepter une offre
  const handleAcceptOffer = async (offer: ProgrammedOrder) => {
    try {
      // Toutes les commandes (normales ET colis) sont dans la table orders
      const { error } = await supabase
        .from('orders')
        .update({ 
          driver_id: profile?.id,
          status: 'out_for_delivery',
          available_for_drivers: false
        })
        .eq('id', offer.order_id);

      if (error) {
        console.error('Erreur lors de l\'acceptation de l\'offre:', error);
        Alert.alert('Erreur', 'Impossible d\'accepter cette offre');
        return;
      }

      // Enregistrer les gains du driver (sera confirmé quand la commande sera livrée)
      const earningsResult = await DriverEarningsService.recordDriverEarnings(
        profile?.id!,
        offer.order_id,
        offer.delivery_fee
      );

      if (!earningsResult.success) {
        console.warn('Erreur lors de l\'enregistrement des gains:', earningsResult.error);
        // Ne pas faire échouer l'acceptation pour une erreur de gains
      }

      // Ajouter l'offre au contexte local
      const offerToAccept = {
        id: offer.id,
        restaurant: offer.business_name,
        status: 'accepted',
        assignedBy: 'Système',
        time: new Date(offer.scheduled_delivery_window_start).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        details: offer.is_package_order ? `📦 ${offer.order_details}` : offer.order_details,
        client: offer.customer_name,
        duration: `${offer.estimated_duration} min`,
        gain: DriverEarningsService.formatEarnings(DriverEarningsService.calculateEarnings(offer.delivery_fee)),
        distance: `${offer.estimated_distance} km`,
        date: new Date(offer.scheduled_delivery_window_start).toISOString().split('T')[0],
        isPackageOrder: offer.is_package_order || false,
      };

      acceptOffer(offerToAccept);
      
      // Recharger les offres disponibles
      await loadAvailableOffers();
      
      const message = offer.is_package_order 
        ? 'Offre de livraison de colis acceptée avec succès !' 
        : 'Offre acceptée avec succès !';
      Alert.alert('Succès', message);
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
      const errorMessage = offer.is_package_order 
        ? 'Impossible d\'accepter cette offre de colis' 
        : 'Impossible d\'accepter cette offre';
      Alert.alert('Erreur', errorMessage);
    }
  };

  // Refresh des offres
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAvailableOffers();
    setRefreshing(false);
  };

  // Charger les offres au montage du composant
  useEffect(() => {
    loadAvailableOffers();
  }, [profile?.business_id, isIndependent]);

  // Handler for horizontal scroll
  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const cardWidth = 260 + 16; // width + marginRight
    const index = Math.round(x / cardWidth);
    setCurrentIndex(index);
  };

  // Formater l'heure de livraison
  const formatDeliveryTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const startFormatted = start.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const endFormatted = end.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `${startFormatted} - ${endFormatted}`;
  };

  // Ouvrir le modal de détails
  const openOfferDetails = (offer: ProgrammedOrder) => {
    setSelectedOffer(offer);
    setModalVisible(true);
  };

  // Fermer le modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedOffer(null);
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formater le statut de la commande
  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'preparing': 'En préparation',
      'ready': 'Prête',
      'picked_up': 'Récupérée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée',
      'scheduled': 'Programmée'
    };
    return statusMap[status] || status;
  };

  // Obtenir la couleur du statut (configuration uniformisée)
  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'pending': '#F59E0B',      // Orange/Ambre
      'confirmed': '#3B82F6',    // Bleu
      'preparing': '#F59E0B',    // Orange/Ambre
      'ready': '#10B981',        // Vert
      'picked_up': '#8B5CF6',    // Violet
      'out_for_delivery': '#FF9800', // Orange vif
      'delivered': '#10B981',    // Vert
      'cancelled': '#EF4444',    // Rouge
      'scheduled': '#FF9800'     // Orange foncé
    };
    return colorMap[status] || DARK_GRAY;
  };

  // Formater le prix en GNF (Francs Guinéens)
  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR') + ' GNF';
  };

  // Obtenir le nombre d'offres par type
  const ordersCount = availableOffers.filter(offer => !offer.is_package_order).length; // Commandes + groupes
  const packagesCount = availableOffers.filter(offer => offer.is_package_order).length; // Seulement colis

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.mainScrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY]}
            tintColor={PRIMARY}
            title="Actualisation..."
            titleColor={PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSimple}>
          <Text style={styles.headerTitle}>Offres Disponibles</Text>
          <Text style={styles.headerSubtitle}>
            Commandes programmées prêtes à être livrées
          </Text>
        </View>

      {/* Onglets */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
                     <MaterialIcons 
             name="restaurant" 
             size={20} 
             color={activeTab === 'orders' ? PRIMARY : DARK_GRAY} 
           />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            Commandes ({ordersCount})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'packages' && styles.activeTab]}
          onPress={() => setActiveTab('packages')}
        >
                     <MaterialIcons 
             name="local-shipping" 
             size={20} 
             color={activeTab === 'packages' ? PRIMARY : DARK_GRAY} 
           />
          <Text style={[styles.tabText, activeTab === 'packages' && styles.activeTabText]}>
            Colis ({packagesCount})
          </Text>
        </TouchableOpacity>

        
      </View>
      
      {loading ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="hourglass-empty" size={64} color={PRIMARY} />
          <Text style={styles.emptyText}>Chargement des offres...</Text>
        </View>
      ) : filteredOffers.length === 0 ? (
        <View style={styles.emptyContainer}>
                     <MaterialIcons 
             name={
               activeTab === 'orders' ? 'restaurant' : 
               'local-shipping'
             } 
             size={64} 
             color={DARK_GRAY} 
           />
                     <Text style={styles.emptyText}>
             {activeTab === 'orders' ? 'Aucune commande disponible' : 
              'Aucun colis disponible'}
           </Text>
           <Text style={styles.emptySubtext}>
             {activeTab === 'orders' 
               ? 'Aucune commande programmée disponible pour le moment'
               : 'Aucune livraison de colis disponible pour le moment'
             }
           </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.offersList}
          horizontal={filteredOffers.length > 1}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.horizontalList,
            filteredOffers.length === 1 && styles.singleItemContainer
          ]}
          ref={scrollRef}
          onScroll={filteredOffers.length > 1 ? handleScroll : undefined}
          scrollEventThrottle={16}
        >
          {filteredOffers.map((offer) => (
            <TouchableOpacity 
              key={offer.id} 
              style={[
                styles.offerCardSimpleHorizontal,
                filteredOffers.length === 1 && styles.singleItemCard
              ]}
              onPress={() => openOfferDetails(offer)}
              activeOpacity={0.8}
            >
              <View style={styles.offerHeader}>
                <MaterialIcons name="schedule" size={16} color={PRIMARY} />
                <Text style={styles.deliveryTime}>
                  {formatDeliveryTime(offer.scheduled_delivery_window_start, offer.scheduled_delivery_window_end)}
                </Text>
              </View>
              
              <Text style={styles.restaurantName}>{offer.business_name}</Text>
              <Text style={styles.details}>
                {offer.is_package_order ? (
                  <Text style={styles.packageBadge}>📦 {offer.order_details}</Text>
                ) : offer.is_grouped_delivery ? (
                  <Text style={styles.groupBadge}>👥 {offer.order_details}</Text>
                ) : (
                  offer.order_details
                )}
              </Text>
              
              <View style={styles.customerInfo}>
                <MaterialIcons name="person" size={14} color={DARK_GRAY} />
                <Text style={styles.customerName}>{offer.customer_name}</Text>
              </View>
              
              <View style={styles.rowInfo}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="euro" size={18} color={PRIMARY} />
                  <Text style={styles.gain}>{DriverEarningsService.formatEarnings(DriverEarningsService.calculateEarnings(offer.delivery_fee))}</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="place" size={18} color={DARK_GRAY} />
                  <Text style={styles.distance}>{offer.estimated_distance} km</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="access-time" size={18} color={DARK_GRAY} />
                  <Text style={styles.duration}>{offer.estimated_duration} min</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.acceptBtn} 
                onPress={(e) => {
                  e.stopPropagation();
                  handleAcceptOffer(offer);
                }}
              >
                <Text style={styles.acceptBtnText}>Accepter</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      {/* Pagination Dots */}
      {!loading && filteredOffers.length > 1 && (
        <View style={styles.paginationContainer}>
          {filteredOffers.map((_, idx) => (
            <View
              key={idx}
              style={[styles.paginationDot, currentIndex === idx && styles.paginationDotActive]}
            />
          ))}
        </View>
      )}

      {/* Modal de détails */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOffer && (
              <>
                <View style={styles.modalHeader}>
                                     <Text style={styles.modalTitle}>
                     {selectedOffer.is_package_order ? 'Détails de la livraison de colis' : 
                      'Détails de la commande'}
                   </Text>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <MaterialIcons name="close" size={24} color={DARK_GRAY} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {/* Statut de la commande */}
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialIcons name="info" size={20} color={PRIMARY} />
                      <Text style={styles.sectionTitle}>Statut de la commande</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOffer.status) }]}>
                      <Text style={styles.statusText}>{formatStatus(selectedOffer.status)}</Text>
                    </View>
                  </View>

                  {/* Informations du restaurant/service */}
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialIcons 
                        name={
                          selectedOffer.is_package_order ? "local-shipping" : 
                          selectedOffer.is_grouped_delivery ? "group-work" :
                          "restaurant"
                        } 
                        size={20} 
                        color={PRIMARY} 
                      />
                                             <Text style={styles.sectionTitle}>
                         {selectedOffer.is_package_order ? 'Service de Colis' : 
                          'Restaurant'}
                       </Text>
                    </View>
                    <Text style={styles.modalText}>{selectedOffer.business_name}</Text>
                    <Text style={styles.modalSubtext}>{selectedOffer.pickup_address}</Text>
                    <View style={styles.modalRow}>
                      <MaterialIcons name="phone" size={16} color={DARK_GRAY} />
                      <Text style={styles.modalText}>Téléphone: {selectedOffer.business_phone || 'Non disponible'}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <MaterialIcons name="email" size={16} color={DARK_GRAY} />
                      <Text style={styles.modalText}>Email: {selectedOffer.business_email || 'Non disponible'}</Text>
                    </View>
                  </View>

                  {/* Informations du client */}
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialIcons name="person" size={20} color={PRIMARY} />
                      <Text style={styles.sectionTitle}>Client</Text>
                    </View>
                    <Text style={styles.modalText}>{selectedOffer.customer_name}</Text>
                    <Text style={styles.modalSubtext}>{selectedOffer.delivery_address}</Text>
                    <View style={styles.modalRow}>
                      <MaterialIcons name="phone" size={16} color={DARK_GRAY} />
                      <Text style={styles.modalText}>Téléphone: {selectedOffer.customer_phone || 'Non disponible'}</Text>
                    </View>
                  </View>

                  {/* Détails de la commande */}
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialIcons 
                        name={
                          selectedOffer.is_package_order ? "inventory" : 
                          selectedOffer.is_grouped_delivery ? "group-work" :
                          "receipt"
                        } 
                        size={20} 
                        color={PRIMARY} 
                      />
                                             <Text style={styles.sectionTitle}>
                         {selectedOffer.is_package_order ? 'Détails du Colis' : 
                          'Items de la commande'}
                       </Text>
                    </View>
                    {selectedOffer.is_package_order ? (
                      // Affichage pour les commandes de colis
                      <View style={styles.packageDetails}>
                        <Text style={styles.modalText}>
                          <Text style={styles.packageBadge}>📦 {selectedOffer.order_details}</Text>
                        </Text>
                        <Text style={styles.modalSubtext}>
                          Service de livraison de colis spécialisé
                        </Text>
                        
                        {/* Détails spécifiques du colis */}
                        {selectedOffer.packageDetails && (
                          <View style={styles.packageSpecificDetails}>
                            <View style={styles.modalRow}>
                              <MaterialIcons name="scale" size={16} color={DARK_GRAY} />
                              <Text style={styles.modalText}>Poids: {selectedOffer.packageDetails.weight}</Text>
                            </View>
                            {selectedOffer.packageDetails.dimensions && (
                              <View style={styles.modalRow}>
                                <MaterialIcons name="straighten" size={16} color={DARK_GRAY} />
                                <Text style={styles.modalText}>Dimensions: {selectedOffer.packageDetails.dimensions}</Text>
                              </View>
                            )}
                            {selectedOffer.packageDetails.description && (
                              <View style={styles.modalRow}>
                                <MaterialIcons name="description" size={16} color={DARK_GRAY} />
                                <Text style={styles.modalText}>Description: {selectedOffer.packageDetails.description}</Text>
                              </View>
                            )}
                            <View style={styles.modalRow}>
                              <MaterialIcons name="warning" size={16} color={selectedOffer.packageDetails.is_fragile ? "#FF6B6B" : DARK_GRAY} />
                              <Text style={[styles.modalText, selectedOffer.packageDetails.is_fragile && styles.fragileText]}>
                                Fragile: {selectedOffer.packageDetails.is_fragile ? 'Oui' : 'Non'}
                              </Text>
                            </View>
                            <View style={styles.modalRow}>
                              <MaterialIcons name="priority-high" size={16} color={selectedOffer.packageDetails.is_urgent ? "#FF9800" : DARK_GRAY} />
                              <Text style={[styles.modalText, selectedOffer.packageDetails.is_urgent && styles.urgentText]}>
                                Urgent: {selectedOffer.packageDetails.is_urgent ? 'Oui' : 'Non'}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    ) : selectedOffer.is_grouped_delivery ? (
                      // Affichage pour les livraisons groupées
                      <View style={styles.groupDetails}>
                        <Text style={styles.modalText}>
                          <Text style={styles.groupBadge}>👥 {selectedOffer.order_details}</Text>
                        </Text>
                        <Text style={styles.modalSubtext}>
                          Livraison groupée - Plusieurs commandes en une seule livraison
                        </Text>
                        
                        {/* Informations sur le groupe */}
                        <View style={styles.groupSpecificDetails}>
                          <View style={styles.modalRow}>
                            <MaterialIcons name="group-work" size={16} color={DARK_GRAY} />
                            <Text style={styles.modalText}>Type: Livraison groupée</Text>
                          </View>
                          <View style={styles.modalRow}>
                            <MaterialIcons name="local-shipping" size={16} color={DARK_GRAY} />
                            <Text style={styles.modalText}>Service: Livraison optimisée</Text>
                          </View>
                          <View style={styles.modalRow}>
                            <MaterialIcons name="euro" size={16} color={DARK_GRAY} />
                            <Text style={styles.modalText}>Gains optimisés: {formatPrice(Math.round(selectedOffer.delivery_fee * 0.40))}</Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      // Affichage pour les commandes normales
                      selectedOffer.order_items && selectedOffer.order_items.length > 0 ? (
                        selectedOffer.order_items.map((item, index) => (
                          <View key={item.id || index} style={styles.orderItem}>
                            <View style={styles.orderItemHeader}>
                              <View style={styles.orderItemInfo}>
                                {item.image && (
                                  <View style={styles.orderItemImageContainer}>
                                    <Image source={{ uri: item.image }} style={styles.orderItemImage} />
                                  </View>
                                )}
                                <Text style={styles.orderItemName}>{item.name}</Text>
                              </View>
                              <Text style={styles.orderItemPrice}>{formatPrice(item.price)}</Text>
                            </View>
                            <View style={styles.orderItemDetails}>
                              <Text style={styles.orderItemQuantity}>Quantité: {item.quantity}</Text>
                              {item.special_instructions && (
                                <Text style={styles.orderItemInstructions}>
                                  Instructions: {item.special_instructions}
                                </Text>
                              )}
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.modalText}>Aucun détail disponible</Text>
                      )
                    )}
                  </View>

                  {/* Horaires de livraison */}
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialIcons name="schedule" size={20} color={PRIMARY} />
                      <Text style={styles.sectionTitle}>Horaires de livraison</Text>
                    </View>
                    <Text style={styles.modalText}>
                      {formatDeliveryTime(selectedOffer.scheduled_delivery_window_start, selectedOffer.scheduled_delivery_window_end)}
                    </Text>
                    <Text style={styles.modalSubtext}>
                      {formatDate(selectedOffer.scheduled_delivery_window_start)}
                    </Text>
                  </View>

                  {/* Informations de livraison */}
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialIcons name="local-shipping" size={20} color={PRIMARY} />
                                             <Text style={styles.sectionTitle}>
                         {selectedOffer.is_package_order ? 'Informations de livraison de colis' : 
                          'Informations de livraison'}
                       </Text>
                    </View>
                    
                    {selectedOffer.is_package_order ? (
                      // Affichage pour les colis
                      <>
                        <View style={styles.modalRow}>
                          <MaterialIcons name="location-on" size={16} color="#3B82F6" />
                          <Text style={styles.modalText}>Point de collecte: {selectedOffer.pickup_address}</Text>
                        </View>
                        {selectedOffer.pickupInstructions && (
                          <View style={styles.modalRow}>
                            <MaterialIcons name="info" size={16} color="#3B82F6" />
                            <Text style={styles.modalSubtext}>Instructions collecte: {selectedOffer.pickupInstructions}</Text>
                          </View>
                        )}
                        <View style={styles.modalRow}>
                          <MaterialIcons name="location-on" size={16} color="#10B981" />
                          <Text style={styles.modalText}>Adresse de livraison: {selectedOffer.delivery_address}</Text>
                        </View>
                        {selectedOffer.deliveryInstructions && (
                          <View style={styles.modalRow}>
                            <MaterialIcons name="info" size={16} color="#10B981" />
                            <Text style={styles.modalSubtext}>Instructions livraison: {selectedOffer.deliveryInstructions}</Text>
                          </View>
                        )}
                        <View style={styles.modalRow}>
                          <MaterialIcons name="place" size={16} color={DARK_GRAY} />
                          <Text style={styles.modalText}>Distance: {selectedOffer.estimated_distance} km</Text>
                        </View>
                        <View style={styles.modalRow}>
                          <MaterialIcons name="access-time" size={16} color={DARK_GRAY} />
                          <Text style={styles.modalText}>Durée estimée: {selectedOffer.estimated_duration} min</Text>
                        </View>
                      </>
                    ) : (
                      // Affichage pour les commandes normales
                      <>
                        <View style={styles.modalRow}>
                          <MaterialIcons name="place" size={16} color={DARK_GRAY} />
                          <Text style={styles.modalText}>Distance: {selectedOffer.estimated_distance} km</Text>
                        </View>
                        <View style={styles.modalRow}>
                          <MaterialIcons name="access-time" size={16} color={DARK_GRAY} />
                          <Text style={styles.modalText}>Durée estimée: {selectedOffer.estimated_duration} min</Text>
                        </View>
                      </>
                    )}
                  </View>

                  {/* Gains */}
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialIcons name="euro" size={20} color={PRIMARY} />
                      <Text style={styles.sectionTitle}>Gains</Text>
                    </View>
                    <Text style={styles.modalGain}>{DriverEarningsService.formatEarnings(DriverEarningsService.calculateEarnings(selectedOffer.delivery_fee))}</Text>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.modalAcceptBtn} 
                    onPress={() => {
                      handleAcceptOffer(selectedOffer);
                      closeModal();
                    }}
                  >
                                         <Text style={styles.modalAcceptBtnText}>
                       {selectedOffer.is_package_order ? 'Accepter cette livraison de colis' : 
                        'Accepter cette commande'}
                     </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  mainScrollView: {
    flex: 1,
  },
  headerSimple: {
    padding: 20,
    backgroundColor: DARK_BG,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: DARK_GRAY,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },

  offersList: {
    flex: 1,
    paddingTop: 12,
  },
  offerCardSimple: {
    backgroundColor: DARK_CARD,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  restaurantName: {
    fontSize: 17,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 4,
  },
  details: {
    fontSize: 15,
    color: DARK_TEXT,
    marginBottom: 10,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
  },
  gain: {
    fontSize: 15,
    color: PRIMARY,
    fontWeight: '700',
    marginLeft: 4,
  },
  distance: {
    fontSize: 15,
    color: DARK_TEXT,
    marginLeft: 4,
  },
  acceptBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  acceptBtnText: {
    color: DARK_TEXT,
    fontWeight: '700',
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  horizontalList: {
    paddingLeft: 16,
    paddingVertical: 24,
    alignItems: 'flex-start',
  },
  singleItemContainer: {
    paddingLeft: 16,
    paddingRight: 16,
    alignItems: 'stretch',
  },
  offerCardSimpleHorizontal: {
    backgroundColor: DARK_CARD,
    borderRadius: 14,
    marginRight: 16,
    width: 260,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  singleItemCard: {
    width: '100%',
    marginRight: 0,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryTime: {
    fontSize: 13,
    color: DARK_TEXT,
    marginLeft: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 14,
    color: DARK_TEXT,
    marginLeft: 8,
  },
  duration: {
    fontSize: 15,
    color: DARK_TEXT,
    marginLeft: 4,
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

  // Styles du modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: DARK_CARD,
    borderRadius: 20,
    width: '90%',
    maxHeight: '90%',
    minHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: DARK_GRAY,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY,
    marginLeft: 8,
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
  modalGain: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY,
    textAlign: 'center',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: DARK_GRAY,
  },
  modalAcceptBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalAcceptBtnText: {
    color: DARK_TEXT,
    fontWeight: '700',
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusText: {
    color: DARK_TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  orderItem: {
    backgroundColor: DARK_BG,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  orderItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderItemImageContainer: {
    marginRight: 12,
  },
  orderItemImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: DARK_GRAY,
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK_TEXT,
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: PRIMARY,
  },
  packageBadge: {
    backgroundColor: '#3B82F6',
    color: WHITE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  groupBadge: {
    backgroundColor: '#8B5CF6',
    color: WHITE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  packageDetails: {
    backgroundColor: DARK_BG,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  orderItemDetails: {
    marginTop: 4,
  },
  orderItemQuantity: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  orderItemInstructions: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  packageSpecificDetails: {
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: DARK_GRAY,
  },
  groupDetails: {
    backgroundColor: DARK_BG,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  groupSpecificDetails: {
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: DARK_GRAY,
  },
  fragileText: {
    color: '#FF6B6B',
  },
  urgentText: {
    color: '#FF9800',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: DARK_CARD,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DARK_GRAY,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: PRIMARY,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: DARK_GRAY,
  },
  activeTabText: {
    color: WHITE,
  },
}); 