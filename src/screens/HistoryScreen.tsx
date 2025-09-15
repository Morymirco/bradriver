import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../navigation';
import { DriverDashboardService } from '../services/driverDashboardService';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#fff';
const RED = '#E31837';
const DARK_HEADER = '#23262F';
const DARK_GRAY = '#353945';

// Interface pour les données d'historique
interface HistoryItem {
  id: string;
  restaurant: string;
  status: string;
  date: string;
  details: string;
  earnings: string;
  created_at: string;
  business_name?: string;
  order_items?: any[];
  order_number?: string;
}

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
  'En cours': '#F59E0B',
  'En route': '#8B5CF6',
};

const STATUS_ICONS = {
  // Statuts en anglais
  'pending': 'schedule',
  'confirmed': 'check-circle-outline',
  'preparing': 'restaurant',
  'ready': 'local-shipping',
  'picked_up': 'directions-car',
  'out_for_delivery': 'local-shipping',
  'delivered': 'check-circle',
  'cancelled': 'cancel',
  
  // Statuts traduits en français
  'En attente': 'schedule',
  'Confirmée': 'check-circle-outline',
  'En préparation': 'restaurant',
  'Prête': 'local-shipping',
  'Récupérée': 'directions-car',
  'En livraison': 'local-shipping',
  'Livrée': 'check-circle',
  'Annulée': 'cancel',
  
  // Anciens statuts pour compatibilité
  'En cours': 'directions-run',
  'En route': 'directions-car',
};

const filters = ['Toutes', 'Livrée', 'Annulée'];

export const HistoryScreen: React.FC = () => {
  const [filter, setFilter] = useState('Toutes');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { orders, error: historyError } = await DriverDashboardService.getDriverOrders();
      
      if (historyError) {
        setError(historyError);
        return;
      }

      // Transformer les données pour l'affichage
      const historyData = orders.map((order: any) => {
        const createdDate = new Date(order.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let dateText = '';
        if (diffDays === 1) {
          dateText = `Aujourd'hui ${createdDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 2) {
          dateText = `Hier ${createdDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
          dateText = `Il y a ${diffDays - 1} jours ${createdDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Générer les détails des articles
        const details = order.order?.items?.map((item: any) => 
          `${item.quantity || 1}x ${item.name || 'Article'}`
        ).join(', ') || 'Aucun détail disponible';

        // Calculer les gains (40% des frais de livraison)
        const earnings = order.status === 'delivered' 
          ? Math.round((order.order?.delivery_fee || 0) * 0.40)
          : 0;

                 return {
           id: order.id,
           restaurant: order.order?.business?.name || 'Restaurant',
           status: order.status,
           date: dateText,
           details: details,
           earnings: `${earnings.toLocaleString('fr-FR')} GNF`,
           created_at: order.created_at,
           business_name: order.order?.business?.name,
           order_items: order.order?.items || [],
           order_number: order.order?.order_number || order.id
         };
      });

      setHistory(historyData);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      setError('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const translateStatus = (status: string): string => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prête';
      case 'picked_up': return 'En route';
      case 'out_for_delivery': return 'En livraison';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const filteredHistory = history;

  const totalEarnings = filteredHistory
    .filter(item => translateStatus(item.status) === 'Livrée')
    .reduce((sum, item) => sum + parseFloat(item.earnings.replace(' GNF', '').replace(/\s/g, '')), 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={26} color={DARK_TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique</Text>
          <View style={{width: 32}} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RED} />
          <Text style={styles.loadingText}>Chargement de l'historique...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={26} color={DARK_TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique</Text>
          <View style={{width: 32}} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color={DARK_GRAY} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadHistory}>
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
        <Text style={styles.headerTitle}>Historique</Text>
        <View style={{width: 32}} />
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredHistory.length}</Text>
          <Text style={styles.statLabel}>Commandes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalEarnings.toLocaleString('fr-FR')} GNF</Text>
          <Text style={styles.statLabel}>Gains totaux</Text>
        </View>
      </View>

      

             {/* History List */}
       <ScrollView style={styles.scrollView} contentContainerStyle={{paddingBottom: 20}}>
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={64} color={DARK_GRAY} />
            <Text style={styles.emptyText}>Aucune commande trouvée</Text>
          </View>
        ) : (
          filteredHistory.map((item, idx) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.card, idx < filteredHistory.length - 1 && styles.cardMargin]}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.order_id || item.order?.id || item.id })}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.rowBetween}>
                                     <View style={{flexDirection:'row', alignItems:'center'}}>
                     <MaterialIcons name={(STATUS_ICONS[translateStatus(item.status) as keyof typeof STATUS_ICONS] || 'info') as any} size={22} color={STATUS_COLORS[translateStatus(item.status) as keyof typeof STATUS_COLORS] || DARK_GRAY} style={{marginRight:8}} />
                     <Text style={styles.cardId}>#{item.order_number || item.id}</Text>
                   </View>
                  <View style={[styles.statusBadge, {backgroundColor: STATUS_COLORS[translateStatus(item.status) as keyof typeof STATUS_COLORS] || DARK_GRAY, shadowColor: STATUS_COLORS[translateStatus(item.status) as keyof typeof STATUS_COLORS] || DARK_GRAY, shadowOpacity: 0.18, shadowRadius: 4, elevation: 2}]}> 
                    <Text style={styles.statusText}>{translateStatus(item.status)}</Text>
                  </View>
                </View>
                <Text style={styles.cardRestaurant}>{item.restaurant}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardDetails}>{item.details}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardTime}>{item.date}</Text>
                  <Text style={[styles.earnings, translateStatus(item.status) === 'Livrée' && styles.earningsSuccess]}>
                    {item.earnings}
                  </Text>
                </View>
              </View>
              {idx < filteredHistory.length - 1 && <View style={styles.cardSeparator} />}
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
    fontSize: 22,
    fontWeight: '700',
    color: RED,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: DARK_CARD,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: RED,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: DARK_TEXT,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: DARK_GRAY,
    marginHorizontal: 20,
  },

  scrollView: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: DARK_GRAY,
    marginTop: 16,
    fontWeight: '600',
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
    backgroundColor: RED,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  retryBtnText: {
    color: DARK_TEXT,
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: DARK_CARD,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardMargin: {
    marginBottom: 12,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: DARK_GRAY,
    opacity: 0.12,
    marginHorizontal: 16,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardId: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: DARK_TEXT,
    fontWeight: '700',
    fontSize: 13,
  },
  cardRestaurant: {
    fontSize: 17,
    fontWeight: '700',
    color: RED,
    marginTop: 4,
    marginBottom: 4,
  },
  cardContent: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cardDetails: {
    fontSize: 15,
    color: DARK_TEXT,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTime: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  earnings: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK_GRAY,
  },
  earningsSuccess: {
    color: '#10B981',
  },
}); 