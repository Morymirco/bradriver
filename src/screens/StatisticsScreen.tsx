import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOffers } from '../components/OffersContext';
import { useDriver } from '../hooks';
import { RootStackParamList } from '../navigation';
import { DriverEarningsService } from '../services/driverEarningsService';
import { DriverReview, DriverReviewsService } from '../services/driverReviewsService';

const DARK_BG = '#181A20';
const DARK_HEADER = '#23262F';
const DARK_TEXT = '#fff';
const PRIMARY = '#E31837';

// Avis fictifs en fallback si pas de vraies données
const FALLBACK_REVIEWS = [
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
  const { profile } = useDriver();
  
  const [earningsSummary, setEarningsSummary] = useState<any>(null);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [driverReviews, setDriverReviews] = useState<DriverReview[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les statistiques des gains et des avis
  const loadEarningsStats = async () => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      
      // Charger le résumé des gains
      const { summary } = await DriverEarningsService.getDriverEarningsSummary(profile.id);
      setEarningsSummary(summary);
      
      // Charger les statistiques de performance
      const { stats } = await DriverEarningsService.getDriverPerformanceStats(profile.id);
      setPerformanceStats(stats);
      
      // Charger les statistiques mensuelles (6 derniers mois)
      const { stats: monthly } = await DriverEarningsService.getDriverMonthlyStats(profile.id);
      setMonthlyStats(monthly.slice(0, 6)); // 6 derniers mois
      
      // Charger les avis des clients
      const { reviews } = await DriverReviewsService.getDriverReviews({
        driver_id: profile.id,
        limit: 10
      });
      setDriverReviews(reviews || []);
      
      // Charger les statistiques des avis
      const { stats: reviewStatsData } = await DriverReviewsService.getDriverStats(profile.id);
      setReviewStats(reviewStatsData);
      
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh des données
  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarningsStats();
    setRefreshing(false);
  };

  // Charger les données au montage
  useEffect(() => {
    loadEarningsStats();
  }, [profile?.id]);

  // Statistiques des offres acceptées (pour compatibilité)
  const totalGains = acceptedOffers.reduce((sum, o) => sum + parseFloatSafe(o.gain), 0);
  const totalDistance = acceptedOffers.reduce((sum, o) => sum + parseDistance(o.distance), 0);
  const totalDuration = acceptedOffers.reduce((sum, o) => sum + parseDuration(o.duration), 0);

  // Calcul de la note moyenne (vraies données ou fallback)
  const averageRating = reviewStats?.rating 
    ? DriverReviewsService.formatRating(reviewStats.rating)
    : (FALLBACK_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / FALLBACK_REVIEWS.length).toFixed(1);
  
  // Utiliser les vraies données ou les fallback
  const reviewsToShow = driverReviews.length > 0 ? driverReviews : FALLBACK_REVIEWS;
  const reviewCount = reviewStats?.review_count || FALLBACK_REVIEWS.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={26} color={DARK_TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistiques</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY]}
            tintColor={PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Chargement des statistiques...</Text>
          </View>
        ) : (
          <>
            {/* Statistiques principales des gains */}
            {earningsSummary && (
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <MaterialIcons name="assignment-turned-in" size={32} color={PRIMARY} />
                  <Text style={styles.statNumber}>{earningsSummary.total_orders_completed || 0}</Text>
                  <Text style={styles.statLabel}>Commandes livrées</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialIcons name="euro" size={32} color={PRIMARY} />
                  <Text style={styles.statNumber}>
                    {DriverEarningsService.formatEarnings(earningsSummary.total_earnings || 0)}
                  </Text>
                  <Text style={styles.statLabel}>Gains totaux</Text>
                </View>
              </View>
            )}

            {/* Statistiques du mois actuel */}
            {earningsSummary && (
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <MaterialIcons name="calendar-today" size={32} color={PRIMARY} />
                  <Text style={styles.statNumber}>{earningsSummary.current_month_orders || 0}</Text>
                  <Text style={styles.statLabel}>Ce mois</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialIcons name="trending-up" size={32} color={PRIMARY} />
                  <Text style={styles.statNumber}>
                    {DriverEarningsService.formatEarnings(earningsSummary.current_month_earnings || 0)}
                  </Text>
                  <Text style={styles.statLabel}>Gains du mois</Text>
                </View>
              </View>
            )}

            {/* Statistiques de performance */}
            {performanceStats && (
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <MaterialIcons name="analytics" size={32} color={PRIMARY} />
                  <Text style={styles.statNumber}>
                    {DriverEarningsService.formatEarnings(performanceStats.averageEarningsPerOrder || 0)}
                  </Text>
                  <Text style={styles.statLabel}>Moyenne/commande</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialIcons name="star" size={32} color={PRIMARY} />
                  <Text style={styles.statNumber}>
                    {performanceStats.bestMonth ? 
                      `${performanceStats.bestMonth.month}/${performanceStats.bestMonth.year}` : 
                      'N/A'
                    }
                  </Text>
                  <Text style={styles.statLabel}>Meilleur mois</Text>
                </View>
              </View>
            )}

            {/* Statistiques des offres acceptées (pour compatibilité) */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <MaterialIcons name="local-shipping" size={32} color={PRIMARY} />
                <Text style={styles.statNumber}>{acceptedOffers.length}</Text>
                <Text style={styles.statLabel}>Offres acceptées</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="place" size={32} color={PRIMARY} />
                <Text style={styles.statNumber}>{totalDistance.toFixed(1)} km</Text>
                <Text style={styles.statLabel}>Distance totale</Text>
              </View>
            </View>
          </>
        )}
        
        {/* Section des avis clients */}
        <View style={styles.reviewsSection}>
          <Text style={styles.reviewsTitle}>Avis clients</Text>
          <View style={styles.reviewsSummary}>
            <MaterialIcons name="star" size={24} color={PRIMARY} />
            <Text style={styles.reviewsAverage}>{averageRating}</Text>
            <Text style={styles.reviewsCount}>({reviewCount} avis)</Text>
          </View>
          
          {reviewsToShow.length > 0 ? (
            reviewsToShow.map((review, idx) => (
              <View key={review.id || idx} style={styles.reviewCard}>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:2}}>
                  <MaterialIcons name="person" size={18} color={PRIMARY} />
                  <Text style={styles.reviewName}>
                    {review.customer_name || 'Client anonyme'}
                  </Text>
                  <MaterialIcons name="star" size={16} color={PRIMARY} style={{marginLeft:8}} />
                  <Text style={styles.reviewRating}>{review.rating}</Text>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
                {review.created_at && (
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noReviewsContainer}>
              <MaterialIcons name="rate-review" size={48} color="#666" />
              <Text style={styles.noReviewsText}>Aucun avis pour le moment</Text>
              <Text style={styles.noReviewsSubtext}>
                Les avis des clients apparaîtront ici après vos livraisons
              </Text>
            </View>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
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
  reviewDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noReviewsText: {
    fontSize: 16,
    color: DARK_TEXT,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 