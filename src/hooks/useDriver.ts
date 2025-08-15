import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DriverService, DriverProfile, DriverStats, WorkSession, Business } from '../services/driverService';
import { DriverAuthService, DriverAuthData, DriverUpdateData } from '../services/driverAuthService';

export const useDriver = () => {
  const { driver, getCurrentDriver } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const driverId = driver?.id;

  // Charger le profil du chauffeur
  const loadProfile = useCallback(async () => {
    if (!driverId) return;

    try {
      setLoading(true);
      setError(null);
      const profileData = await DriverService.getProfile(driverId);
      setProfile(profileData);
    } catch (err) {
      setError('Erreur lors du chargement du profil');
      console.error('Erreur loadProfile:', err);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    if (!driverId) return;

    try {
      const statsData = await DriverService.getStats(driverId);
      setStats(statsData);
    } catch (err) {
      console.error('Erreur loadStats:', err);
    }
  }, [driverId]);

  // Charger la session active
  const loadActiveSession = useCallback(async () => {
    if (!driverId) return;

    try {
      const sessionData = await DriverService.getActiveSession(driverId);
      setActiveSession(sessionData);
    } catch (err) {
      console.error('Erreur loadActiveSession:', err);
    }
  }, [driverId]);

  // Charger les businesses disponibles
  const loadBusinesses = useCallback(async () => {
    try {
      const businessesData = await DriverService.getBusinesses();
      setBusinesses(businessesData);
    } catch (err) {
      console.error('Erreur loadBusinesses:', err);
    }
  }, []);

  // Mettre à jour la disponibilité
  const updateAvailability = useCallback(async (isActive: boolean) => {
    if (!driverId) return false;

    try {
      const success = await DriverService.updateAvailability(driverId, isActive);
      if (success && profile) {
        setProfile({ ...profile, is_active: isActive });
      }
      return success;
    } catch (err) {
      console.error('Erreur updateAvailability:', err);
      return false;
    }
  }, [driverId, profile]);

  // Assigner à un business
  const assignToBusiness = useCallback(async (businessId: number) => {
    if (!driverId) return false;

    try {
      const success = await DriverService.assignToBusiness(driverId, businessId);
      if (success) {
        await loadProfile(); // Recharger le profil pour mettre à jour les infos du business
      }
      return success;
    } catch (err) {
      console.error('Erreur assignToBusiness:', err);
      return false;
    }
  }, [driverId, loadProfile]);

  // Retirer d'un business (devenir indépendant)
  const removeFromBusiness = useCallback(async () => {
    if (!driverId) return false;

    try {
      const success = await DriverService.removeFromBusiness(driverId);
      if (success) {
        await loadProfile(); // Recharger le profil
      }
      return success;
    } catch (err) {
      console.error('Erreur removeFromBusiness:', err);
      return false;
    }
  }, [driverId, loadProfile]);

  // Démarrer une session de travail
  const startWorkSession = useCallback(async () => {
    if (!driverId) return false;

    try {
      const sessionId = await DriverService.startWorkSession(driverId, profile?.business_id);
      if (sessionId) {
        await loadActiveSession();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erreur startWorkSession:', err);
      return false;
    }
  }, [driverId, profile?.business_id, loadActiveSession]);

  // Terminer une session de travail
  const endWorkSession = useCallback(async () => {
    if (!activeSession) return false;

    try {
      const success = await DriverService.endWorkSession(activeSession.id);
      if (success) {
        setActiveSession(null);
        await loadStats(); // Recharger les stats après la session
      }
      return success;
    } catch (err) {
      console.error('Erreur endWorkSession:', err);
      return false;
    }
  }, [activeSession, loadStats]);

  // Mettre à jour le profil
  const updateProfile = async (updateData: DriverUpdateData) => {
    if (!driverId) return { error: 'Driver non connecté' };

    setLoading(true);
    try {
      const { driver: updatedDriver, error } = await DriverAuthService.updateDriverProfile(driverId, updateData);
      
      if (error) {
        return { error };
      }

      // Rafraîchir les données du driver dans le contexte
      await getCurrentDriver();
      
      return { driver: updatedDriver };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return { error: 'Erreur lors de la mise à jour du profil' };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    try {
      const { error } = await DriverAuthService.changePassword(currentPassword, newPassword);
      return { error };
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      return { error: 'Erreur lors du changement de mot de passe' };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await DriverAuthService.resetPassword(email);
      return { error };
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      return { error: 'Erreur lors de la réinitialisation du mot de passe' };
    } finally {
      setLoading(false);
    }
  };

  const checkEmailExists = async (email: string) => {
    try {
      const { exists, error } = await DriverAuthService.checkEmailExists(email);
      return { exists, error };
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'email:', error);
      return { exists: false, error: 'Erreur lors de la vérification' };
    }
  };

  // Recharger toutes les données
  const refresh = useCallback(async () => {
    await Promise.all([
      loadProfile(),
      loadStats(),
      loadActiveSession(),
      loadBusinesses(),
    ]);
  }, [loadProfile, loadStats, loadActiveSession, loadBusinesses]);

  // Charger les données au montage et quand le driverId change
  useEffect(() => {
    if (driverId) {
      refresh();
    }
  }, [driverId, refresh]);

  return {
    driver,
    profile,
    stats,
    activeSession,
    businesses,
    loading,
    error,
    updateAvailability,
    assignToBusiness,
    removeFromBusiness,
    startWorkSession,
    endWorkSession,
    updateProfile,
    changePassword,
    resetPassword,
    checkEmailExists,
    refreshDriver: getCurrentDriver,
    isOnline: activeSession !== null,
    isAvailable: profile?.is_active || false,
    isIndependent: profile?.is_independent || false,
    businessId: profile?.business_id,
    businessName: profile?.business_name,
    businessType: profile?.business_type,
  };
}; 