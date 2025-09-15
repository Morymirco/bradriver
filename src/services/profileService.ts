import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
  avatar_url?: string;
}

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export class ProfileService {
  /**
   * Upload d'un avatar vers Supabase Storage
   */
  static async uploadAvatar(imageUri: string, driverId: string): Promise<UploadResult> {
    try {
      console.log('🔍 Début upload avatar pour driver:', driverId);
      console.log('🔍 URI de l\'image:', imageUri);
      
      // Générer un nom de fichier unique
      const fileName = `avatar_${driverId}_${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;
      
      console.log('🔍 Nom du fichier:', fileName);
      console.log('🔍 Chemin du fichier:', filePath);

      // Vérifier que l'URI est valide
      if (!imageUri || imageUri.trim() === '') {
        throw new Error('URI de l\'image invalide');
      }

      // Vérifier si c'est une URI de données (data:image/...)
      if (imageUri.startsWith('data:image/')) {
        console.log('🔍 Image en format data URI détectée');
        
        // Convertir data URI en blob
        const base64Data = imageUri.split(',')[1];
        const mimeType = imageUri.split(':')[1].split(';')[0];
        
        console.log('🔍 Type MIME détecté:', mimeType);
        
        // Convertir base64 en blob
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        console.log('🔍 Taille du blob (data URI):', blob.size, 'bytes');
        
        if (blob.size === 0) {
          throw new Error('L\'image data URI est vide (0 bytes)');
        }
        
        // Upload du blob
        const { data, error } = await supabase.storage
          .from('driver-avatars')
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: mimeType
          });

        if (error) {
          console.error('❌ Erreur upload avatar (data URI):', error);
          return { url: '', path: '', error: error.message };
        }

        console.log('✅ Upload réussi (data URI), données:', data);

        // Récupérer l'URL publique
        const { data: urlData } = supabase.storage
          .from('driver-avatars')
          .getPublicUrl(filePath);

        console.log('🔍 URL publique:', urlData.publicUrl);

        return {
          url: urlData.publicUrl,
          path: filePath
        };
      } else {
        // URI de fichier local
        console.log('🔍 Image en format URI de fichier détectée');
        
        // Convertir l'image en blob avec gestion d'erreur améliorée
        console.log('🔍 Conversion de l\'image en blob...');
        const response = await fetch(imageUri);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('🔍 Taille du blob:', blob.size, 'bytes');
        console.log('🔍 Type MIME du blob:', blob.type);

        // Vérifier que le blob n'est pas vide
        if (blob.size === 0) {
          throw new Error('L\'image est vide (0 bytes)');
        }

        // Vérifier le type MIME
        if (!blob.type.startsWith('image/')) {
          throw new Error(`Type de fichier invalide: ${blob.type}`);
        }

        // Upload vers Supabase Storage
        console.log('🔍 Upload vers Supabase Storage...');
        const { data, error } = await supabase.storage
          .from('driver-avatars')
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: blob.type
          });

        if (error) {
          console.error('❌ Erreur upload avatar:', error);
          console.error('❌ Détails de l\'erreur:', JSON.stringify(error, null, 2));
          return { url: '', path: '', error: error.message };
        }

        console.log('✅ Upload réussi, données:', data);

        // Récupérer l'URL publique
        const { data: urlData } = supabase.storage
          .from('driver-avatars')
          .getPublicUrl(filePath);

        console.log('🔍 URL publique:', urlData.publicUrl);

        return {
          url: urlData.publicUrl,
          path: filePath
        };
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error);
      return { 
        url: '', 
        path: '', 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'upload' 
      };
    }
  }

  /**
   * Sélectionner une image depuis la galerie ou la caméra
   */
  static async pickImage(): Promise<string | null> {
    try {
      console.log('🔍 Début sélection d\'image depuis la galerie...');
      
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.error('❌ Permission galerie refusée');
        alert('Permission d\'accès à la galerie requise');
        return null;
      }

      console.log('✅ Permission galerie accordée');

      // Ouvrir le sélecteur d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      console.log('🔍 Résultat sélection:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log('🔍 Image sélectionnée:', selectedImage);
        
        // Vérifier que l'URI existe
        if (selectedImage.uri) {
          console.log('✅ URI de l\'image:', selectedImage.uri);
          return selectedImage.uri;
        } else {
          console.error('❌ URI de l\'image manquant');
          return null;
        }
      }

      console.log('🔍 Aucune image sélectionnée');
      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la sélection d\'image:', error);
      return null;
    }
  }

  /**
   * Prendre une photo avec la caméra
   */
  static async takePhoto(): Promise<string | null> {
    try {
      console.log('🔍 Début prise de photo avec la caméra...');
      
      // Demander les permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        console.error('❌ Permission caméra refusée');
        alert('Permission d\'accès à la caméra requise');
        return null;
      }

      console.log('✅ Permission caméra accordée');

      // Ouvrir la caméra
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      console.log('🔍 Résultat caméra:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const capturedImage = result.assets[0];
        console.log('🔍 Photo capturée:', capturedImage);
        
        // Vérifier que l'URI existe
        if (capturedImage.uri) {
          console.log('✅ URI de la photo:', capturedImage.uri);
          return capturedImage.uri;
        } else {
          console.error('❌ URI de la photo manquant');
          return null;
        }
      }

      console.log('🔍 Aucune photo prise');
      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la prise de photo:', error);
      return null;
    }
  }

  /**
   * Mettre à jour le profil du chauffeur
   */
  static async updateProfile(driverId: string, updateData: ProfileUpdateData): Promise<{ success: boolean; error?: string }> {
    try {
      // Mettre à jour le profil utilisateur
      const userProfileUpdate: any = {};
      if (updateData.name) userProfileUpdate.name = updateData.name;
      if (updateData.email) userProfileUpdate.email = updateData.email;
      if (updateData.phone_number) userProfileUpdate.phone_number = updateData.phone_number;
      if (updateData.address) userProfileUpdate.address = updateData.address;

      if (Object.keys(userProfileUpdate).length > 0) {
        const { error: userError } = await supabase
          .from('user_profiles')
          .update(userProfileUpdate)
          .eq('id', driverId);

        if (userError) {
          throw new Error(userError.message);
        }
      }

      // Mettre à jour le profil chauffeur
      const driverProfileUpdate: any = {};
      if (updateData.name) driverProfileUpdate.name = updateData.name;
      if (updateData.email) driverProfileUpdate.email = updateData.email;
      if (updateData.phone_number) driverProfileUpdate.phone_number = updateData.phone_number;
      if (updateData.vehicle_type) driverProfileUpdate.vehicle_type = updateData.vehicle_type;
      if (updateData.vehicle_plate) driverProfileUpdate.vehicle_plate = updateData.vehicle_plate;
      if (updateData.avatar_url) driverProfileUpdate.avatar_url = updateData.avatar_url;

      if (Object.keys(driverProfileUpdate).length > 0) {
        const { error: driverError } = await supabase
          .from('driver_profiles')
          .update(driverProfileUpdate)
          .eq('id', driverId);

        if (driverError) {
          throw new Error(driverError.message);
        }
      }

      return { success: true };

    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour' 
      };
    }
  }

  /**
   * Supprimer l'ancien avatar si il existe
   */
  static async deleteOldAvatar(avatarPath: string): Promise<void> {
    try {
      if (avatarPath && avatarPath.includes('driver-avatars/')) {
        const fileName = avatarPath.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('driver-avatars')
            .remove([fileName]);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'ancien avatar:', error);
    }
  }

  /**
   * Récupérer le profil complet du chauffeur
   */
  static async getProfile(driverId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('driver_profiles')
        .select(`
          *,
          user_profiles!inner(
            id,
            name,
            email,
            phone_number,
            address,
            is_verified
          )
        `)
        .eq('id', driverId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  }

  /**
   * Tester la connexion au bucket de stockage
   */
  static async testStorageConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 Test de connexion au bucket driver-avatars...');
      
      // Lister les fichiers dans le bucket
      const { data, error } = await supabase.storage
        .from('driver-avatars')
        .list('', {
          limit: 1
        });

      if (error) {
        console.error('❌ Erreur de connexion au bucket:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Connexion au bucket réussie');
      console.log('🔍 Contenu du bucket:', data);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors du test de connexion:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur de connexion' 
      };
    }
  }

  /**
   * Tester l'upload avec une image de test
   */
  static async testUploadWithSampleImage(driverId: string): Promise<{ success: boolean; error?: string; url?: string }> {
    try {
      console.log('🔍 Test d\'upload avec image de test...');
      
      // Créer une image de test plus robuste (10x10 pixel PNG avec couleur)
      const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QjY0NjdGNjM5QjA1MTFFQjg3QjRGMjM2N0Y1N0Y1N0Y1IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkI2NDY3RjY0OUIwNTExRUI4N0I0RjIzNjdGNjdGNjdGNiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkI2NDY3RjYxOUIwNTExRUI4N0I0RjIzNjdGNjdGNjdGNiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCNjQ2N0Y2MjlCMDUxMUVCODdCNEYyMzY3RjY3RjY3RjYiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4B//79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPTk1MS0pJSEdGRURDQkFAPz49PDs6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgUEAwIBAAAh+QQAAAAAACwAAAAACgAKAAACBZQjmIAFADs=';
      
      console.log('🔍 Image de test créée, taille base64:', testImageData.length);
      
      const result = await this.uploadAvatar(testImageData, driverId);
      
      if (result.error) {
        console.error('❌ Erreur lors du test d\'upload:', result.error);
        return { success: false, error: result.error };
      }
      
      console.log('✅ Test d\'upload réussi:', result.url);
      return { success: true, url: result.url };
    } catch (error) {
      console.error('❌ Erreur lors du test d\'upload:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur de test d\'upload' 
      };
    }
  }
}
