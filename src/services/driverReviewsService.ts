import { supabase } from '../lib/supabase';

export interface DriverReview {
  id: string;
  driver_id: string;
  order_id: string;
  customer_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  customer_name?: string;
}

export interface DriverReviewStats {
  driver_id: string;
  rating: number;
  total_deliveries: number;
  review_count: number;
  rating_distribution: {
    '5_stars': number;
    '4_stars': number;
    '3_stars': number;
    '2_stars': number;
    '1_star': number;
  };
}

export interface CreateReviewParams {
  driver_id: string;
  order_id: string;
  customer_id: string;
  rating: number;
  comment?: string;
}

export interface GetReviewsParams {
  driver_id: string;
  limit?: number;
  offset?: number;
}

export class DriverReviewsService {
  /**
   * Créer un avis pour un livreur
   */
  static async createReview(params: CreateReviewParams): Promise<{
    success: boolean;
    review_id?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('create_driver_review', {
        p_driver_id: params.driver_id,
        p_order_id: params.order_id,
        p_customer_id: params.customer_id,
        p_rating: params.rating,
        p_comment: params.comment || null
      });

      if (error) {
        console.error('Erreur lors de la création de l\'avis:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const result = data as any;
      
      if (result.success) {
        return {
          success: true,
          review_id: result.review_id
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'avis:', error);
      return {
        success: false,
        error: 'Erreur lors de la création de l\'avis'
      };
    }
  }

  /**
   * Récupérer les avis d'un livreur
   */
  static async getDriverReviews(params: GetReviewsParams): Promise<{
    success: boolean;
    reviews?: DriverReview[];
    total_count?: number;
    average_rating?: number;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_driver_reviews', {
        p_driver_id: params.driver_id,
        p_limit: params.limit || 20,
        p_offset: params.offset || 0
      });

      if (error) {
        console.error('Erreur lors de la récupération des avis:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const result = data as any;
      
      if (result.success) {
        return {
          success: true,
          reviews: result.reviews || [],
          total_count: result.total_count || 0,
          average_rating: result.average_rating || 0
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des avis:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des avis'
      };
    }
  }

  /**
   * Récupérer les statistiques d'un livreur
   */
  static async getDriverStats(driverId: string): Promise<{
    success: boolean;
    stats?: DriverReviewStats;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_driver_review_stats', {
        p_driver_id: driverId
      });

      if (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const result = data as any;
      
      if (result.success) {
        return {
          success: true,
          stats: result.stats
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      };
    }
  }

  /**
   * Mettre à jour les statistiques d'un livreur
   */
  static async updateDriverStats(driverId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase.rpc('update_driver_stats', {
        driver_uuid: driverId
      });

      if (error) {
        console.error('Erreur lors de la mise à jour des statistiques:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statistiques:', error);
      return {
        success: false,
        error: 'Erreur lors de la mise à jour des statistiques'
      };
    }
  }

  /**
   * Supprimer un avis
   */
  static async deleteReview(reviewId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('driver_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        console.error('Erreur lors de la suppression de l\'avis:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'avis:', error);
      return {
        success: false,
        error: 'Erreur lors de la suppression de l\'avis'
      };
    }
  }

  /**
   * Modifier un avis
   */
  static async updateReview(
    reviewId: string, 
    rating: number, 
    comment?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('driver_reviews')
        .update({
          rating,
          comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) {
        console.error('Erreur lors de la modification de l\'avis:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Erreur lors de la modification de l\'avis:', error);
      return {
        success: false,
        error: 'Erreur lors de la modification de l\'avis'
      };
    }
  }

  /**
   * Vérifier si un client peut laisser un avis pour une commande
   */
  static async canLeaveReview(orderId: string, customerId: string): Promise<{
    can_review: boolean;
    reason?: string;
    order?: any;
  }> {
    try {
      // Vérifier si la commande existe et est livrée
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', customerId)
        .eq('status', 'delivered')
        .single();

      if (orderError || !order) {
        return {
          can_review: false,
          reason: 'Commande non trouvée ou non livrée'
        };
      }

      // Vérifier s'il y a déjà un avis pour cette commande
      const { data: existingReview, error: reviewError } = await supabase
        .from('driver_reviews')
        .select('id')
        .eq('order_id', orderId)
        .single();

      if (reviewError && reviewError.code !== 'PGRST116') { // PGRST116 = no rows found
        return {
          can_review: false,
          reason: 'Erreur lors de la vérification des avis existants'
        };
      }

      if (existingReview) {
        return {
          can_review: false,
          reason: 'Un avis existe déjà pour cette commande'
        };
      }

      return {
        can_review: true,
        order
      };
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      return {
        can_review: false,
        reason: 'Erreur lors de la vérification'
      };
    }
  }

  /**
   * Formater la note pour l'affichage
   */
  static formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  /**
   * Obtenir le texte de la note
   */
  static getRatingText(rating: number): string {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Très bien';
    if (rating >= 3.5) return 'Bien';
    if (rating >= 3.0) return 'Correct';
    if (rating >= 2.5) return 'Moyen';
    if (rating >= 2.0) return 'Passable';
    if (rating >= 1.5) return 'Médiocre';
    return 'Très mauvais';
  }

  /**
   * Obtenir la couleur de la note
   */
  static getRatingColor(rating: number): string {
    if (rating >= 4.0) return '#4CAF50'; // Vert
    if (rating >= 3.0) return '#FF9800'; // Orange
    if (rating >= 2.0) return '#FF5722'; // Rouge-orange
    return '#F44336'; // Rouge
  }
}
