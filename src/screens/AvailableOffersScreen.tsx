import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOffers } from '../components/OffersContext';
import { useDriver } from '../hooks';
import { supabase } from '../lib/supabase';

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
  driver_earnings: number;
  scheduled_delivery_window_start: string;
  scheduled_delivery_window_end: string;
  created_at: string;
}

export const AvailableOffersScreen: React.FC = () => {
  const { acceptedOffers, acceptOffer } = useOffers();
  const { profile, isIndependent } = useDriver();
  
  const [availableOffers, setAvailableOffers] = useState<ProgrammedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [selectedOffer, setSelectedOffer] = useState<ProgrammedOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Pagination state
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Charger les offres disponibles (commandes programmées à l'état "prêt")
  const loadAvailableOffers = async () => {
    try {
      setLoading(true);
      

      
             // Requête avec jointures pour récupérer les informations complètes
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
        .eq('available_for_drivers', true)  // Disponibles pour les chauffeurs
        .is('driver_id', null)              // Non assignées à un chauffeur
        .order('scheduled_delivery_window_start', { ascending: true });

      // Si le chauffeur appartient à un business, filtrer par ce business
      if (profile?.business_id && !isIndependent) {
        query = query.eq('business_id', profile.business_id);
      }

      const { data, error } = await query;

      // Si aucune donnée trouvée, essayer une requête alternative
      if (!data || data.length === 0) {
        
                 let alternativeQuery = supabase
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
          .eq('available_for_drivers', true)
          .is('driver_id', null)
          .order('created_at', { ascending: false })
          .limit(10);

        if (profile?.business_id && !isIndependent) {
          alternativeQuery = alternativeQuery.eq('business_id', profile.business_id);
        }

        const { data: altData, error: altError } = await alternativeQuery;

                 if (altData && altData.length > 0) {
           // Utiliser les données de la requête alternative
           const transformedOffers: ProgrammedOrder[] = altData.map(order => {
             // Calculer les gains du chauffeur (15% par défaut)
             const driverEarnings = Math.round((order.grand_total * 0.15) / 100);
             
             // Calculer la distance estimée (simulation)
             const estimatedDistance = Math.round(Math.random() * 8 + 2);
             
             // Calculer la durée estimée (simulation)
             const estimatedDuration = Math.round(estimatedDistance * 3 + Math.random() * 10);

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
               driver_earnings: driverEarnings,
               scheduled_delivery_window_start: order.scheduled_delivery_window_start || order.created_at,
               scheduled_delivery_window_end: order.scheduled_delivery_window_end || order.created_at,
               created_at: order.created_at,
             };
           });

          setAvailableOffers(transformedOffers);
          return;
        }
      }



      if (error) {
        console.error('Erreur lors du chargement des offres:', error);
        Alert.alert('Erreur', 'Impossible de charger les offres disponibles');
        return;
      }

             // Transformer les données pour correspondre à notre interface
       const transformedOffers: ProgrammedOrder[] = (data || []).map((order) => {
         // Calculer les gains du chauffeur (15% par défaut)
         const driverEarnings = Math.round((order.grand_total * 0.15) / 100);
         
         // Calculer la distance estimée (simulation)
         const estimatedDistance = Math.round(Math.random() * 8 + 2);
         
         // Calculer la durée estimée (simulation)
         const estimatedDuration = Math.round(estimatedDistance * 3 + Math.random() * 10);

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
           driver_earnings: driverEarnings,
           scheduled_delivery_window_start: order.scheduled_delivery_window_start || order.created_at,
           scheduled_delivery_window_end: order.scheduled_delivery_window_end || order.created_at,
           created_at: order.created_at,
         };
       });

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
      // Mettre à jour la commande avec l'ID du chauffeur et la marquer comme non disponible
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
         details: offer.order_details,
         client: offer.customer_name,
         duration: `${offer.estimated_duration} min`,
         gain: formatPrice(offer.driver_earnings),
         distance: `${offer.estimated_distance} km`,
         date: new Date(offer.scheduled_delivery_window_start).toISOString().split('T')[0],
       };

      acceptOffer(offerToAccept);
      
      // Recharger les offres disponibles
      await loadAvailableOffers();
      
      Alert.alert('Succès', 'Offre acceptée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
      Alert.alert('Erreur', 'Impossible d\'accepter cette offre');
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

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'pending': '#FFA500', // Orange
      'confirmed': '#4CAF50', // Vert
      'preparing': '#2196F3', // Bleu
      'ready': '#4CAF50', // Vert
      'picked_up': '#9C27B0', // Violet
      'delivered': '#4CAF50', // Vert
      'cancelled': '#F44336', // Rouge
      'scheduled': '#FF9800' // Orange foncé
    };
    return colorMap[status] || DARK_GRAY;
  };

  // Formater le prix en GNF (Francs Guinéens)
  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR') + ' GNF';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSimple}>
        <Text style={styles.headerTitle}>Offres Disponibles</Text>
        <Text style={styles.headerSubtitle}>
          Commandes programmées prêtes à être livrées
        </Text>

      </View>
      
      {loading ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="hourglass-empty" size={64} color={PRIMARY} />
          <Text style={styles.emptyText}>Chargement des offres...</Text>
        </View>
      ) : availableOffers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="local-offer" size={64} color={DARK_GRAY} />
          <Text style={styles.emptyText}>Aucune offre disponible</Text>
          <Text style={styles.emptySubtext}>
            {isIndependent 
              ? 'Aucune commande programmée disponible pour le moment'
              : 'Aucune commande de votre service disponible pour le moment'
            }
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.offersList}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          ref={scrollRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
        >
                     {availableOffers.map((offer) => (
             <TouchableOpacity 
               key={offer.id} 
               style={styles.offerCardSimpleHorizontal}
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
               <Text style={styles.details}>{offer.order_details}</Text>
               
               <View style={styles.customerInfo}>
                 <MaterialIcons name="person" size={14} color={DARK_GRAY} />
                 <Text style={styles.customerName}>{offer.customer_name}</Text>
               </View>
               
               <View style={styles.rowInfo}>
                                   <View style={styles.infoItem}>
                    <MaterialIcons name="euro" size={18} color={PRIMARY} />
                    <Text style={styles.gain}>{formatPrice(offer.driver_earnings)}</Text>
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
      {!loading && availableOffers.length > 1 && (
        <View style={styles.paginationContainer}>
          {availableOffers.map((_, idx) => (
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
                   <Text style={styles.modalTitle}>Détails de la commande</Text>
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

                    {/* Informations du restaurant */}
                    <View style={styles.modalSection}>
                      <View style={styles.sectionHeader}>
                        <MaterialIcons name="restaurant" size={20} color={PRIMARY} />
                        <Text style={styles.sectionTitle}>Restaurant</Text>
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
                        <MaterialIcons name="receipt" size={20} color={PRIMARY} />
                        <Text style={styles.sectionTitle}>Items de la commande</Text>
                      </View>
                      {selectedOffer.order_items && selectedOffer.order_items.length > 0 ? (
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
                       <Text style={styles.sectionTitle}>Informations de livraison</Text>
                     </View>
                     <View style={styles.modalRow}>
                       <MaterialIcons name="place" size={16} color={DARK_GRAY} />
                       <Text style={styles.modalText}>Distance: {selectedOffer.estimated_distance} km</Text>
                     </View>
                     <View style={styles.modalRow}>
                       <MaterialIcons name="access-time" size={16} color={DARK_GRAY} />
                       <Text style={styles.modalText}>Durée estimée: {selectedOffer.estimated_duration} min</Text>
                     </View>
                   </View>

                   {/* Gains */}
                   <View style={styles.modalSection}>
                     <View style={styles.sectionHeader}>
                       <MaterialIcons name="euro" size={20} color={PRIMARY} />
                       <Text style={styles.sectionTitle}>Gains</Text>
                     </View>
                                           <Text style={styles.modalGain}>{formatPrice(selectedOffer.driver_earnings)}</Text>
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
                     <Text style={styles.modalAcceptBtnText}>Accepter cette commande</Text>
                   </TouchableOpacity>
                 </View>
               </>
             )}
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
}); 