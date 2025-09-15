import { supabase } from '../lib/supabase';

export interface DriverEarning {
  id: string;
  driver_id: string;
  order_id: string;
  delivery_fee: number;
  driver_earnings: number;
  earnings_percentage: number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  payment_date?: string;
  payment_method?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
  // Relations
  order?: {
    order_number?: string;
    created_at: string;
    business_name?: string;
  };
}

export interface DriverMonthlyStats {
  id: string;
  driver_id: string;
  year: number;
  month: number;
  total_orders: number;
  total_delivery_fees: number;
  total_earnings: number;
  average_earnings_per_order: number;
  best_day?: string;
  best_day_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface DriverEarningsSummary {
  driver_id: string;
  driver_name: string;
  email: string;
  phone_number: string;
  total_earnings: number;
  total_orders_completed: number;
  current_month_earnings: number;
  last_payment_date?: string;
  current_month_orders: number;
  current_month_earnings_detailed: number;
  avg_earnings_per_order: number;
  lifetime_avg_earnings_per_order: number;
}

export class DriverEarningsService {
  /**
   * Calculer les gains d'un driver (40% des frais de livraison)
   */
  static calculateEarnings(deliveryFee: number, percentage: number = 0.40): number {
    return Math.round(deliveryFee * percentage);
  }

  /**
   * Enregistrer les gains d'un driver pour une commande
   */
  static async recordDriverEarnings(
    driverId: string,
    orderId: string,
    deliveryFee: number,
    percentage: number = 0.40
  ): Promise<{ success: boolean; earningsId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('record_driver_earnings', {
        p_driver_id: driverId,
        p_order_id: orderId,
        p_delivery_fee: deliveryFee,
        p_earnings_percentage: percentage
      });

      if (error) {
        console.error('Erreur lors de l\'enregistrement des gains:', error);
        return { success: false, error: error.message };
      }

      return { success: true, earningsId: data };
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des gains:', error);
      return { success: false, error: 'Erreur lors de l\'enregistrement des gains' };
    }
  }

  /**
   * Récupérer l'historique des gains d'un driver
   */
  static async getDriverEarningsHistory(
    driverId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ earnings: DriverEarning[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('driver_earnings')
        .select(`
          *,
          order:orders(
            order_number,
            created_at,
            business:businesses(name)
          )
        `)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        return { earnings: [], error: error.message };
      }

      return { earnings: data || [] };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return { earnings: [], error: 'Erreur lors de la récupération de l\'historique' };
    }
  }

  /**
   * Récupérer les gains d'un driver pour le mois actuel
   */
  static async getCurrentMonthEarnings(driverId: string): Promise<{ earnings: DriverEarning[]; error?: string }> {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const { data, error } = await supabase
        .from('driver_earnings')
        .select(`
          *,
          order:orders(
            order_number,
            created_at,
            business:businesses(name)
          )
        `)
        .eq('driver_id', driverId)
        .gte('created_at', `${year}-${month.toString().padStart(2, '0')}-01`)
        .lt('created_at', `${year}-${(month + 1).toString().padStart(2, '0')}-01`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des gains du mois:', error);
        return { earnings: [], error: error.message };
      }

      return { earnings: data || [] };
    } catch (error) {
      console.error('Erreur lors de la récupération des gains du mois:', error);
      return { earnings: [], error: 'Erreur lors de la récupération des gains du mois' };
    }
  }

  /**
   * Récupérer les statistiques mensuelles d'un driver
   */
  static async getDriverMonthlyStats(
    driverId: string,
    year?: number,
    month?: number
  ): Promise<{ stats: DriverMonthlyStats[]; error?: string }> {
    try {
      let query = supabase
        .from('driver_monthly_stats')
        .select('*')
        .eq('driver_id', driverId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (year && month) {
        query = query.eq('year', year).eq('month', month);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return { stats: [], error: error.message };
      }

      return { stats: data || [] };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { stats: [], error: 'Erreur lors de la récupération des statistiques' };
    }
  }

  /**
   * Récupérer le résumé des gains d'un driver
   */
  static async getDriverEarningsSummary(driverId: string): Promise<{ summary?: DriverEarningsSummary; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('driver_earnings_summary')
        .select('*')
        .eq('driver_id', driverId)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du résumé:', error);
        return { error: error.message };
      }

      return { summary: data };
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé:', error);
      return { error: 'Erreur lors de la récupération du résumé' };
    }
  }

  /**
   * Récupérer les gains d'un driver pour une période donnée
   */
  static async getDriverEarningsByPeriod(
    driverId: string,
    startDate: string,
    endDate: string
  ): Promise<{ earnings: DriverEarning[]; totalEarnings: number; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('driver_earnings')
        .select(`
          *,
          order:orders(
            order_number,
            created_at,
            business:businesses(name)
          )
        `)
        .eq('driver_id', driverId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des gains par période:', error);
        return { earnings: [], totalEarnings: 0, error: error.message };
      }

      const totalEarnings = data?.reduce((sum, earning) => sum + earning.driver_earnings, 0) || 0;

      return { earnings: data || [], totalEarnings };
    } catch (error) {
      console.error('Erreur lors de la récupération des gains par période:', error);
      return { earnings: [], totalEarnings: 0, error: 'Erreur lors de la récupération des gains par période' };
    }
  }

  /**
   * Formater le montant en GNF
   */
  static formatEarnings(amount: number): string {
    return amount.toLocaleString('fr-FR') + ' GNF';
  }

  /**
   * Calculer les gains estimés pour une commande
   */
  static getEstimatedEarnings(deliveryFee: number): {
    driverEarnings: number;
    percentage: number;
    formattedAmount: string;
  } {
    const percentage = 0.40;
    const driverEarnings = this.calculateEarnings(deliveryFee, percentage);
    
    return {
      driverEarnings,
      percentage,
      formattedAmount: this.formatEarnings(driverEarnings)
    };
  }

  /**
   * Récupérer les statistiques de performance d'un driver
   */
  static async getDriverPerformanceStats(driverId: string): Promise<{
    stats: {
      totalEarnings: number;
      totalOrders: number;
      averageEarningsPerOrder: number;
      currentMonthEarnings: number;
      currentMonthOrders: number;
      bestMonth: { year: number; month: number; earnings: number } | null;
    };
    error?: string;
  }> {
    try {
      // Récupérer le résumé
      const { summary, error: summaryError } = await this.getDriverEarningsSummary(driverId);
      if (summaryError) {
        return { stats: this.getDefaultStats(), error: summaryError };
      }

      // Récupérer les statistiques mensuelles pour trouver le meilleur mois
      const { stats: monthlyStats, error: monthlyError } = await this.getDriverMonthlyStats(driverId);
      if (monthlyError) {
        return { stats: this.getDefaultStats(), error: monthlyError };
      }

      const bestMonth = monthlyStats.length > 0 
        ? monthlyStats.reduce((best, current) => 
            current.total_earnings > best.total_earnings ? current : best
          )
        : null;

      const stats = {
        totalEarnings: summary?.total_earnings || 0,
        totalOrders: summary?.total_orders_completed || 0,
        averageEarningsPerOrder: summary?.lifetime_avg_earnings_per_order || 0,
        currentMonthEarnings: summary?.current_month_earnings || 0,
        currentMonthOrders: summary?.current_month_orders || 0,
        bestMonth: bestMonth ? {
          year: bestMonth.year,
          month: bestMonth.month,
          earnings: bestMonth.total_earnings
        } : null
      };

      return { stats };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de performance:', error);
      return { stats: this.getDefaultStats(), error: 'Erreur lors de la récupération des statistiques' };
    }
  }

  /**
   * Statistiques par défaut
   */
  private static getDefaultStats() {
    return {
      totalEarnings: 0,
      totalOrders: 0,
      averageEarningsPerOrder: 0,
      currentMonthEarnings: 0,
      currentMonthOrders: 0,
      bestMonth: null
    };
  }
}
