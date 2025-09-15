import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useOffers } from '../components/OffersContext';
import { useAuth } from '../contexts/AuthContext';
import { useDriver } from '../hooks/useDriver';
import { RootStackParamList } from '../navigation';
import { DriverEarningsService } from '../services/driverEarningsService';
import { ProfileService } from '../services/profileService';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/men/32.jpg';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type PanelType = 'main' | 'edit' | 'documents' | 'support' | 'delete';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { acceptedOffers } = useOffers();
  const { driver, signOut, refreshDriver } = useAuth();
  const { updateProfile, loading } = useDriver();
  const [selectedPanel, setSelectedPanel] = useState<PanelType>('main');
  
  // États pour la modification du profil
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone_number: '',
    vehicle_type: '',
    vehicle_plate: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [earningsSummary, setEarningsSummary] = useState<any>(null);

  const handlePanelChange = (panel: PanelType) => {
    setSelectedPanel(panel);
  };

  const handleBack = () => {
    setSelectedPanel('main');
  };

  // Charger les données du profil
  useEffect(() => {
    if (driver) {
      setProfileData({
        name: driver.name || '',
        email: driver.email || '',
        phone_number: driver.phone_number || '',
        vehicle_type: driver.vehicle_type || '',
        vehicle_plate: driver.vehicle_plate || ''
      });
    }
  }, [driver]);

  // Charger les statistiques des gains
  const loadEarningsSummary = async () => {
    if (!driver?.id) return;
    
    try {
      const { summary } = await DriverEarningsService.getDriverEarningsSummary(driver.id);
      setEarningsSummary(summary);
    } catch (error) {
      console.error('Erreur lors du chargement des gains:', error);
    }
  };

  // Charger les gains au montage
  useEffect(() => {
    loadEarningsSummary();
  }, [driver?.id]);

  // Gérer l'upload d'avatar
  const handleAvatarUpload = async () => {
    if (!driver?.id) return;

    Alert.alert(
      'Changer l\'avatar',
      'Choisissez une option',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Galerie',
          onPress: async () => {
            setIsUploadingAvatar(true);
            try {
              const imageUri = await ProfileService.pickImage();
              if (imageUri) {
                await uploadAvatarToStorage(imageUri);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
            } finally {
              setIsUploadingAvatar(false);
            }
          }
        },
        {
          text: 'Caméra',
          onPress: async () => {
            setIsUploadingAvatar(true);
            try {
              const imageUri = await ProfileService.takePhoto();
              if (imageUri) {
                await uploadAvatarToStorage(imageUri);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de prendre la photo');
            } finally {
              setIsUploadingAvatar(false);
            }
          }
        }
      ]
    );
  };

  // Upload l'avatar vers le storage
  const uploadAvatarToStorage = async (imageUri: string) => {
    if (!driver?.id) return;

    try {
      console.log('🔍 Début upload avatar vers storage...');
      console.log('🔍 URI de l\'image:', imageUri);
      
      // Supprimer l'ancien avatar si il existe
      if (driver.avatar_url) {
        console.log('🔍 Suppression de l\'ancien avatar...');
        await ProfileService.deleteOldAvatar(driver.avatar_url);
      }

      // Upload le nouvel avatar
      console.log('🔍 Upload du nouvel avatar...');
      const result = await ProfileService.uploadAvatar(imageUri, driver.id);
      
      if (result.error) {
        console.error('❌ Erreur upload:', result.error);
        Alert.alert('Erreur', result.error);
        return;
      }

      console.log('✅ Upload réussi, URL:', result.url);

      // Mettre à jour le profil avec la nouvelle URL
      console.log('🔍 Mise à jour du profil...');
      const updateResult = await ProfileService.updateProfile(driver.id, {
        avatar_url: result.url
      });

      if (updateResult.success) {
        console.log('✅ Profil mis à jour avec succès');
        Alert.alert('Succès', 'Avatar mis à jour avec succès');
        // Recharger les données du driver
        await refreshDriver();
      } else {
        console.error('❌ Erreur mise à jour profil:', updateResult.error);
        Alert.alert('Erreur', updateResult.error || 'Erreur lors de la mise à jour');
      }

    } catch (error) {
      console.error('❌ Erreur générale:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'avatar');
    }
  };

  // Test de l'upload avec une image de test
  const testUpload = async () => {
    if (!driver?.id) return;
    
    console.log('🔍 Test d\'upload avec image de test...');
    const result = await ProfileService.testUploadWithSampleImage(driver.id);
    
    if (result.success) {
      Alert.alert('Test réussi', `Image de test uploadée: ${result.url}`);
    } else {
      Alert.alert('Test échoué', result.error || 'Erreur lors du test');
    }
  };

  // Sauvegarder les modifications du profil
  const handleSaveProfile = async () => {
    if (!driver?.id) return;

    setIsUpdating(true);
    try {
      const result = await ProfileService.updateProfile(driver.id, profileData);
      
      if (result.success) {
        Alert.alert('Succès', 'Profil mis à jour avec succès');
        setSelectedPanel('main');
        // Recharger les données du driver
        await refreshDriver();
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderMainProfile = () => (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.mainHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#E31837" />
          </TouchableOpacity>
          <Text style={styles.mainHeaderTitle}>Profil</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{uri: driver?.avatar_url || DEFAULT_AVATAR}} 
              style={styles.avatar} 
            />
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={handleAvatarUpload}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
                        <Text style={styles.name}>{driver?.name || 'Livreur'}</Text>
          <Text style={styles.email}>{driver?.email || 'email@example.com'}</Text>
          <Text style={styles.phone}>{driver?.phone_number || '+33 6 12 34 56 78'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {earningsSummary?.total_orders_completed || driver?.total_deliveries || 0}
            </Text>
            <Text style={styles.statLabel}>Livraisons</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{driver?.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {earningsSummary ? 
                DriverEarningsService.formatEarnings(earningsSummary.total_earnings || 0) :
                (driver?.total_earnings?.toLocaleString('fr-FR') || '0') + ' GNF'
              }
            </Text>
            <Text style={styles.statLabel}>Gains</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handlePanelChange('edit')}
          >
            <MaterialIcons name="edit" size={24} color="#E31837" />
            <Text style={styles.actionText}>Modifier le profil</Text>
            <MaterialIcons name="chevron-right" size={24} color="#AAAAAA" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handlePanelChange('documents')}
          >
            <MaterialIcons name="description" size={24} color="#E31837" />
            <Text style={styles.actionText}>Mes documents</Text>
            <MaterialIcons name="chevron-right" size={24} color="#AAAAAA" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handlePanelChange('support')}
          >
            <MaterialIcons name="support-agent" size={24} color="#E31837" />
            <Text style={styles.actionText}>Contacter le support</Text>
            <MaterialIcons name="chevron-right" size={24} color="#AAAAAA" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handlePanelChange('delete')}
          >
            <MaterialIcons name="delete" size={24} color="#EF4444" />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Supprimer le compte</Text>
            <MaterialIcons name="chevron-right" size={24} color="#AAAAAA" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={testUpload}
          >
            <MaterialIcons name="bug-report" size={24} color="#E31837" />
            <Text style={styles.actionText}>Test Upload Avatar</Text>
            <MaterialIcons name="chevron-right" size={24} color="#AAAAAA" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <MaterialIcons name="logout" size={24} color="#FFFFFF" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const renderEditProfile = () => (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.panelHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#E31837" />
          </TouchableOpacity>
          <Text style={styles.panelTitle}>Modifier le profil</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom complet</Text>
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input} 
                placeholder="Nom complet" 
                placeholderTextColor="#888" 
                value={profileData.name}
                onChangeText={(text) => setProfileData({...profileData, name: text})}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input} 
                placeholder="Email" 
                placeholderTextColor="#888" 
                value={profileData.email}
                onChangeText={(text) => setProfileData({...profileData, email: text})}
                keyboardType="email-address" 
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Téléphone</Text>
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input} 
                placeholder="+33 6 12 34 56 78" 
                placeholderTextColor="#888" 
                value={profileData.phone_number}
                onChangeText={(text) => setProfileData({...profileData, phone_number: text})}
                keyboardType="phone-pad"
              />
            </View>
          </View>



          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Type de véhicule</Text>
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: Moto, Voiture, Camion" 
                placeholderTextColor="#888" 
                value={profileData.vehicle_type}
                onChangeText={(text) => setProfileData({...profileData, vehicle_type: text})}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Plaque d'immatriculation</Text>
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: AB-123-CD" 
                placeholderTextColor="#888" 
                value={profileData.vehicle_plate}
                onChangeText={(text) => setProfileData({...profileData, vehicle_plate: text})}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Sauvegarder les modifications</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderDocuments = () => (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.panelHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#E31837" />
          </TouchableOpacity>
          <Text style={styles.panelTitle}>Mes documents</Text>
        </View>

        <View style={styles.documentsContainer}>
          <View style={styles.documentCard}>
            <MaterialIcons name="description" size={40} color="#E31837" />
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>Permis de conduire</Text>
              <Text style={styles.documentStatus}>Validé</Text>
            </View>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
          </View>

          <View style={styles.documentCard}>
            <MaterialIcons name="description" size={40} color="#E31837" />
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>Carte grise</Text>
              <Text style={styles.documentStatus}>En attente</Text>
            </View>
            <MaterialIcons name="pending" size={24} color="#FFC107" />
          </View>

          <View style={styles.documentCard}>
            <MaterialIcons name="description" size={40} color="#E31837" />
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>Assurance</Text>
              <Text style={styles.documentStatus}>À renouveler</Text>
            </View>
            <MaterialIcons name="warning" size={24} color="#EF4444" />
          </View>

          <TouchableOpacity style={styles.uploadButton}>
            <MaterialIcons name="cloud-upload" size={24} color="#FFFFFF" />
            <Text style={styles.uploadButtonText}>Ajouter un document</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderSupport = () => (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.panelHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#E31837" />
          </TouchableOpacity>
          <Text style={styles.panelTitle}>Contacter le support</Text>
        </View>

        <View style={styles.supportContainer}>
          <View style={styles.supportCard}>
            <MaterialIcons name="phone" size={40} color="#E31837" />
            <Text style={styles.supportTitle}>Appeler le support</Text>
            <Text style={styles.supportDescription}>Service client disponible 24h/24</Text>
            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportButtonText}>Appeler maintenant</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.supportCard}>
            <MaterialIcons name="email" size={40} color="#E31837" />
            <Text style={styles.supportTitle}>Envoyer un email</Text>
            <Text style={styles.supportDescription}>Réponse sous 24h</Text>
            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportButtonText}>Composer un email</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.supportCard}>
            <MaterialIcons name="chat" size={40} color="#E31837" />
            <Text style={styles.supportTitle}>Chat en ligne</Text>
            <Text style={styles.supportDescription}>Discussion instantanée</Text>
            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportButtonText}>Démarrer le chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderDeleteAccount = () => (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.panelHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#E31837" />
          </TouchableOpacity>
          <Text style={styles.panelTitle}>Supprimer le compte</Text>
        </View>

        <View style={styles.deleteContainer}>
          <MaterialIcons name="warning" size={80} color="#EF4444" />
          <Text style={styles.deleteTitle}>Attention !</Text>
          <Text style={styles.deleteDescription}>
            Cette action est irréversible. Toutes vos données, livraisons et gains seront définitivement supprimés.
          </Text>

          <View style={styles.deleteWarning}>
            <Text style={styles.deleteWarningTitle}>Ce qui sera supprimé :</Text>
            <Text style={styles.deleteWarningItem}>• Votre profil et informations personnelles</Text>
            <Text style={styles.deleteWarningItem}>• Historique de toutes vos livraisons</Text>
            <Text style={styles.deleteWarningItem}>• Gains et paiements non retirés</Text>
            <Text style={styles.deleteWarningItem}>• Documents et justificatifs</Text>
          </View>

          <TouchableOpacity 
            style={styles.deleteConfirmButton}
            onPress={() => Alert.alert(
              'Confirmation finale',
              'Êtes-vous absolument sûr de vouloir supprimer votre compte ?',
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer définitivement', style: 'destructive' }
              ]
            )}
          >
            <Text style={styles.deleteConfirmButtonText}>Supprimer définitivement mon compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // Rendu conditionnel selon le panel sélectionné
  switch (selectedPanel) {
    case 'edit':
      return renderEditProfile();
    case 'documents':
      return renderDocuments();
    case 'support':
      return renderSupport();
    case 'delete':
      return renderDeleteAccount();
    default:
      return renderMainProfile();
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181A20',
  },
  container: {
    flex: 1,
    backgroundColor: '#181A20',
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#23262F',
    borderBottomWidth: 1,
    borderBottomColor: '#353945',
  },
  backButton: {
    padding: spacing.sm,
  },
  mainHeaderTitle: {
    fontSize: typography.h3,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: '#23262F',
    marginBottom: spacing.md,
    paddingTop: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E31837',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: typography.h2,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: typography.body,
    color: '#AAAAAA',
    marginBottom: spacing.xs,
  },
  phone: {
    fontSize: typography.body,
    color: '#AAAAAA',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statCard: {
    backgroundColor: '#23262F',
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: typography.h3,
    fontWeight: 'bold',
    color: '#E31837',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.caption,
    color: '#FFFFFF',
  },
  actionsContainer: {
    backgroundColor: '#23262F',
    marginHorizontal: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#353945',
  },
  actionText: {
    flex: 1,
    fontSize: typography.body,
    color: '#FFFFFF',
    marginLeft: spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
  },
  logoutText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#23262F',
    borderBottomWidth: 1,
    borderBottomColor: '#353945',
  },
  panelTitle: {
    fontSize: typography.h3,
    fontWeight: 'bold',
    color: '#E31837',
  },
  formContainer: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  inputContainer: {
    backgroundColor: '#23262F',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#353945',
  },
  input: {
    fontSize: typography.body,
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#E31837',
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  documentsContainer: {
    padding: spacing.lg,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23262F',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  documentTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  documentStatus: {
    fontSize: typography.caption,
    color: '#AAAAAA',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E31837',
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  uploadButtonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  supportContainer: {
    padding: spacing.lg,
  },
  supportCard: {
    backgroundColor: '#23262F',
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportTitle: {
    fontSize: typography.h4,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  supportDescription: {
    fontSize: typography.body,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  supportButton: {
    backgroundColor: '#E31837',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  supportButtonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  deleteTitle: {
    fontSize: typography.h2,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  deleteDescription: {
    fontSize: typography.body,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  deleteWarning: {
    backgroundColor: '#181A20',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
    width: '100%',
  },
  deleteWarningTitle: {
    fontSize: typography.body,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: spacing.md,
  },
  deleteWarningItem: {
    fontSize: typography.body,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  deleteConfirmButton: {
    backgroundColor: '#EF4444',
    padding: spacing.lg,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 