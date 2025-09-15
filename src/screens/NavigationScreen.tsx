import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { RootStackParamList } from '../navigation';
import { NavigationData, NavigationService } from '../services/navigationService';

const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#FFFFFF';
const RED = '#E31837';
const DARK_HEADER = '#23262F';
const DARK_GRAY = '#6B7280';
const LIGHT_GRAY = '#9CA3AF';



type NavigationProp = StackNavigationProp<RootStackParamList>;
type NavigationRouteProp = RouteProp<RootStackParamList, 'Navigation'>;

export const NavigationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<NavigationRouteProp>();
  const mapRef = useRef<MapView>(null);

  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [region, setRegion] = useState({
    latitude: 9.5370,
    longitude: -13.6785,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Récupérer l'ID de la commande depuis les paramètres de route ou utiliser une valeur par défaut
  const orderId = route.params?.orderId || 'default-order-id';

  // Charger les données de navigation
  useEffect(() => {
    loadNavigationData();
  }, [orderId]);

  const loadNavigationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: navError } = await NavigationService.getNavigationData(orderId);
      
      if (navError) {
        setError('Impossible de charger les données de navigation');
        console.error('Erreur navigation:', navError);
      } else if (data) {
        setNavigationData(data);
        
        // Calculer l'itinéraire pour la carte
        const routeInfo = await NavigationService.calculateRoute(
          data.pickupCoordinates,
          data.deliveryCoordinates
        );
        setRouteCoordinates(routeInfo.coordinates);
        
        // Ajuster la région de la carte pour inclure les deux points
        const newRegion = {
          latitude: (data.pickupCoordinates.latitude + data.deliveryCoordinates.latitude) / 2,
          longitude: (data.pickupCoordinates.longitude + data.deliveryCoordinates.longitude) / 2,
          latitudeDelta: Math.abs(data.pickupCoordinates.latitude - data.deliveryCoordinates.latitude) * 1.5,
          longitudeDelta: Math.abs(data.pickupCoordinates.longitude - data.deliveryCoordinates.longitude) * 1.5,
        };
        setRegion(newRegion);
        
        // Ajuster la carte pour afficher tous les points
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.fitToCoordinates([
              data.pickupCoordinates,
              data.deliveryCoordinates
            ], {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }
        }, 1000);
      }
    } catch (err) {
      setError('Erreur inattendue lors du chargement');
      console.error('Erreur inattendue:', err);
    } finally {
      setLoading(false);
    }
  };



  const handleStartNavigation = () => {
    if (navigationData) {
      navigation.navigate('GoogleMap', { orderId: navigationData.orderId });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={26} color={DARK_TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Navigation</Text>
                 <View style={styles.headerSpacer} />
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={RED} />
            <Text style={styles.loadingText}>Chargement de la navigation...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={64} color={RED} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadNavigationData}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : navigationData ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={region}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            showsScale={true}
            showsTraffic={true}
            mapType="standard"
            onRegionChangeComplete={setRegion}
          >
            {/* Marqueur du restaurant (point de départ) */}
            <Marker
              coordinate={navigationData.pickupCoordinates}
              title={navigationData.restaurantName}
              description="Point de retrait"
              pinColor="#10B981"
            >
              <View style={styles.restaurantMarker}>
                <MaterialIcons name="restaurant" size={24} color="#10B981" />
              </View>
            </Marker>

            {/* Marqueur du client (destination) */}
            <Marker
              coordinate={navigationData.deliveryCoordinates}
              title={navigationData.clientName}
              description="Adresse de livraison"
              pinColor={RED}
            >
              <View style={styles.clientMarker}>
                <MaterialIcons name="home" size={24} color={RED} />
              </View>
            </Marker>

            {/* Route entre les points */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={RED}
                strokeWidth={4}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <MaterialIcons name="map" size={64} color={LIGHT_GRAY} />
            <Text style={styles.mapPlaceholderText}>Aucune donnée</Text>
            <Text style={styles.mapPlaceholderSubtext}>Commande non trouvée</Text>
          </View>
        )}
      </View>

      {/* Navigation Info */}
      {navigationData && (
        <View style={styles.navigationInfo}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={20} color="#10B981" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Point de départ</Text>
                <Text style={styles.infoText}>
                  {navigationData.restaurantName}, {navigationData.pickupAddress}
                </Text>
              </View>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.infoRow}>
              <MaterialIcons name="home" size={20} color={RED} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Destination</Text>
                <Text style={styles.infoText}>{navigationData.deliveryAddress}</Text>
              </View>
            </View>
          </View>

          <View style={styles.routeStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {NavigationService.formatDistance(navigationData.estimatedDistance)}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {NavigationService.formatDuration(navigationData.estimatedDuration)}
              </Text>
              <Text style={styles.statLabel}>Temps estimé</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{navigationData.orderNumber}</Text>
              <Text style={styles.statLabel}>Commande</Text>
            </View>
          </View>

          {/* Informations client */}
          <View style={styles.clientInfo}>
            <View style={styles.clientHeader}>
              <MaterialIcons name="person" size={20} color={DARK_GRAY} />
              <Text style={styles.clientHeaderText}>Informations client</Text>
            </View>
            <View style={styles.clientDetails}>
              <Text style={styles.clientName}>{navigationData.clientName}</Text>
              {navigationData.clientPhone && (
                <TouchableOpacity style={styles.phoneButton}>
                  <MaterialIcons name="phone" size={16} color={RED} />
                  <Text style={styles.phoneText}>{navigationData.clientPhone}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {navigationData && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.mapButton} 
            onPress={handleStartNavigation}
            disabled={loading}
          >
            <MaterialIcons name="navigation" size={24} color={DARK_TEXT} />
                         <Text style={styles.mapButtonText}>
               Ouvrir la carte Google Maps
             </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('OrderDetail', { orderId: navigationData.orderId })}
          >
            <MaterialIcons name="receipt" size={20} color={RED} />
            <Text style={styles.secondaryButtonText}>Voir les détails</Text>
          </TouchableOpacity>
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
     headerSpacer: {
     width: 32,
     height: 32,
   },
  mapContainer: {
    flex: 1,
    backgroundColor: DARK_CARD,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  restaurantMarker: {
    backgroundColor: DARK_CARD,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  clientMarker: {
    backgroundColor: DARK_CARD,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: RED,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DARK_CARD,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK_TEXT,
    marginTop: 16,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: LIGHT_GRAY,
    marginTop: 4,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: DARK_TEXT,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: RED,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: DARK_TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  navigationInfo: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: LIGHT_GRAY,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    color: DARK_TEXT,
    fontWeight: '500',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: DARK_GRAY,
    marginLeft: 9,
    marginVertical: 4,
  },
  routeStats: {
    flexDirection: 'row',
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    padding: 16,
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
    color: LIGHT_GRAY,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: DARK_GRAY,
    marginHorizontal: 12,
  },
  clientInfo: {
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_GRAY,
    marginLeft: 8,
  },
  clientDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_TEXT,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_BG,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  phoneText: {
    fontSize: 14,
    color: RED,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 8,
  },
  mapButtonText: {
    color: DARK_TEXT,
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: RED,
  },
  secondaryButtonText: {
    color: RED,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  
}); 