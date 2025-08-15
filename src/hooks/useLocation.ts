import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface LocationSettings {
  enabled: boolean;
  accuracy: Location.Accuracy;
  distanceFilter: number;
  updateInterval: number;
}

export const useLocation = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const driverId = user?.id;

  // Demander les permissions de localisation
  const requestPermissions = useCallback(async () => {
    try {
      setError(null);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== 'granted') {
        setError('Permission de localisation refusée');
        Alert.alert(
          'Permission requise',
          'La localisation est nécessaire pour suivre vos livraisons.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (err) {
      setError('Erreur lors de la demande de permission');
      console.error('Erreur requestPermissions:', err);
      return false;
    }
  }, []);

  // Obtenir la position actuelle
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      setError(null);

      const hasPermission = await requestPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      setLocation(locationData);
      return locationData;
    } catch (err) {
      setError('Erreur lors de la récupération de la position');
      console.error('Erreur getCurrentLocation:', err);
      return null;
    }
  }, [requestPermissions]);

  // Démarrer le suivi de localisation
  const startLocationTracking = useCallback(async () => {
    if (!driverId) return false;

    try {
      setError(null);

      const hasPermission = await requestPermissions();
      if (!hasPermission) return false;

      // Arrêter le suivi précédent s'il existe
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // 10 secondes
          distanceInterval: 10, // 10 mètres
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          };

          setLocation(locationData);
          
          // Envoyer la position à Supabase (optionnel)
          updateDriverLocation(driverId, locationData);
        }
      );

      setIsTracking(true);
      return true;
    } catch (err) {
      setError('Erreur lors du démarrage du suivi');
      console.error('Erreur startLocationTracking:', err);
      return false;
    }
  }, [driverId, requestPermissions]);

  // Arrêter le suivi de localisation
  const stopLocationTracking = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTracking(false);
  }, []);

  // Mettre à jour la position du chauffeur dans Supabase
  const updateDriverLocation = useCallback(async (driverId: string, locationData: LocationData) => {
    try {
      // Ici vous pouvez mettre à jour la position du chauffeur dans votre base de données
      // Par exemple, dans une table driver_locations ou dans le profil du chauffeur
      
      const { error } = await supabase
        .from('drivers')
        .update({
          // Si vous avez des champs de coordonnées dans la table drivers
          // coordinates: `POINT(${locationData.longitude} ${locationData.latitude})`,
        })
        .eq('id', driverId);

      if (error) {
        console.error('Erreur mise à jour position:', error);
      }
    } catch (err) {
      console.error('Erreur updateDriverLocation:', err);
    }
  }, []);

  // Calculer la distance entre deux points
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance en km
  }, []);

  // Obtenir l'adresse à partir des coordonnées
  const getAddressFromCoordinates = useCallback(async (latitude: number, longitude: number): Promise<string | null> => {
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address) {
        const parts = [
          address.street,
          address.streetNumber,
          address.postalCode,
          address.city,
        ].filter(Boolean);
        
        return parts.join(', ');
      }

      return null;
    } catch (err) {
      console.error('Erreur getAddressFromCoordinates:', err);
      return null;
    }
  }, []);

  // Vérifier les permissions au montage
  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
    };

    checkPermissions();
  }, []);

  // Nettoyer le suivi au démontage
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  return {
    // État
    location,
    isTracking,
    permissionStatus,
    error,

    // Actions
    requestPermissions,
    getCurrentLocation,
    startLocationTracking,
    stopLocationTracking,

    // Utilitaires
    calculateDistance,
    getAddressFromCoordinates,

    // État dérivé
    hasPermission: permissionStatus === 'granted',
    canTrack: permissionStatus === 'granted' && !error,
  };
}; 