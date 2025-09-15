import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDriver } from '../hooks';
import { Business } from '../services/driverService';

// Couleurs du design system BraPrime
const PRIMARY = '#E31837';
const PRIMARY_LIGHT = '#FF4D6A';
const GRAY_100 = '#F3F4F6';
const GRAY_200 = '#E5E7EB';
const GRAY_300 = '#D1D5DB';
const GRAY_500 = '#6B7280';
const GRAY_700 = '#374151';
const WHITE = '#FFFFFF';
const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#fff';
const DARK_HEADER = '#23262F';
const DARK_GRAY = '#353945';

const BUSINESS_TYPE_ICONS = {
  restaurant: 'restaurant',
  pharmacy: 'local-pharmacy',
  grocery: 'shopping-cart',
  cafe: 'local-cafe',
  bakery: 'cake',
  other: 'business',
};

const BUSINESS_TYPE_COLORS = {
  restaurant: '#F59E0B',
  pharmacy: '#10B981',
  grocery: '#3B82F6',
  cafe: '#8B5CF6',
  bakery: '#EF4444',
  other: '#6B7280',
};

export const ServiceSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { businesses, assignToBusiness, loading } = useDriver();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [joining, setJoining] = useState(false);

  const handleJoinBusiness = async (business: Business) => {
    Alert.alert(
      'Rejoindre le Business',
      `Voulez-vous rejoindre ${business.name} ?\n\nVous ne verrez que les commandes de ce business.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejoindre',
          onPress: async () => {
            setJoining(true);
            try {
              const success = await assignToBusiness(business.id);
              if (success) {
                Alert.alert(
                  'Succès',
                  `Vous avez rejoint ${business.name} avec succès !`,
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              } else {
                Alert.alert('Erreur', 'Impossible de rejoindre le business');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue');
            } finally {
              setJoining(false);
            }
          },
        },
      ]
    );
  };

  const getBusinessIcon = (businessTypeName: string) => {
    const type = businessTypeName?.toLowerCase();
    return BUSINESS_TYPE_ICONS[type as keyof typeof BUSINESS_TYPE_ICONS] || 'business';
  };

  const getBusinessColor = (businessTypeName: string) => {
    const type = businessTypeName?.toLowerCase();
    return BUSINESS_TYPE_COLORS[type as keyof typeof BUSINESS_TYPE_COLORS] || '#6B7280';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Chargement des businesses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={DARK_TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choisir un Business</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <MaterialIcons name="info" size={24} color={PRIMARY} />
        <Text style={styles.descriptionText}>
          Rejoignez un business pour recevoir des commandes spécifiques. 
          Vous ne verrez que les commandes de ce business.
        </Text>
      </View>

      {/* Businesses List */}
      <ScrollView style={styles.businessesList} showsVerticalScrollIndicator={false}>
        {businesses.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="business" size={64} color={GRAY_500} />
            <Text style={styles.emptyStateText}>Aucun business disponible</Text>
            <Text style={styles.emptyStateSubtext}>
              Contactez l'administrateur pour ajouter des businesses
            </Text>
          </View>
        ) : (
          businesses.map((business) => (
            <TouchableOpacity
              key={business.id}
              style={[
                styles.businessCard,
                selectedBusiness?.id === business.id && styles.selectedBusinessCard,
              ]}
              onPress={() => setSelectedBusiness(business)}
            >
              <View style={styles.businessHeader}>
                <View
                  style={[
                    styles.businessIconContainer,
                    { backgroundColor: getBusinessColor(business.business_type_name || 'other') },
                  ]}
                >
                  <MaterialIcons
                    name={getBusinessIcon(business.business_type_name || 'other') as any}
                    size={24}
                    color={WHITE}
                  />
                </View>
                <View style={styles.businessInfo}>
                  <Text style={styles.businessName}>{business.name}</Text>
                  <Text style={styles.businessType}>
                    {business.business_type_name || 'Autre'}
                  </Text>
                  <Text style={styles.businessCategory}>
                    {business.category_name || 'Catégorie non définie'}
                  </Text>
                </View>
                {selectedBusiness?.id === business.id && (
                  <MaterialIcons name="check-circle" size={24} color={PRIMARY} />
                )}
              </View>

              <View style={styles.businessDetails}>
                <View style={styles.businessDetail}>
                  <MaterialIcons name="location-on" size={16} color={GRAY_500} />
                  <Text style={styles.businessDetailText}>{business.address}</Text>
                </View>
                {business.phone && (
                  <View style={styles.businessDetail}>
                    <MaterialIcons name="phone" size={16} color={GRAY_500} />
                    <Text style={styles.businessDetailText}>{business.phone}</Text>
                  </View>
                )}
                {business.email && (
                  <View style={styles.businessDetail}>
                    <MaterialIcons name="email" size={16} color={GRAY_500} />
                    <Text style={styles.businessDetailText}>{business.email}</Text>
                  </View>
                )}
                <View style={styles.businessStats}>
                  <View style={styles.businessStat}>
                    <MaterialIcons name="star" size={16} color="#F59E0B" />
                    <Text style={styles.businessStatText}>{business.rating.toFixed(1)}</Text>
                  </View>
                  <View style={styles.businessStat}>
                    <MaterialIcons name="access-time" size={16} color={GRAY_500} />
                    <Text style={styles.businessStatText}>{business.delivery_time}</Text>
                  </View>
                  <View style={styles.businessStat}>
                    <MaterialIcons name="local-shipping" size={16} color={GRAY_500} />
                    <Text style={styles.businessStatText}>{business.delivery_fee.toLocaleString('fr-FR')} GNF</Text>
                  </View>
                </View>
              </View>

              {selectedBusiness?.id === business.id && (
                <TouchableOpacity
                  style={[styles.joinButton, joining && styles.joinButtonDisabled]}
                  onPress={() => handleJoinBusiness(business)}
                  disabled={joining}
                >
                  {joining ? (
                    <ActivityIndicator size="small" color={WHITE} />
                  ) : (
                    <>
                      <MaterialIcons name="add" size={20} color={WHITE} />
                      <Text style={styles.joinButtonText}>Rejoindre ce Business</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <MaterialIcons name="lightbulb" size={20} color={PRIMARY} />
        <Text style={styles.bottomInfoText}>
          Vous pouvez changer de business à tout moment depuis votre profil
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: DARK_TEXT,
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: DARK_HEADER,
    borderBottomWidth: 1,
    borderBottomColor: DARK_GRAY,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  headerSpacer: {
    width: 40,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: DARK_CARD,
    margin: 16,
    borderRadius: 12,
  },
  descriptionText: {
    flex: 1,
    color: DARK_TEXT,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  businessesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    color: DARK_TEXT,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: GRAY_500,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  businessCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedBusinessCard: {
    borderColor: PRIMARY,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 4,
  },
  businessType: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '600',
    marginBottom: 2,
  },
  businessCategory: {
    fontSize: 12,
    color: GRAY_500,
  },
  businessDetails: {
    marginBottom: 16,
  },
  businessDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  businessDetailText: {
    color: DARK_TEXT,
    fontSize: 14,
    marginLeft: 8,
  },
  businessStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DARK_GRAY,
  },
  businessStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessStatText: {
    color: DARK_TEXT,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: DARK_CARD,
    margin: 16,
    borderRadius: 12,
  },
  bottomInfoText: {
    flex: 1,
    color: DARK_TEXT,
    fontSize: 14,
    marginLeft: 12,
  },
}); 