import { supabase } from '../lib/supabase';

export interface PackageOrderData {
  business_id: number;
  service_name: string;
  service_price: number;
  package_details: {
    weight: string;
    dimensions: string;
    description: string;
    is_fragile: boolean;
    is_urgent: boolean;
  };
  pickup_address: {
    address: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
  };
  delivery_address: {
    address: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
  };
  customer_info: {
    name: string;
    phone: string;
    email: string;
  };
  delivery_preferences: {
    preferred_time?: string;
    contact_method: 'phone' | 'email' | 'both';
  };
}

export interface PackageOrder extends PackageOrderData {
  id: string;
  order_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  delivery_fee: number;
  grand_total: number;
  estimated_delivery_time?: string;
  businesses?: {
    id: number;
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export class PackageOrderService {
  /**
   * Récupérer les commandes de colis disponibles pour les livreurs
   */
  static async getAvailablePackageOrders(): Promise<PackageOrder[]> {
    const { data, error } = await supabase
      .from('package_orders')
      .select(`
        *,
        orders!inner(
          id,
          status,
          total,
          delivery_fee,
          grand_total,
          available_for_drivers,
          driver_id,
          created_at,
          updated_at
        ),
        businesses(
          id,
          name,
          address,
          phone,
          email
        )
      `)
      .is('orders.driver_id', null)
      .in('orders.status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des commandes de colis: ${error.message}`);
    }

    return data.map(packageOrder => {
      const order = packageOrder.orders;
      
      return {
        id: packageOrder.id,
        order_id: order.id,
        user_id: packageOrder.user_id,
        business_id: packageOrder.business_id,
        service_name: packageOrder.service_name,
        service_price: packageOrder.service_price,
        package_details: {
          weight: packageOrder.package_weight,
          dimensions: packageOrder.package_dimensions,
          description: packageOrder.package_description,
          is_fragile: packageOrder.is_fragile,
          is_urgent: packageOrder.is_urgent
        },
        pickup_address: {
          address: packageOrder.pickup_address,
          instructions: packageOrder.pickup_instructions,
          latitude: packageOrder.pickup_latitude,
          longitude: packageOrder.pickup_longitude
        },
        delivery_address: {
          address: packageOrder.delivery_address,
          instructions: packageOrder.delivery_instructions,
          latitude: packageOrder.delivery_latitude,
          longitude: packageOrder.delivery_longitude
        },
        customer_info: {
          name: packageOrder.customer_name,
          phone: packageOrder.customer_phone,
          email: packageOrder.customer_email
        },
        delivery_preferences: {
          preferred_time: packageOrder.preferred_time,
          contact_method: packageOrder.contact_method
        },
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
        total_amount: order.total,
        delivery_fee: order.delivery_fee,
        grand_total: order.grand_total,
        estimated_delivery_time: packageOrder.estimated_delivery_time,
        businesses: packageOrder.businesses
      };
    });
  }

  /**
   * Récupérer une commande de colis spécifique
   */
  static async getPackageOrder(orderId: string): Promise<PackageOrder> {
    const { data, error } = await supabase
      .from('package_orders')
      .select(`
        *,
        orders(
          id,
          status,
          total,
          delivery_fee,
          grand_total,
          available_for_drivers,
          driver_id,
          created_at,
          updated_at
        ),
        businesses(
          id,
          name,
          address,
          phone,
          email
        )
      `)
      .eq('order_id', orderId)
      .single();

    if (error) {
      throw new Error(`Erreur lors de la récupération de la commande de colis: ${error.message}`);
    }

    const order = data.orders;

    return {
      id: data.id,
      order_id: order.id,
      user_id: data.user_id,
      business_id: data.business_id,
      service_name: data.service_name,
      service_price: data.service_price,
      package_details: {
        weight: data.package_weight,
        dimensions: data.package_dimensions,
        description: data.package_description,
        is_fragile: data.is_fragile,
        is_urgent: data.is_urgent
      },
      pickup_address: {
        address: data.pickup_address,
        instructions: data.pickup_instructions,
        latitude: data.pickup_latitude,
        longitude: data.pickup_longitude
      },
      delivery_address: {
        address: data.delivery_address,
        instructions: data.delivery_instructions,
        latitude: data.delivery_latitude,
        longitude: data.delivery_longitude
      },
      customer_info: {
        name: data.customer_name,
        phone: data.customer_phone,
        email: data.customer_email
      },
      delivery_preferences: {
        preferred_time: data.preferred_time,
        contact_method: data.contact_method
      },
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      total_amount: order.total,
      delivery_fee: order.delivery_fee,
      grand_total: order.grand_total,
      estimated_delivery_time: data.estimated_delivery_time
    };
  }

  /**
   * Accepter une commande de colis
   */
  static async acceptPackageOrder(orderId: string, driverId: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ 
        driver_id: driverId,
        status: 'out_for_delivery',
        available_for_drivers: false
      })
      .eq('id', orderId);

    if (error) {
      throw new Error(`Erreur lors de l'acceptation de la commande de colis: ${error.message}`);
    }
  }

  /**
   * Mettre à jour le statut d'une commande de colis
   */
  static async updatePackageOrderStatus(orderId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
  }

  /**
   * Calculer les frais de livraison basés sur le poids
   */
  static calculateDeliveryFee(weight: string): number {
    if (!weight || weight.trim() === '') {
      return 2000; // Frais par défaut pour colis léger
    }
    
    const weightValue = parseFloat(weight.replace(/[^\d.]/g, ''));
    
    if (isNaN(weightValue) || weightValue <= 0) {
      return 2000; // Frais par défaut pour colis léger
    }
    
    if (weightValue <= 5) {
      return 2000; // 2000 FCFA pour colis léger
    } else if (weightValue <= 15) {
      return 3500; // 3500 FCFA pour colis moyen
    } else if (weightValue <= 30) {
      return 5000; // 5000 FCFA pour colis lourd
    } else {
      return 7500; // 7500 FCFA pour colis très lourd
    }
  }

  /**
   * Formater les détails du colis pour l'affichage
   */
  static formatPackageDetails(packageOrder: PackageOrder): string {
    const details = [];
    
    if (packageOrder.package_details.weight) {
      details.push(`Poids: ${packageOrder.package_details.weight}`);
    }
    
    if (packageOrder.package_details.dimensions) {
      details.push(`Dimensions: ${packageOrder.package_details.dimensions}`);
    }
    
    if (packageOrder.package_details.is_fragile) {
      details.push('⚠️ Fragile');
    }
    
    if (packageOrder.package_details.is_urgent) {
      details.push('🚨 Urgent');
    }
    
    return details.join(' • ');
  }

  /**
   * Formater les informations de livraison
   */
  static formatDeliveryInfo(packageOrder: PackageOrder): {
    pickup: string;
    delivery: string;
  } {
    return {
      pickup: `${packageOrder.pickup_address.address}${packageOrder.pickup_address.instructions ? ` (${packageOrder.pickup_address.instructions})` : ''}`,
      delivery: `${packageOrder.delivery_address.address}${packageOrder.delivery_address.instructions ? ` (${packageOrder.delivery_address.instructions})` : ''}`
    };
  }
}
