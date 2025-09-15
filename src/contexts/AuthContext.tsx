import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DriverAuthData, DriverAuthService, DriverLoginData, DriverRegistrationData } from '../services/driverAuthService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  driver: DriverAuthData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signUp: (driverData: DriverRegistrationData) => Promise<{ error: any }>;
  getCurrentDriver: () => Promise<void>;
  refreshDriver: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [driver, setDriver] = useState<DriverAuthData | null>(null);
  const [loading, setLoading] = useState(true);

  const getCurrentDriver = async () => {
    try {
      const { driver: driverData, error } = await DriverAuthService.getCurrentDriver();
      if (error) {
        console.error('Erreur lors de la récupération du driver:', error);
        // Ne pas déconnecter automatiquement en cas d'erreur temporaire
        // setDriver(null);
        return;
      } else {
        setDriver(driverData || null);
      }
    } catch (error) {
      console.error('Erreur inattendue lors de la récupération du driver:', error);
      // Ne pas déconnecter automatiquement en cas d'erreur temporaire
      // setDriver(null);
    }
  };

  const refreshDriver = async () => {
    await getCurrentDriver();
  };

  useEffect(() => {
    // Récupérer la session initiale
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Si une session existe, récupérer les données du driver avec retry
      if (session?.user) {
        await getCurrentDriverWithRetry();
      } else {
        // Si pas de session, on peut arrêter le loading
        setLoading(false);
      }
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Si une session existe, récupérer les données du driver avec retry
        if (session?.user) {
          await getCurrentDriverWithRetry();
        } else {
          setDriver(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fonction avec retry pour récupérer le driver
  const getCurrentDriverWithRetry = async (retryCount = 0) => {
    try {
      console.log(`🔄 Tentative de récupération du driver (${retryCount + 1}/3)`);
      const { driver: driverData, error } = await DriverAuthService.getCurrentDriver();
      if (error) {
        console.error(`Erreur lors de la récupération du driver (tentative ${retryCount + 1}):`, error);
        
        // Retry jusqu'à 3 fois avec un délai
        if (retryCount < 2) {
          setTimeout(() => {
            getCurrentDriverWithRetry(retryCount + 1);
          }, 1000 * (retryCount + 1)); // Délai progressif : 1s, 2s, 3s
          return;
        }
        
        // Après 3 tentatives, on garde la session mais on affiche un message
        console.warn('Impossible de récupérer les données du driver après 3 tentatives');
        setLoading(false);
        return;
      } else {
        console.log('✅ Driver récupéré avec succès:', driverData?.name);
        setDriver(driverData || null);
        setLoading(false); // Arrêter le loading seulement quand le driver est récupéré
      }
    } catch (error) {
      console.error(`Erreur inattendue lors de la récupération du driver (tentative ${retryCount + 1}):`, error);
      
      // Retry jusqu'à 3 fois avec un délai
      if (retryCount < 2) {
        setTimeout(() => {
          getCurrentDriverWithRetry(retryCount + 1);
        }, 1000 * (retryCount + 1));
        return;
      }
      
      // Après 3 tentatives, arrêter le loading
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const loginData: DriverLoginData = { email, password };
      const { driver: driverData, error } = await DriverAuthService.login(loginData);
      
      if (error) {
        return { error: { message: error } };
      }
      
      if (driverData) {
        setDriver(driverData);
      }
      
      return { error: null };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return { error: { message: 'Erreur lors de la connexion' } };
    }
  };

  const signUp = async (driverData: DriverRegistrationData) => {
    try {
      const { driver: newDriver, error } = await DriverAuthService.register(driverData);
      
      if (error) {
        return { error: { message: error } };
      }
      
      if (newDriver) {
        setDriver(newDriver);
      }
      
      return { error: null };
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return { error: { message: 'Erreur lors de l\'inscription' } };
    }
  };

  const signOut = async () => {
    try {
      await DriverAuthService.logout();
      setDriver(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const value = {
    session,
    user,
    driver,
    loading,
    signIn,
    signOut,
    signUp,
    getCurrentDriver,
    refreshDriver,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 