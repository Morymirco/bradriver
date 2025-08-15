import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, FlatList, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#fff';
const RED = '#E31837';
const DARK_HEADER = '#23262F';
const DARK_GRAY = '#353945';

const HISTORY = [
  { 
    id: 'CMD-003', 
    restaurant: 'Burger House', 
    status: 'Livrée', 
    date: 'Hier 19:10', 
    details: '2x Double Cheese, 2x Frites',
    earnings: '12.50 €'
  },
  { 
    id: 'CMD-004', 
    restaurant: 'Le Bistrot', 
    status: 'Annulée', 
    date: 'Hier 18:00', 
    details: '1x Plat du jour',
    earnings: '0.00 €'
  },
  { 
    id: 'CMD-002', 
    restaurant: 'Sushi Zen', 
    status: 'Livrée', 
    date: 'Aujourd\'hui 12:45', 
    details: '1x Menu saumon, 1x Miso',
    earnings: '8.75 €'
  },
  { 
    id: 'CMD-001', 
    restaurant: 'Pizza Bella', 
    status: 'Livrée', 
    date: 'Aujourd\'hui 12:30', 
    details: '2x Margherita, 1x Coca',
    earnings: '10.25 €'
  },
  { 
    id: 'CMD-005', 
    restaurant: 'Tacos City', 
    status: 'Livrée', 
    date: 'Il y a 2 jours 20:15', 
    details: '3x Tacos poulet',
    earnings: '9.80 €'
  },
];

const STATUS_COLORS = { 
  'Livrée': '#10B981', 
  'Annulée': '#EF4444',
  'En cours': '#F59E0B',
  'pending': '#F59E0B',
  'confirmed': '#3B82F6',
  'preparing': '#F59E0B',
  'ready': '#10B981',
  'picked_up': '#8B5CF6',
  'delivered': '#10B981',
  'cancelled': '#EF4444',
  'En attente': '#F59E0B',
  'Confirmée': '#3B82F6',
  'En préparation': '#F59E0B',
  'Prête': '#10B981',
  'En route': '#8B5CF6',
};

const STATUS_ICONS = {
  'Livrée': 'check-circle',
  'Annulée': 'cancel',
  'En cours': 'directions-run',
  'pending': 'schedule',
  'confirmed': 'check-circle-outline',
  'preparing': 'restaurant',
  'ready': 'local-shipping',
  'picked_up': 'directions-car',
  'delivered': 'check-circle',
  'cancelled': 'cancel',
  'En attente': 'schedule',
  'Confirmée': 'check-circle-outline',
  'En préparation': 'restaurant',
  'Prête': 'local-shipping',
  'En route': 'directions-car',
};

const filters = ['Toutes', 'Livrée', 'Annulée', 'En cours', 'En attente', 'Confirmée', 'En préparation', 'Prête', 'En route'];

export const HistoryScreen: React.FC = () => {
  const [filter, setFilter] = useState('Toutes');
  const navigation = useNavigation<NavigationProp>();

  const translateStatus = (status: string): string => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prête';
      case 'picked_up': return 'En route';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const filteredHistory = HISTORY.filter(item => {
    if (filter === 'Toutes') return true;
    return translateStatus(item.status) === filter;
  });

  const totalEarnings = filteredHistory
    .filter(item => translateStatus(item.status) === 'Livrée')
    .reduce((sum, item) => sum + parseFloat(item.earnings.replace(' €', '')), 0);

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
          <Text style={styles.statNumber}>{totalEarnings.toFixed(2)} €</Text>
          <Text style={styles.statLabel}>Gains totaux</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }}
      >
        {filters.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={filter === f ? styles.filterTextActive : styles.filterText}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* History List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={{paddingBottom: 40}}>
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
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.rowBetween}>
                  <View style={{flexDirection:'row', alignItems:'center'}}>
                    <MaterialIcons name={(STATUS_ICONS[translateStatus(item.status) as keyof typeof STATUS_ICONS] || 'info') as any} size={22} color={STATUS_COLORS[translateStatus(item.status) as keyof typeof STATUS_COLORS] || DARK_GRAY} style={{marginRight:8}} />
                    <Text style={styles.cardId}>{item.id}</Text>
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
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
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
    fontSize: 24,
    fontWeight: '700',
    color: RED,
    marginBottom: 4,
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
  filterBar: {
    backgroundColor: DARK_HEADER,
    paddingVertical: 0,
    paddingHorizontal: 16,
    minHeight: 0,
    height: 'auto',
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: DARK_GRAY,
    borderRadius: 16,
    marginRight: 12,
    alignSelf: 'center',
  },
  filterBtnActive: {
    backgroundColor: RED,
  },
  filterText: {
    color: DARK_TEXT,
    fontWeight: '600',
    fontSize: 13,
  },
  filterTextActive: {
    color: DARK_TEXT,
    fontWeight: '700',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: DARK_GRAY,
    marginTop: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: DARK_CARD,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
  },
  cardMargin: {
    marginBottom: 16,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: DARK_GRAY,
    opacity: 0.12,
    marginHorizontal: 16,
  },
  cardHeader: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: DARK_GRAY,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardId: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: DARK_TEXT,
    fontWeight: '700',
    fontSize: 12,
  },
  cardRestaurant: {
    fontSize: 16,
    fontWeight: '700',
    color: RED,
    marginTop: 2,
    marginBottom: 2,
  },
  cardContent: {
    padding: 18,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  cardDetails: {
    fontSize: 15,
    color: DARK_TEXT,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTime: {
    fontSize: 13,
    color: DARK_GRAY,
  },
  earnings: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_GRAY,
  },
  earningsSuccess: {
    color: '#10B981',
  },
}); 