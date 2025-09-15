import { supabase } from '../lib/supabase';

export interface DriverAuthData {
  id: string;
  email: string;
  phone_number: string;
  name: string;
  type: 'independent' | 'service';
  business_id?: number;
  business_name?: string;
  is_verified: boolean;
  is_active: boolean;
  avatar_url?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
  documents_count: number;
  total_deliveries: number;
  total_earnings: number;
  rating: number;
  is_available: boolean;
  created_at: string;
}

export interface DriverRegistrationData {
  email: string;
  phone_number: string;
  name: string;
  password: string;
  type: 'independent' | 'service';
  business_id?: number;
  vehicle_type?: string;
  vehicle_plate?: string;
}

export interface DriverLoginData {
  email: string;
  password: string;
}

export interface DriverUpdateData {
  name?: string;
  phone_number?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
  avatar_url?: string;
}

export class DriverAuthService {
  // Inscription d'un nouveau livreur
  static async register(driverData: DriverRegistrationData): Promise<{ driver?: DriverAuthData; error?: string }> {
    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: driverData.email,
        password: driverData.password,
        options: {
          data: {
            role: 'driver',
            name: driverData.name,
            phone_number: driverData.phone_number
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte');
      }

      // 2. Récupérer l'ID du rôle driver
      const { data: driverRole, error: roleError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('name', 'driver')
        .single();

      if (roleError || !driverRole) {
        // Supprimer l'utilisateur créé si le rôle n'existe pas
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Rôle driver non trouvé');
      }

      // 3. Créer le profil utilisateur dans user_profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          name: driverData.name,
          email: driverData.email,
          phone_number: driverData.phone_number,
          role_id: driverRole.id,
          is_active: true,
          is_verified: false
        })
        .select()
        .single();

      if (profileError) {
        // Supprimer l'utilisateur créé si le profil échoue
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(profileError.message);
      }

      // 4. Créer le profil driver dans driver_profiles
      const { data: driverProfile, error: driverError } = await supabase
        .from('driver_profiles')
        .insert({
          id: authData.user.id, // Même ID que user_profiles
          name: driverData.name,
          email: driverData.email,
          phone_number: driverData.phone_number,
          type: driverData.type,
          business_id: driverData.business_id || null,
          vehicle_type: driverData.vehicle_type || null,
          vehicle_plate: driverData.vehicle_plate || null,
          is_active: true,
          is_available: true,
          avatar_url: null
        })
        .select()
        .single();

      if (driverError) {
        // Supprimer les profils créés si le profil driver échoue
        await supabase.from('user_profiles').delete().eq('id', authData.user.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(driverError.message);
      }

      // 5. Récupérer les données complètes du livreur
      const { data: completeDriver, error: fetchError } = await this.getDriverById(authData.user.id);

      if (fetchError) {
        throw new Error(fetchError);
      }

      return { driver: completeDriver };

    } catch (error) {
      console.error('Erreur lors de l\'inscription du livreur:', error);
      return { error: error instanceof Error ? error.message : 'Erreur lors de l\'inscription' };
    }
  }

  // Connexion d'un livreur
  static async login(loginData: DriverLoginData): Promise<{ driver?: DriverAuthData; error?: string }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Identifiants invalides');
      }

      // Vérifier que l'utilisateur est bien un livreur
      const { driver: driverData, error: driverError } = await this.getDriverById(authData.user.id);

      if (driverError) {
        throw new Error('Profil livreur non trouvé');
      }

      if (!driverData) {
        throw new Error('Profil livreur non trouvé');
      }

      console.log('🔍 Driver récupéré pour connexion:', driverData);

      if (driverData.is_active === false) {
        throw new Error('Votre compte est désactivé. Contactez l\'administrateur.');
      }

      return { driver: driverData };

    } catch (error) {
      console.error('Erreur lors de la connexion du livreur:', error);
      return { error: error instanceof Error ? error.message : 'Erreur lors de la connexion' };
    }
  }

  // Déconnexion
  static async logout(): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      return {};
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return { error: error instanceof Error ? error.message : 'Erreur lors de la déconnexion' };
    }
  }

  // Récupérer le livreur connecté
  static async getCurrentDriver(): Promise<{ driver?: DriverAuthData; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { error: 'Utilisateur non connecté' };
      }

      return await this.getDriverById(user.id);
    } catch (error) {
      console.error('Erreur lors de la récupération du livreur connecté:', error);
      return { error: error instanceof Error ? error.message : 'Erreur lors de la récupération' };
    }
  }

  // Récupérer un livreur par ID (auth.users ID)
  static async getDriverById(authUserId: string): Promise<{ driver?: DriverAuthData; error?: string }> {
    try {
      console.log('🔍 Recherche du driver avec auth user ID:', authUserId);
      
      // D'abord, vérifier si l'ID est valide
      if (!authUserId || typeof authUserId !== 'string') {
        throw new Error('ID de driver invalide');
      }

      // Vérifier si l'ID est un UUID valide
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(authUserId)) {
        throw new Error('Format d\'ID invalide (UUID attendu)');
      }

      // Récupérer le profil utilisateur et vérifier le rôle
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          name,
          email,
          phone_number,
          is_active,
          is_verified,
          role_id,
          user_roles (
            name
          )
        `)
        .eq('id', authUserId)
        .single();

      if (userError || !userProfile) {
        console.error('❌ Erreur user_profiles:', userError);
        throw new Error('Profil utilisateur non trouvé');
      }

      // Vérifier que c'est bien un driver
      if (userProfile.user_roles?.name !== 'driver') {
        throw new Error('Utilisateur non autorisé (rôle driver requis)');
      }

      console.log('✅ Profil utilisateur trouvé:', userProfile.name, userProfile.email);

      // Récupérer le profil driver
      const { data: driver, error: driverError } = await supabase
        .from('driver_profiles')
        .select(`
          id,
          name,
          email,
          phone_number,
          type,
          business_id,
          is_active,
          is_available,
          vehicle_type,
          vehicle_plate,
          avatar_url,
          created_at,
          businesses!driver_profiles_business_id_fkey (
            name
          )
        `)
        .eq('id', authUserId)
        .single();

      if (driverError || !driver) {
        console.error('❌ Aucun driver trouvé par ID:', authUserId);
        throw new Error('Profil livreur non trouvé');
      }

      console.log('✅ Driver trouvé par ID:', driver.name);

      // Récupérer les commandes assignées au driver
      const { data: driverOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          delivery_fee,
          created_at
        `)
        .eq('driver_id', driver.id)
        .order('created_at', { ascending: false });

      const totalDeliveries = driverOrders?.filter(order => order.status === 'delivered').length || 0;
      const totalEarnings = driverOrders?.reduce((sum, order) => sum + Math.round((order.delivery_fee || 0) * 0.40), 0) || 0;

      // Compter les documents
      const { count: documentsCount } = await supabase
        .from('driver_documents')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', authUserId);

      // Transformer les données
      const driverData: DriverAuthData = {
        id: driver.id,
        email: driver.email,
        phone_number: driver.phone_number,
        name: driver.name,
        type: driver.type || 'independent',
        business_id: driver.business_id,
        business_name: driver.businesses?.name,
        is_verified: userProfile.is_verified || false,
        is_active: driver.is_active !== false && userProfile.is_active !== false,
        avatar_url: driver.avatar_url,
        vehicle_type: driver.vehicle_type,
        vehicle_plate: driver.vehicle_plate,
        documents_count: documentsCount || 0,
        total_deliveries: totalDeliveries,
        total_earnings: totalEarnings,
        rating: 0, // À calculer depuis les reviews
        is_available: driver.is_available,
        created_at: driver.created_at
      };

      return { driver: driverData };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du livreur:', error);
      return { error: error instanceof Error ? error.message : 'Erreur lors de la récupération' };
    }
  }

  // Mettre à jour le profil du livreur
  static async updateDriverProfile(driverId: string, updateData: DriverUpdateData): Promise<{ driver?: DriverAuthData; error?: string }> {
    try {
      // Mettre à jour le profil utilisateur
      const userUpdateData: any = {};
      if (updateData.name) userUpdateData.name = updateData.name;
      if (updateData.phone_number) userUpdateData.phone_number = updateData.phone_number;

      if (Object.keys(userUpdateData).length > 0) {
        const { error: userError } = await supabase
          .from('user_profiles')
          .update(userUpdateData)
          .eq('id', driverId);

        if (userError) {
          throw new Error(userError.message);
        }
      }

      // Mettre à jour le profil driver
      const driverUpdateData: any = {};
      if (updateData.name) driverUpdateData.name = updateData.name;
      if (updateData.phone_number) driverUpdateData.phone_number = updateData.phone_number;
      if (updateData.vehicle_type) driverUpdateData.vehicle_type = updateData.vehicle_type;
      if (updateData.vehicle_plate) driverUpdateData.vehicle_plate = updateData.vehicle_plate;
      if (updateData.avatar_url) driverUpdateData.avatar_url = updateData.avatar_url;

      if (Object.keys(driverUpdateData).length > 0) {
        const { error: driverError } = await supabase
          .from('driver_profiles')
          .update(driverUpdateData)
          .eq('id', driverId);

        if (driverError) {
          throw new Error(driverError.message);
        }
      }

      // Récupérer les données mises à jour
      return await this.getDriverById(driverId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return { error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour' };
    }
  }

  // Changer la disponibilité du chauffeur
  static async updateAvailability(driverId: string, isAvailable: boolean): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('driver_profiles')
        .update({ is_available: isAvailable })
        .eq('id', driverId);
      
      if (error) {
        throw new Error(error.message);
      }

      return {};
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la disponibilité:', error);
      return { error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour' };
    }
  }
} 