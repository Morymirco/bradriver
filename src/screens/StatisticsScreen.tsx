import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useOffers } from '../components/OffersContext';

const DARK_BG = '#181A20';
const DARK_HEADER = '#23262F';
const DARK_TEXT = '#fff';
const PRIMARY = '#E31837';

const FAKE_REVIEWS = [
  { name: 'Marie D.', rating: 5, comment: 'Livraison rapide et très sympa !' },
  { name: 'Jean M.', rating: 4, comment: 'Ponctuel et professionnel.' },
  { name: 'Sophie L.', rating: 5, comment: 'Service parfait, merci !' },
];

function parseFloatSafe(val: string) {
  const n = parseFloat(val.replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function parseDistance(val: string) {
  // "4.2 km" => 4.2
  return parseFloatSafe(val);
}

function parseDuration(val: string) {
  // "18 min" => 18
  return parseFloatSafe(val);
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const StatisticsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { acceptedOffers } = useOffers();

  const totalGains = acceptedOffers.reduce((sum, o) => sum + parseFloatSafe(o.gain), 0);
  const totalDistance = acceptedOffers.reduce((sum, o) => sum + parseDistance(o.distance), 0);
  const totalDuration = acceptedOffers.reduce((sum, o) => sum + parseDuration(o.duration), 0);

  // Calcul de la note moyenne fictive
  const averageRating = (FAKE_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / FAKE_REVIEWS.length).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={26} color={DARK_TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistiques</Text>
      </View>
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <MaterialIcons name="assignment-turned-in" size={32} color={PRIMARY} />
          <Text style={styles.statNumber}>{acceptedOffers.length}</Text>
          <Text style={styles.statLabel}>Offres acceptées</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialIcons name="euro" size={32} color={PRIMARY} />
          <Text style={styles.statNumber}>{totalGains.toLocaleString('fr-FR')} GNF</Text>
          <Text style={styles.statLabel}>Gains totaux</Text>
        </View>
      </View>
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <MaterialIcons name="place" size={32} color={PRIMARY} />
          <Text style={styles.statNumber}>{totalDistance.toFixed(1)} km</Text>
          <Text style={styles.statLabel}>Distance totale</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialIcons name="timer" size={32} color={PRIMARY} />
          <Text style={styles.statNumber}>{totalDuration} min</Text>
          <Text style={styles.statLabel}>Durée totale</Text>
        </View>
      </View>
      <View style={styles.reviewsSection}>
        <Text style={styles.reviewsTitle}>Avis clients</Text>
        <View style={styles.reviewsSummary}>
          <MaterialIcons name="star" size={24} color={PRIMARY} />
          <Text style={styles.reviewsAverage}>{averageRating}</Text>
          <Text style={styles.reviewsCount}>({FAKE_REVIEWS.length} avis)</Text>
        </View>
        {FAKE_REVIEWS.map((r, idx) => (
          <View key={idx} style={styles.reviewCard}>
            <View style={{flexDirection:'row', alignItems:'center', marginBottom:2}}>
              <MaterialIcons name="person" size={18} color={PRIMARY} />
              <Text style={styles.reviewName}>{r.name}</Text>
              <MaterialIcons name="star" size={16} color={PRIMARY} style={{marginLeft:8}} />
              <Text style={styles.reviewRating}>{r.rating}</Text>
            </View>
            <Text style={styles.reviewComment}>{r.comment}</Text>
          </View>
        ))}
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: DARK_HEADER,
  },
  backBtn: {
    marginRight: 12,
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PRIMARY,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: DARK_HEADER,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: DARK_TEXT,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#353945',
    marginHorizontal: 20,
    height: 60,
  },
  reviewsSection: {
    marginTop: 32,
    marginHorizontal: 16,
    padding: 18,
    backgroundColor: DARK_HEADER,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 8,
  },
  reviewsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewsAverage: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY,
    marginLeft: 6,
  },
  reviewsCount: {
    fontSize: 14,
    color: DARK_TEXT,
    marginLeft: 8,
  },
  reviewCard: {
    backgroundColor: DARK_BG,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  reviewName: {
    fontSize: 14,
    color: DARK_TEXT,
    fontWeight: '600',
    marginLeft: 6,
  },
  reviewRating: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '700',
    marginLeft: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: DARK_TEXT,
    marginTop: 2,
  },
}); 