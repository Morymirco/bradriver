import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useOffers } from '../components/OffersContext';

const PRIMARY = '#E31837';
const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#fff';
const DARK_GRAY = '#353945';

const offerOrders = [
  {
    id: 'OFF-101',
    restaurant: 'Tacos City',
    details: '3x Tacos poulet',
    gain: '7.50 €',
    distance: '4.2 km',
  },
  {
    id: 'OFF-102',
    restaurant: 'Vegan Place',
    details: '2x Bowl quinoa',
    gain: '5.80 €',
    distance: '2.7 km',
  },
  {
    id: 'OFF-103',
    restaurant: 'Pizza Bella',
    details: '1x Margherita, 1x Coca',
    gain: '9.20 €',
    distance: '5.8 km',
  },
];

export const AvailableOffersScreen: React.FC = () => {
  const { acceptedOffers, acceptOffer } = useOffers();
  const availableOffers = offerOrders.filter(o => !acceptedOffers.some(a => a.id === o.id));

  // Pagination state
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Handler for horizontal scroll
  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const cardWidth = 260 + 16; // width + marginRight
    const index = Math.round(x / cardWidth);
    setCurrentIndex(index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSimple}>
        <Text style={styles.headerTitle}>Offres Disponibles</Text>
      </View>
      <ScrollView
        style={styles.offersList}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {availableOffers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="local-offer" size={64} color={DARK_GRAY} />
            <Text style={styles.emptyText}>Aucune offre disponible</Text>
          </View>
        ) : (
          availableOffers.map((offer) => (
            <View key={offer.id} style={styles.offerCardSimpleHorizontal}>
              <Text style={styles.restaurantName}>{offer.restaurant}</Text>
              <Text style={styles.details}>{offer.details}</Text>
              <View style={styles.rowInfo}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="euro" size={18} color={PRIMARY} />
                  <Text style={styles.gain}>{offer.gain}</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="place" size={18} color={DARK_GRAY} />
                  <Text style={styles.distance}>{offer.distance}</Text>
                </View>
                </View>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptOffer(offer)}>
                  <Text style={styles.acceptBtnText}>Accepter</Text>
              </TouchableOpacity>
            </View>
          ))
            )}
      </ScrollView>
      {/* Pagination Dots */}
      {availableOffers.length > 1 && (
        <View style={styles.paginationContainer}>
          {availableOffers.map((_, idx) => (
            <View
              key={idx}
              style={[styles.paginationDot, currentIndex === idx && styles.paginationDotActive]}
            />
          ))}
        </View>
      )}
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
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: DARK_GRAY,
    marginTop: 16,
    fontWeight: '600',
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
}); 