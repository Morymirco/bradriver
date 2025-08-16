import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DriverAuthService, DriverUpdateData } from '../services/driverAuthService';

export const useDriver = () => {
  const { driver, getCurrentDriver } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mettre à jour le profil du driver
  const updateProfile = async (updateData: DriverUpdateData) => {
    if (!driver) {
      return { error: 'Driver non connecté' };
    }

      setLoading(true);
      setError(null);

    try {
      const { driver: updatedDriver, error } = await DriverAuthService.updateDriverProfile(driver.id, updateData);
      
      if (error) {
        setError(error);
        return { error };
      }

      // Rafraîchir les données du driver dans le contexte
      await getCurrentDriver();
      
      return { driver: updatedDriver };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Changer la disponibilité du driver
  const updateAvailability = async (isAvailable: boolean) => {
    if (!driver) {
      return { error: 'Driver non connecté' };
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await DriverAuthService.updateAvailability(driver.id, isAvailable);
      
      if (error) {
        setError(error);
      return { error };
      }

      // Rafraîchir les données du driver dans le contexte
      await getCurrentDriver();
      
      return {};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Propriétés calculées pour la compatibilité
  const isIndependent = driver?.type === 'independent';
  const businessServiceName = driver?.business_name || null;
  const serviceType = driver?.type || 'independent';

  // Fonction pour retirer un driver d'un service (pour les drivers indépendants)
  const removeFromBusinessService = async () => {
    if (!driver || driver.type !== 'service') {
      return { error: 'Driver non éligible' };
    }

    return await updateProfile({
      type: 'independent',
      business_id: undefined
    });
  };

  return {
    // Données du driver
    profile: driver,
    
    // États
    loading,
    error,
    
    // Actions
    updateProfile,
    updateAvailability,
    removeFromBusinessService,
    
    // Propriétés calculées
    isIndependent,
    businessServiceName,
    serviceType,
    
    // Données spécifiques
    totalDeliveries: driver?.total_deliveries || 0,
    totalEarnings: driver?.total_earnings || 0,
    rating: driver?.rating || 0,
    isAvailable: driver?.is_available || false,
    isVerified: driver?.is_verified || false,
    documentsCount: driver?.documents_count || 0,
    vehicleType: driver?.vehicle_type,
    vehiclePlate: driver?.vehicle_plate
  };
}; 