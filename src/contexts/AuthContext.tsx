import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { DriverAuthService, DriverAuthData, DriverLoginData, DriverRegistrationData } from '../services/driverAuthService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  driver: DriverAuthData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signUp: (driverData: DriverRegistrationData) => Promise<{ error: any }>;
  getCurrentDriver: () => Promise<void>;
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
        setDriver(null);
      } else {
        setDriver(driverData || null);
      }
    } catch (error) {
      console.error('Erreur inattendue lors de la récupération du driver:', error);
      setDriver(null);
    }
  };

  useEffect(() => {
    // Récupérer la session initiale
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Si une session existe, récupérer les données du driver
      if (session?.user) {
        await getCurrentDriver();
      }
      
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Si une session existe, récupérer les données du driver
        if (session?.user) {
          await getCurrentDriver();
        } else {
          setDriver(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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