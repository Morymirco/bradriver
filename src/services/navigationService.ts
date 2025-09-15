import { Linking, Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Types pour la navigation
export interface NavigationData {
  orderId: string;
  orderNumber: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCoordinates: {
    latitude: number;
    longitude: number;
  };
  deliveryCoordinates: {
    latitude: number;
    longitude: number;
  };
  estimatedDistance: number; // en km
  estimatedDuration: number; // en minutes
  restaurantName: string;
  clientName: string;
  clientPhone: string;
  status: string;
}

export interface RouteInfo {
  distance: number;
  duration: number;
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
}

export class NavigationService {
  /**
   * Récupérer les données de navigation pour une commande
   */
  static async getNavigationData(orderId: string): Promise<{ data: NavigationData | null; error: any }> {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          delivery_address,
          delivery_latitude,
          delivery_longitude,
          delivery_formatted_address,
          pickup_latitude,
          pickup_longitude,
          pickup_formatted_address,
          businesses(
            id,
            name,
            address
          ),
          user_profiles(
            id,
            name,
            phone_number
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération des données de navigation:', error);
        console.error('Détails de l\'erreur:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return { data: null, error };
      }

      if (!order) {
        return { data: null, error: 'Commande non trouvée' };
      }

      // Utiliser les nouvelles colonnes de coordonnées
      const pickupCoords = {
        latitude: order.pickup_latitude || 9.5370,
        longitude: order.pickup_longitude || -13.6785
      };
      const deliveryCoords = {
        latitude: order.delivery_latitude || 9.5450,
        longitude: order.delivery_longitude || -13.6700
      };

      console.log('Coordonnées récupérées:', {
        pickup: pickupCoords,
        delivery: deliveryCoords,
        pickup_address: order.pickup_formatted_address,
        delivery_address: order.delivery_formatted_address
      });

      // Calculer la distance et durée estimées
      const routeInfo = await this.calculateRoute(pickupCoords, deliveryCoords);

      // Créer des adresses par défaut basées sur les coordonnées
      const defaultPickupAddress = order.pickup_formatted_address || order.businesses?.address || 'Centre-ville, Conakry, Guinée';
      const defaultDeliveryAddress = order.delivery_formatted_address || order.delivery_address || 'J99X+85G, Rte le prince, Conakry, Guinée';

      const navigationData: NavigationData = {
        orderId: order.id,
        orderNumber: order.order_number,
        pickupAddress: defaultPickupAddress,
        deliveryAddress: defaultDeliveryAddress,
        pickupCoordinates: pickupCoords,
        deliveryCoordinates: deliveryCoords,
        estimatedDistance: routeInfo.distance,
        estimatedDuration: routeInfo.duration,
        restaurantName: order.businesses?.name || 'Restaurant',
        clientName: order.user_profiles?.name || 'Client',
        clientPhone: order.user_profiles?.phone_number || '',
        status: order.status
      };

      return { data: navigationData, error: null };
    } catch (error) {
      console.error('Erreur inattendue lors de la récupération des données de navigation:', error);
      return { data: null, error };
    }
  }

  /**
   * Calculer l'itinéraire entre deux points
   */
  static async calculateRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<RouteInfo> {
    try {
      // Utiliser l'API Google Maps Directions
      const apiKey = "AIzaSyDIp_O6TQg33J4Z2M44Uj3SEJZfTq1EqZU";
      if (!apiKey) {
        console.warn('Clé API Google Maps non configurée, utilisation de calculs approximatifs');
        return this.calculateApproximateRoute(origin, destination);
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      console.log('Réponse API Google Maps:', {
        status: data.status,
        error_message: data.error_message,
        routes_count: data.routes?.length || 0,
        url: url.replace(apiKey, 'API_KEY_HIDDEN')
      });

      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Extraire les coordonnées de l'itinéraire
        const coordinates = this.decodePolyline(route.overview_polyline.points);
        
        return {
          distance: leg.distance.value / 1000, // Convertir en km
          duration: Math.ceil(leg.duration.value / 60), // Convertir en minutes
          coordinates
        };
      } else {
        console.warn('Erreur API Google Maps:', data.error_message || 'Statut non OK');
        console.warn('Utilisation de calculs approximatifs');
        return this.calculateApproximateRoute(origin, destination);
      }
    } catch (error) {
      console.error('Erreur lors du calcul de l\'itinéraire:', error);
      return this.calculateApproximateRoute(origin, destination);
    }
  }

  /**
   * Calculer une route approximative (fallback)
   */
  static calculateApproximateRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): RouteInfo {
    // Calcul de distance approximative (formule de Haversine)
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(destination.latitude - origin.latitude);
    const dLon = this.toRadians(destination.longitude - origin.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(origin.latitude)) * Math.cos(this.toRadians(destination.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Durée estimée (vitesse moyenne de 30 km/h en ville)
    const duration = Math.ceil(distance * 2); // 2 minutes par km
    
    // Coordonnées intermédiaires pour l'animation
    const coordinates = [
      origin,
      {
        latitude: (origin.latitude + destination.latitude) / 2,
        longitude: (origin.longitude + destination.longitude) / 2
      },
      destination
    ];

    return { distance, duration, coordinates };
  }

  /**
   * Ouvrir Google Maps avec l'itinéraire
   */
  static async openGoogleMaps(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    originAddress?: string,
    destinationAddress?: string
  ): Promise<boolean> {
    try {
      const originStr = originAddress || `${origin.latitude},${origin.longitude}`;
      const destinationStr = destinationAddress || `${destination.latitude},${destination.longitude}`;
      
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destinationStr)}&travelmode=driving`;
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      } else {
        console.error('Google Maps n\'est pas installé');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de Google Maps:', error);
      return false;
    }
  }

  /**
   * Ouvrir Apple Maps (iOS uniquement)
   */
  static async openAppleMaps(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    originAddress?: string,
    destinationAddress?: string
  ): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.warn('Apple Maps n\'est disponible que sur iOS');
      return false;
    }

    try {
      const originStr = originAddress || `${origin.latitude},${origin.longitude}`;
      const destinationStr = destinationAddress || `${destination.latitude},${destination.longitude}`;
      
      const url = `http://maps.apple.com/?saddr=${encodeURIComponent(originStr)}&daddr=${encodeURIComponent(destinationStr)}&dirflg=d`;
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      } else {
        console.error('Apple Maps n\'est pas installé');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture d\'Apple Maps:', error);
      return false;
    }
  }

  /**
   * Obtenir la position actuelle du chauffeur
   */
  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // Utiliser l'API de géolocalisation du navigateur/React Native
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            (error) => {
              console.error('Erreur de géolocalisation:', error);
              reject(error);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            }
          );
        } else {
          reject(new Error('Géolocalisation non supportée'));
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error);
      return null;
    }
  }

  /**
   * Mettre à jour le statut de la commande
   */
  static async updateOrderStatus(orderId: string, status: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Erreur inattendue lors de la mise à jour du statut:', error);
      return { success: false, error };
    }
  }

  /**
   * Parser les coordonnées depuis la base de données
   */
  private static parseCoordinates(coords: any): { latitude: number; longitude: number } {
    if (!coords) {
      return { latitude: 0, longitude: 0 };
    }

    // Si c'est un objet avec lat/lng
    if (typeof coords === 'object' && coords.latitude && coords.longitude) {
      return { latitude: coords.latitude, longitude: coords.longitude };
    }

    // Si c'est un point PostgreSQL (x,y)
    if (typeof coords === 'string' && coords.includes(',')) {
      const [lng, lat] = coords.replace(/[()]/g, '').split(',').map(Number);
      return { latitude: lat, longitude: lng };
    }

    // Coordonnées par défaut (Paris)
    return { latitude: 48.8566, longitude: 2.3522 };
  }

  /**
   * Convertir les degrés en radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Décoder une polyline Google Maps
   */
  private static decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
    const poly = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let shift = 0, result = 0;

      do {
        let b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result >= 0x20);

      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        let b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result >= 0x20);

      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1E5,
        longitude: lng / 1E5
      });
    }

    return poly;
  }

  /**
   * Formater la distance pour l'affichage
   */
  static formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }

  /**
   * Formater la durée pour l'affichage
   */
  static formatDuration(duration: number): string {
    if (duration < 60) {
      return `${duration} min`;
    }
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  }
}
