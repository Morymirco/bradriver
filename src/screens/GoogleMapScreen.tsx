import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, Alert, Modal, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { CameraComponent } from '../components/CameraComponent';
import { RootStackParamList } from '../navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#FFFFFF';
const RED = '#E31837';
const DARK_HEADER = '#23262F';
const DARK_GRAY = '#6B7280';
const LIGHT_GRAY = '#9CA3AF';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Coordonnées d'exemple (Paris)
const RESTAURANT_COORDS = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const CLIENT_COORDS = {
  latitude: 48.8584,
  longitude: 2.2945,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// Route entre les deux points
const ROUTE_COORDS = [
  { latitude: 48.8566, longitude: 2.3522 }, // Restaurant
  { latitude: 48.8575, longitude: 2.3233 }, // Point intermédiaire
  { latitude: 48.8584, longitude: 2.2945 }, // Client
];

export const GoogleMapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState(RESTAURANT_COORDS);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [driverPosition, setDriverPosition] = useState(RESTAURANT_COORDS);
  const [currentStep, setCurrentStep] = useState<'idle' | 'navigating' | 'arrived' | 'delivered'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fitMapToRoute();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentStep === 'navigating') {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 0.02;
          if (newProgress >= 1) {
            setCurrentStep('arrived');
            setDriverPosition(CLIENT_COORDS);
            return 1;
          }
          
          const currentIndex = Math.floor(newProgress * (ROUTE_COORDS.length - 1));
          const nextIndex = Math.min(currentIndex + 1, ROUTE_COORDS.length - 1);
          const segmentProgress = (newProgress * (ROUTE_COORDS.length - 1)) - currentIndex;
          
          const currentCoord = ROUTE_COORDS[currentIndex];
          const nextCoord = ROUTE_COORDS[nextIndex];
          
          const newLat = currentCoord.latitude + (nextCoord.latitude - currentCoord.latitude) * segmentProgress;
          const newLng = currentCoord.longitude + (nextCoord.longitude - currentCoord.longitude) * segmentProgress;
          
          setDriverPosition({ 
            latitude: newLat, 
            longitude: newLng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
          });
          return newProgress;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStep]);

  const fitMapToRoute = () => {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(ROUTE_COORDS, {
        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
        animated: true,
      });
    }
  };

  const startNavigation = () => {
    setIsNavigating(true);
    setCurrentStep('navigating');
    setProgress(0);
    Alert.alert('Navigation démarrée', 'Vous êtes maintenant en route vers le client.');
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
        return `En route... ${Math.round(progress * 100)}%`;
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
        <TouchableOpacity style={styles.fitBtn} onPress={fitMapToRoute}>
          <MaterialIcons name="my-location" size={24} color={DARK_TEXT} />
        </TouchableOpacity>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
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
            coordinate={RESTAURANT_COORDS}
            title="Pizza Bella"
            description="Point de retrait"
            pinColor="#10B981"
          >
            <View style={styles.restaurantMarker}>
              <MaterialIcons name="restaurant" size={24} color="#10B981" />
            </View>
          </Marker>

          {/* Marqueur du client */}
          <Marker
            coordinate={CLIENT_COORDS}
            title="Marie Dupont"
            description="Adresse de livraison"
            pinColor={RED}
          >
            <View style={styles.clientMarker}>
              <MaterialIcons name="home" size={24} color={RED} />
            </View>
          </Marker>

          {/* Marqueur du chauffeur en mouvement */}
          <Marker
            coordinate={driverPosition}
            title="Votre position"
            description="En route vers le client"
          >
            <View style={styles.driverMarker}>
              <MaterialIcons name="directions-car" size={24} color={DARK_TEXT} />
            </View>
          </Marker>

          {/* Route entre les points */}
          <Polyline
            coordinates={ROUTE_COORDS}
            strokeColor={RED}
            strokeWidth={4}
          />
        </MapView>
      </View>

      {/* Navigation Info Panel */}
      <View style={styles.infoPanel}>
        <View style={styles.routeInfo}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, styles.restaurantDot]} />
            <View style={styles.routeText}>
              <Text style={styles.routeLabel}>Départ</Text>
              <Text style={styles.routeAddress}>Pizza Bella, 123 Rue de la Paix</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routePoint}>
            <View style={[styles.routeDot, styles.clientDot]} />
            <View style={styles.routeText}>
              <Text style={styles.routeLabel}>Destination</Text>
              <Text style={styles.routeAddress}>456 Avenue des Champs, 75008 Paris</Text>
            </View>
          </View>
        </View>

        {/* Route Stats */}
        <View style={styles.routeStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="straighten" size={20} color={RED} />
            <Text style={styles.statValue}>2.3 km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="access-time" size={20} color={RED} />
            <Text style={styles.statValue}>
              {currentStep === 'navigating' ? `${Math.round((1 - progress) * 8)} min` : '8 min'}
            </Text>
            <Text style={styles.statLabel}>Temps restant</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="receipt" size={20} color={RED} />
            <Text style={styles.statValue}>CMD-001</Text>
            <Text style={styles.statLabel}>Commande</Text>
          </View>
        </View>

        {/* Barre de progression */}
        {currentStep === 'navigating' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}% complété</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={getButtonStyle()} 
          onPress={getButtonAction()}
          disabled={currentStep === 'navigating'}
        >
          <MaterialIcons name={getButtonIcon() as any} size={24} color={DARK_TEXT} />
          <Text style={styles.actionBtnText}>{getButtonText()}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('OrderDetail', { orderId: 'CMD-001' })}
        >
          <MaterialIcons name="receipt" size={20} color={RED} />
          <Text style={styles.secondaryBtnText}>Détails de la commande</Text>
        </TouchableOpacity>
      </View>

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