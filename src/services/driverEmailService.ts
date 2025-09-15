import { API_CONFIG } from '../config/env';

export interface EmailNotificationData {
  driver_id: string;
  driver_email: string;
  driver_name: string;
  notification_type: 'order_assigned' | 'order_update' | 'payment_received' | 'system_notification';
  order_id?: string;
  order_number?: string;
  business_name?: string;
  customer_name?: string;
  delivery_address?: string;
  amount?: number;
  message?: string;
  subject: string;
}

export class DriverEmailService {
  // Envoyer une notification par email au driver
  static async sendEmailNotification(data: EmailNotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Envoi notification email driver:', {
        driver_id: data.driver_id,
        type: data.notification_type,
        subject: data.subject
      });

      // Appeler l'API backend pour envoyer l'email
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DRIVER_NOTIFICATION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driver_email: data.driver_email,
          driver_name: data.driver_name,
          notification_type: data.notification_type,
          order_id: data.order_id,
          order_number: data.order_number,
          business_name: data.business_name,
          customer_name: data.customer_name,
          delivery_address: data.delivery_address,
          amount: data.amount,
          message: data.message,
          subject: data.subject
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de l\'email');
      }

      const result = await response.json();
      console.log('✅ Email envoyé avec succès:', result);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur envoi email driver:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  // Notifier l'assignation d'une commande
  static async notifyOrderAssigned(
    driverId: string,
    driverEmail: string,
    driverName: string,
    orderId: string,
    orderNumber: string,
    businessName: string,
    customerName: string,
    deliveryAddress: string
  ): Promise<void> {
    await this.sendEmailNotification({
      driver_id: driverId,
      driver_email: driverEmail,
      driver_name: driverName,
      notification_type: 'order_assigned',
      order_id: orderId,
      order_number: orderNumber,
      business_name: businessName,
      customer_name: customerName,
      delivery_address: deliveryAddress,
      subject: `Nouvelle commande assignée - ${orderNumber}`,
      message: `Une nouvelle commande vous a été assignée. Veuillez vous rendre au restaurant ${businessName} pour récupérer la commande.`
    });
  }

  // Notifier une mise à jour de commande
  static async notifyOrderUpdate(
    driverId: string,
    driverEmail: string,
    driverName: string,
    orderId: string,
    orderNumber: string,
    status: string
  ): Promise<void> {
    await this.sendEmailNotification({
      driver_id: driverId,
      driver_email: driverEmail,
      driver_name: driverName,
      notification_type: 'order_update',
      order_id: orderId,
      order_number: orderNumber,
      subject: `Mise à jour commande - ${orderNumber}`,
      message: `Le statut de votre commande ${orderNumber} a été mis à jour vers: ${status}`
    });
  }

  // Notifier un paiement reçu
  static async notifyPaymentReceived(
    driverId: string,
    driverEmail: string,
    driverName: string,
    amount: number,
    orderNumber?: string
  ): Promise<void> {
    await this.sendEmailNotification({
      driver_id: driverId,
      driver_email: driverEmail,
      driver_name: driverName,
      notification_type: 'payment_received',
      order_number: orderNumber,
      amount: amount,
      subject: `Paiement reçu - ${amount.toFixed(2)}€`,
      message: `Vous avez reçu un paiement de ${amount.toFixed(2)}€${orderNumber ? ` pour la commande ${orderNumber}` : ''}.`
    });
  }

  // Notifier une notification système
  static async notifySystemMessage(
    driverId: string,
    driverEmail: string,
    driverName: string,
    subject: string,
    message: string
  ): Promise<void> {
    await this.sendEmailNotification({
      driver_id: driverId,
      driver_email: driverEmail,
      driver_name: driverName,
      notification_type: 'system_notification',
      subject: subject,
      message: message
    });
  }
}
