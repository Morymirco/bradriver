import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { CameraComponent } from '../components/CameraComponent';
import { RootStackParamList } from '../navigation';
import { NavigationData, NavigationService } from '../services/navigationService';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type GoogleMapRouteProp = RouteProp<RootStackParamList, 'GoogleMap'>;

const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#FFFFFF';
const RED = '#E31837';
const DARK_HEADER = '#23262F';
const DARK_GRAY = '#6B7280';
const LIGHT_GRAY = '#9CA3AF';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export const GoogleMapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GoogleMapRouteProp>();
  const mapRef = useRef<MapView>(null);
  
  // États pour les données dynamiques
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour la navigation
  const [region, setRegion] = useState({
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
  });
  const [isNavigating, setIsNavigating] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [driverPosition, setDriverPosition] = useState({
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [currentStep, setCurrentStep] = useState<'idle' | 'navigating' | 'arrived' | 'delivered'>('idle');
  const [progress, setProgress] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  
  // États pour la géolocalisation en temps réel
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [navigationPhase, setNavigationPhase] = useState<'to_pickup' | 'to_delivery'>('to_pickup');
  const [currentRouteToPickup, setCurrentRouteToPickup] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [currentRouteToDelivery, setCurrentRouteToDelivery] = useState<Array<{ latitude: number; longitude: number }>>([]);

  // Récupérer l'ID de la commande depuis les paramètres de route
  const orderId = route.params?.orderId || 'default-order-id';

  // Charger les données de navigation
  useEffect(() => {
    loadNavigationData();
    requestLocationPermission();
  }, [orderId]);

  // Demander la permission de localisation
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        startLocationTracking();
      } else {
        Alert.alert(
          'Permission refusée',
          'La permission de localisation est nécessaire pour la navigation en temps réel.'
        );
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
    }
  };

  // Démarrer le suivi de localisation en temps réel
  const startLocationTracking = async () => {
    try {
      console.log('🚀 Démarrage du suivi de localisation...');
      
      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // Accepter une position jusqu'à 10 secondes
        timeout: 15000, // Timeout de 15 secondes
      });
      
      console.log('📍 Position actuelle obtenue:', {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy
      });
      
      setCurrentLocation(location);
          setDriverPosition({ 
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
            latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Démarrer le suivi en temps réel
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // Mise à jour toutes les 2 secondes
          distanceInterval: 5, // Mise à jour tous les 5 mètres
        },
        (location) => {
          console.log('🔄 Mise à jour position:', {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            accuracy: location.coords.accuracy
          });
          setCurrentLocation(location);
          updateDriverPosition(location.coords);
        }
      );
      setLocationSubscription(subscription);
      console.log('✅ Suivi de localisation démarré');
    } catch (error) {
      console.error('❌ Erreur lors du suivi de localisation:', error);
    }
  };

  // Mettre à jour la position du driver
  const updateDriverPosition = (coords: Location.LocationObjectCoords) => {
    console.log('🎯 Mise à jour position driver:', {
      lat: coords.latitude,
      lng: coords.longitude
    });
    
    setDriverPosition({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    // Si on est en navigation, calculer la progression
    if (currentStep === 'navigating' && navigationData) {
      calculateNavigationProgress(coords);
    }
  };

  // Calculer la progression de navigation
  const calculateNavigationProgress = (coords: Location.LocationObjectCoords) => {
    if (!navigationData) return;

    let targetCoordinates: { latitude: number; longitude: number };
    let currentRoute: Array<{ latitude: number; longitude: number }>;

    if (navigationPhase === 'to_pickup') {
      targetCoordinates = navigationData.pickupCoordinates;
      currentRoute = currentRouteToPickup;
    } else {
      targetCoordinates = navigationData.deliveryCoordinates;
      currentRoute = currentRouteToDelivery;
    }

    // Calculer la distance jusqu'à la destination
    const distanceToTarget = calculateDistance(
      coords.latitude,
      coords.longitude,
      targetCoordinates.latitude,
      targetCoordinates.longitude
    );

    // Si on est proche de la destination (moins de 50 mètres)
    if (distanceToTarget < 0.05) {
      if (navigationPhase === 'to_pickup') {
        setNavigationPhase('to_delivery');
        setProgress(0);
        // Calculer l'itinéraire vers la livraison
        calculateRouteToDelivery();
      } else {
        setCurrentStep('arrived');
        setProgress(1);
      }
    } else {
      // Calculer la progression basée sur la distance
      const totalDistance = navigationPhase === 'to_pickup' 
        ? calculateDistance(
            currentLocation?.coords.latitude || 0,
            currentLocation?.coords.longitude || 0,
            navigationData.pickupCoordinates.latitude,
            navigationData.pickupCoordinates.longitude
          )
        : calculateDistance(
            navigationData.pickupCoordinates.latitude,
            navigationData.pickupCoordinates.longitude,
            navigationData.deliveryCoordinates.latitude,
            navigationData.deliveryCoordinates.longitude
          );

      const newProgress = Math.max(0, Math.min(1, 1 - (distanceToTarget / totalDistance)));
      setProgress(newProgress);
    }
  };

  // Calculer la distance entre deux points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculer l'itinéraire vers le point de retrait
  const calculateRouteToPickup = async () => {
    if (!currentLocation || !navigationData) return;

    try {
      const routeInfo = await NavigationService.calculateRoute(
        { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude },
        navigationData.pickupCoordinates
      );
      setCurrentRouteToPickup(routeInfo.coordinates);
    } catch (error) {
      console.error('Erreur lors du calcul de l\'itinéraire vers le point de retrait:', error);
    }
  };

  // Calculer l'itinéraire vers la livraison
  const calculateRouteToDelivery = async () => {
    if (!navigationData) return;

    try {
      const routeInfo = await NavigationService.calculateRoute(
        navigationData.pickupCoordinates,
        navigationData.deliveryCoordinates
      );
      setCurrentRouteToDelivery(routeInfo.coordinates);
      setRouteCoordinates(routeInfo.coordinates);
    } catch (error) {
      console.error('Erreur lors du calcul de l\'itinéraire vers la livraison:', error);
    }
  };

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
        
        // Mettre à jour les coordonnées de la région (centre de la carte)
        setRegion({
          latitude: data.pickupCoordinates.latitude,
          longitude: data.pickupCoordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        
        // Ne pas initialiser la position du driver ici - elle sera mise à jour par le GPS
        // setDriverPosition sera mis à jour par startLocationTracking

        // Calculer l'itinéraire vers le point de retrait si on a la position actuelle
        if (currentLocation) {
          await calculateRouteToPickup();
        }
        
        // Calculer l'itinéraire vers la livraison
        const routeInfo = await NavigationService.calculateRoute(
          data.pickupCoordinates,
          data.deliveryCoordinates
        );
        setRouteCoordinates(routeInfo.coordinates);
        setCurrentRouteToDelivery(routeInfo.coordinates);
        
        // Ajuster la carte à l'itinéraire
        fitMapToRoute(data.pickupCoordinates, data.deliveryCoordinates);
      }
    } catch (err) {
      setError('Erreur inattendue lors du chargement');
      console.error('Erreur inattendue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigationData) {
      fitMapToRoute(navigationData.pickupCoordinates, navigationData.deliveryCoordinates);
    }
  }, [navigationData]);

  // Nettoyer la subscription de localisation
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationSubscription]);

  // Recalculer l'itinéraire vers le point de retrait quand la position change
  useEffect(() => {
    if (currentLocation && navigationData && currentStep === 'navigating' && navigationPhase === 'to_pickup') {
      calculateRouteToPickup();
    }
  }, [currentLocation, navigationData, currentStep, navigationPhase]);

  // Ajuster la carte quand la position du driver change
  useEffect(() => {
    if (currentLocation && navigationData) {
      // Ajuster la carte pour inclure la position actuelle et les points de destination
      const coordinates = [
        { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude },
        navigationData.pickupCoordinates,
        navigationData.deliveryCoordinates
      ];
      
    if (mapRef.current) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      }
    }
  }, [currentLocation, navigationData]);



  const fitMapToRoute = (origin?: { latitude: number; longitude: number }, destination?: { latitude: number; longitude: number }) => {
    if (mapRef.current && origin && destination) {
      mapRef.current.fitToCoordinates([origin, destination], {
        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
        animated: true,
      });
    }
  };

  // Forcer la mise à jour de la position GPS
  const refreshLocation = async () => {
    try {
      console.log('🔄 Actualisation de la position GPS...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 0, // Forcer une nouvelle position
        timeout: 10000,
      });
      
      console.log('📍 Nouvelle position obtenue:', {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy
      });
      
      setCurrentLocation(location);
      updateDriverPosition(location.coords);
    } catch (error) {
      console.error('❌ Erreur lors de l\'actualisation:', error);
      Alert.alert('Erreur', 'Impossible de récupérer votre position actuelle.');
    }
  };

  const startNavigation = async () => {
    if (!currentLocation) {
      Alert.alert('Erreur', 'Impossible de récupérer votre position actuelle.');
      return;
    }

    setIsNavigating(true);
    setCurrentStep('navigating');
    setProgress(0);
    setNavigationPhase('to_pickup');

    // Calculer l'itinéraire vers le point de retrait
    await calculateRouteToPickup();

    Alert.alert('Navigation démarrée', 'Vous êtes maintenant en route vers le point de retrait.');
  };

  const finishDelivery = () => {
    setCurrentStep('delivered');
    setIsDelivered(true);
    Alert.alert('Livraison terminée', 'Vous êtes arrivé chez le client.');
  };

  const takePhoto = () => {
    setShowCamera(true);
  };

  const handlePhotoTaken = (uri: string) => {
    setPhotoUri(uri);
    setShowCamera(false);
    setShowPhotoModal(true);
  };

  const confirmDelivery = () => {
    setShowPhotoModal(false);
    Alert.alert(
      'Livraison confirmée',
      'La photo a été prise et la livraison est confirmée.',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home' as never)
        }
      ]
    );
  };

  const getButtonText = () => {
    switch (currentStep) {
      case 'idle':
        return 'Démarrer la navigation';
      case 'navigating':
        return navigationPhase === 'to_pickup' 
          ? `Vers le point de retrait... ${Math.round(progress * 100)}%`
          : `Vers le client... ${Math.round(progress * 100)}%`;
      case 'arrived':
        return 'Terminer la livraison';
      case 'delivered':
        return 'Prendre photo';
      default:
        return 'Démarrer la navigation';
    }
  };

  const getButtonIcon = () => {
    switch (currentStep) {
      case 'idle':
        return 'navigation';
      case 'navigating':
        return 'directions-car';
      case 'arrived':
        return 'check-circle';
      case 'delivered':
        return 'camera-alt';
      default:
        return 'navigation';
    }
  };

  const getButtonAction = () => {
    switch (currentStep) {
      case 'idle':
        return startNavigation;
      case 'navigating':
        return () => {};
      case 'arrived':
        return finishDelivery;
      case 'delivered':
        return takePhoto;
      default:
        return startNavigation;
    }
  };

  const getButtonStyle = () => {
    switch (currentStep) {
      case 'idle':
        return styles.actionBtn;
      case 'navigating':
        return [styles.actionBtn, styles.actionBtnNavigating];
      case 'arrived':
        return [styles.actionBtn, styles.actionBtnArrived];
      case 'delivered':
        return [styles.actionBtn, styles.actionBtnDelivered];
      default:
        return styles.actionBtn;
    }
  };

  if (showCamera) {
    return (
      <CameraComponent
        onPhotoTaken={handlePhotoTaken}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={26} color={DARK_TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carte Google Maps</Text>
                 <TouchableOpacity style={styles.fitBtn} onPress={() => {
           if (currentLocation && navigationData) {
             const coordinates = [
               { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude },
               navigationData.pickupCoordinates,
               navigationData.deliveryCoordinates
             ];
             mapRef.current?.fitToCoordinates(coordinates, {
               edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
               animated: true,
             });
           }
         }}>
          <MaterialIcons name="my-location" size={24} color={DARK_TEXT} />
        </TouchableOpacity>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
         {loading ? (
           <View style={styles.loadingContainer}>
             <ActivityIndicator size="large" color={RED} />
             <Text style={styles.loadingText}>Chargement de la carte...</Text>
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
          {/* Marqueur du restaurant */}
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

          {/* Marqueur du client */}
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

          {/* Marqueur du livreur en mouvement */}
           {currentLocation && (
          <Marker
            coordinate={driverPosition}
            title="Votre position"
               description="Position actuelle"
          >
            <View style={styles.driverMarker}>
              <MaterialIcons name="directions-car" size={24} color={DARK_TEXT} />
            </View>
          </Marker>
           )}

          {/* Route vers le point de retrait */}
          {currentStep === 'navigating' && navigationPhase === 'to_pickup' && currentRouteToPickup.length > 0 && (
          <Polyline
              coordinates={currentRouteToPickup}
              strokeColor="#10B981"
              strokeWidth={4}
            />
          )}

          {/* Route vers la livraison */}
          {(currentStep === 'navigating' && navigationPhase === 'to_delivery') || currentStep === 'idle' ? (
            routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
            strokeColor={RED}
            strokeWidth={4}
          />
            )
          ) : null}
        </MapView>
       ) : (
         <View style={styles.loadingContainer}>
           <MaterialIcons name="map" size={64} color={LIGHT_GRAY} />
           <Text style={styles.loadingText}>Aucune donnée de navigation</Text>
         </View>
       )}
      </View>

      {/* Navigation Info Panel */}
                {navigationData && (
      <View style={styles.infoPanel}>
             <>
        <View style={styles.routeInfo}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, styles.restaurantDot]} />
            <View style={styles.routeText}>
              <Text style={styles.routeLabel}>Départ</Text>
                  <Text style={styles.routeAddress}>
                    {navigationData.restaurantName}, {navigationData.pickupAddress}
                  </Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routePoint}>
            <View style={[styles.routeDot, styles.clientDot]} />
            <View style={styles.routeText}>
              <Text style={styles.routeLabel}>Destination</Text>
                  <Text style={styles.routeAddress}>{navigationData.deliveryAddress}</Text>
            </View>
          </View>
            </View>

                         {/* Position actuelle */}
             <View style={styles.currentLocationContainer}>
               {currentLocation ? (
                 <>
                   <MaterialIcons name="my-location" size={16} color="#10B981" />
                   <Text style={styles.currentLocationText}>
                     GPS actif: {currentLocation.coords.latitude.toFixed(4)}, {currentLocation.coords.longitude.toFixed(4)}
                   </Text>
                   <TouchableOpacity onPress={refreshLocation} style={styles.refreshButton}>
                     <MaterialIcons name="refresh" size={16} color={RED} />
                   </TouchableOpacity>
                 </>
               ) : (
                 <>
                   <MaterialIcons name="location-off" size={16} color={LIGHT_GRAY} />
                   <Text style={styles.currentLocationText}>
                     En attente du GPS...
                   </Text>
                   <TouchableOpacity onPress={refreshLocation} style={styles.refreshButton}>
                     <MaterialIcons name="refresh" size={16} color={RED} />
                   </TouchableOpacity>
                 </>
               )}
        </View>

        {/* Route Stats */}
        <View style={styles.routeStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="straighten" size={20} color={RED} />
                <Text style={styles.statValue}>
                  {NavigationService.formatDistance(navigationData.estimatedDistance)}
                </Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="access-time" size={20} color={RED} />
            <Text style={styles.statValue}>
                  {currentStep === 'navigating' 
                    ? `${Math.round((1 - progress) * navigationData.estimatedDuration)} min` 
                    : `${navigationData.estimatedDuration} min`
                  }
            </Text>
                <Text style={styles.statLabel}>
                  {currentStep === 'navigating' && navigationPhase === 'to_pickup' 
                    ? 'Temps vers retrait' 
                    : currentStep === 'navigating' && navigationPhase === 'to_delivery'
                    ? 'Temps vers livraison'
                    : 'Temps estimé'
                  }
                </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="receipt" size={20} color={RED} />
                <Text style={styles.statValue}>{navigationData.orderNumber}</Text>
            <Text style={styles.statLabel}>Commande</Text>
          </View>
        </View>
          </>

          {/* Indicateur de phase de navigation */}
        {currentStep === 'navigating' && (
            <View style={styles.navigationPhaseContainer}>
              <View style={styles.phaseIndicator}>
                <MaterialIcons 
                  name={navigationPhase === 'to_pickup' ? 'restaurant' : 'home'} 
                  size={16} 
                  color={navigationPhase === 'to_pickup' ? '#10B981' : RED} 
                />
                <Text style={styles.phaseText}>
                  {navigationPhase === 'to_pickup' ? 'En route vers le point de retrait' : 'En route vers le client'}
                </Text>
              </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}% complété</Text>
          </View>
        )}
      </View>
      )}

      {/* Action Buttons */}
      {navigationData && (
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={getButtonStyle()} 
          onPress={getButtonAction()}
          disabled={currentStep === 'navigating'}
        >
          <MaterialIcons name={getButtonIcon() as any} size={24} color={DARK_TEXT} />
          <Text style={styles.actionBtnText}>{getButtonText()}</Text>
        </TouchableOpacity>
        
        {navigationData && (
        <TouchableOpacity 
          style={styles.secondaryBtn}
            onPress={() => navigation.navigate('OrderDetail', { orderId: navigationData.orderId })}
        >
          <MaterialIcons name="receipt" size={20} color={RED} />
          <Text style={styles.secondaryBtnText}>Détails de la commande</Text>
        </TouchableOpacity>
        )}
      </View>
      )}

      {/* Modal pour prendre la photo */}
      <Modal
        visible={showPhotoModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <Text style={styles.modalTitle}>Confirmer la livraison</Text>
            <Text style={styles.modalSubtitle}>Photo prise pour confirmer la livraison</Text>
            
            {photoUri ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photoUri }} style={styles.photoImage} />
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialIcons name="camera-alt" size={64} color={LIGHT_GRAY} />
                <Text style={styles.photoText}>Photo</Text>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalBtnSecondary}
                onPress={() => setShowPhotoModal(false)}
              >
                <MaterialIcons name="close" size={20} color={DARK_TEXT} />
                <Text style={styles.modalBtnTextSecondary}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalBtnPrimary}
                onPress={confirmDelivery}
              >
                <MaterialIcons name="check" size={20} color={DARK_TEXT} />
                <Text style={styles.modalBtnTextPrimary}>Confirmer</Text>
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
  fitBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: DARK_CARD,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
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
    backgroundColor: DARK_CARD,
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
  driverMarker: {
    backgroundColor: RED,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: DARK_TEXT,
  },
  infoPanel: {
    backgroundColor: DARK_CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 },
    elevation: 10,
  },
  routeInfo: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  restaurantDot: {
    backgroundColor: '#10B981',
  },
  clientDot: {
    backgroundColor: RED,
  },
  routeText: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: LIGHT_GRAY,
    fontWeight: '600',
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 14,
    color: DARK_TEXT,
    fontWeight: '500',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: DARK_GRAY,
    marginLeft: 5,
    marginVertical: 4,
  },
  routeStats: {
    flexDirection: 'row',
    backgroundColor: DARK_HEADER,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_TEXT,
    marginTop: 4,
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
  navigationPhaseContainer: {
    marginTop: 12,
    backgroundColor: DARK_HEADER,
    borderRadius: 12,
    padding: 16,
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseText: {
    fontSize: 14,
    color: DARK_TEXT,
    fontWeight: '600',
    marginLeft: 8,
  },
  currentLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_HEADER,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  currentLocationText: {
    fontSize: 12,
    color: LIGHT_GRAY,
    marginLeft: 6,
    flex: 1,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: DARK_BG,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: DARK_GRAY,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: RED,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: LIGHT_GRAY,
    textAlign: 'center',
    marginTop: 4,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 8,
  },
  actionBtnNavigating: {
    backgroundColor: '#F59E0B',
  },
  actionBtnArrived: {
    backgroundColor: '#10B981',
  },
  actionBtnDelivered: {
    backgroundColor: '#3B82F6',
  },
  actionBtnText: {
    color: DARK_TEXT,
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: RED,
  },
  secondaryBtnText: {
    color: RED,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DARK_CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: DARK_GRAY,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: LIGHT_GRAY,
    marginBottom: 24,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoImage: {
    width: 250,
    height: 250,
    borderRadius: 12,
    backgroundColor: DARK_HEADER,
  },
  photoPlaceholder: {
    alignItems: 'center',
    backgroundColor: DARK_HEADER,
    borderRadius: 12,
    padding: 40,
    marginBottom: 24,
  },
  photoText: {
    fontSize: 16,
    color: LIGHT_GRAY,
    marginTop: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: DARK_HEADER,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DARK_GRAY,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalBtnTextSecondary: {
    color: DARK_TEXT,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 6,
  },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalBtnTextPrimary: {
    color: DARK_TEXT,
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 6,
  },
}); 