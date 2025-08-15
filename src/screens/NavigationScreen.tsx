import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation';

const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#FFFFFF';
const RED = '#E31837';
const DARK_HEADER = '#23262F';
const DARK_GRAY = '#6B7280';
const LIGHT_GRAY = '#9CA3AF';

type MapOption = 'google' | 'apple';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const NavigationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedMap, setSelectedMap] = useState<MapOption>('google');
  const [showMapModal, setShowMapModal] = useState(false);

  const handleOpenMap = (mapType: MapOption) => {
    setSelectedMap(mapType);
    // Ici vous pouvez ouvrir l'application de carte sélectionnée
    console.log(`Ouvrir ${mapType} Maps`);
    // Exemple: Linking.openURL(`https://maps.google.com/maps?q=${destination}`);
  };

  const handleSaveMapPreference = () => {
    setShowMapModal(false);
    // Sauvegarder la préférence de carte
    console.log('Carte par défaut:', selectedMap);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={26} color={DARK_TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Navigation</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowMapModal(true)}>
          <MaterialIcons name="settings" size={24} color={DARK_TEXT} />
        </TouchableOpacity>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <MaterialIcons name="map" size={64} color={LIGHT_GRAY} />
          <Text style={styles.mapPlaceholderText}>Carte de navigation</Text>
          <Text style={styles.mapPlaceholderSubtext}>Adresse de livraison</Text>
        </View>
      </View>

      {/* Navigation Info */}
      <View style={styles.navigationInfo}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="#10B981" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Point de départ</Text>
              <Text style={styles.infoText}>Pizza Bella, 123 Rue de la Paix</Text>
            </View>
          </View>
          
          <View style={styles.routeLine} />
          
          <View style={styles.infoRow}>
            <MaterialIcons name="home" size={20} color={RED} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Destination</Text>
              <Text style={styles.infoText}>456 Avenue des Champs, 75008 Paris</Text>
            </View>
          </View>
        </View>

        <View style={styles.routeStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2.3 km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>8 min</Text>
            <Text style={styles.statLabel}>Temps estimé</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>CMD-001</Text>
            <Text style={styles.statLabel}>Commande</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.mapButton} 
          onPress={() => navigation.navigate('GoogleMap' as never)}
        >
          <MaterialIcons name="navigation" size={24} color={DARK_TEXT} />
          <Text style={styles.mapButtonText}>Ouvrir Google Maps</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('OrderDetail', { orderId: 'CMD-001' })}
        >
          <MaterialIcons name="receipt" size={20} color={RED} />
          <Text style={styles.secondaryButtonText}>Voir les détails</Text>
        </TouchableOpacity>
      </View>

      {/* Map Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMapModal}
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <Text style={styles.modalTitle}>Application de carte par défaut</Text>
            <Text style={styles.modalSubtitle}>Sera ouverte pour afficher l'adresse de la commande</Text>

            {/* Map Options */}
            <View style={styles.optionsContainer}>
              {/* Google Maps Option */}
              <TouchableOpacity 
                style={styles.optionRow}
                onPress={() => setSelectedMap('google')}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.mapIconContainer}>
                    <MaterialIcons name="map" size={24} color="#4285F4" />
                  </View>
                  <Text style={styles.optionText}>Google Maps</Text>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedMap === 'google' && styles.radioButtonSelected
                ]} />
              </TouchableOpacity>

              {/* Apple Maps Option */}
              <TouchableOpacity 
                style={styles.optionRow}
                onPress={() => setSelectedMap('apple')}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.mapIconContainer}>
                    <MaterialIcons name="map" size={24} color="#007AFF" />
                  </View>
                  <Text style={styles.optionText}>Apple Maps</Text>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedMap === 'apple' && styles.radioButtonSelected
                ]} />
              </TouchableOpacity>
            </View>

            {/* Save Button */}
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveMapPreference}
            >
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: DARK_HEADER,
    borderBottomWidth: 1,
    borderBottomColor: DARK_GRAY,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  settingsBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: DARK_CARD,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DARK_CARD,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK_TEXT,
    marginTop: 16,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: LIGHT_GRAY,
    marginTop: 4,
  },
  navigationInfo: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: LIGHT_GRAY,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    color: DARK_TEXT,
    fontWeight: '500',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: DARK_GRAY,
    marginLeft: 9,
    marginVertical: 4,
  },
  routeStats: {
    flexDirection: 'row',
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: RED,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: LIGHT_GRAY,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: DARK_GRAY,
    marginHorizontal: 12,
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 8,
  },
  mapButtonText: {
    color: DARK_TEXT,
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: RED,
  },
  secondaryButtonText: {
    color: RED,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DARK_CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: DARK_GRAY,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: LIGHT_GRAY,
    marginBottom: 24,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DARK_GRAY,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: DARK_HEADER,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: DARK_TEXT,
    fontWeight: '500',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DARK_GRAY,
  },
  radioButtonSelected: {
    borderColor: RED,
    backgroundColor: RED,
  },
  saveButton: {
    backgroundColor: RED,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    color: DARK_TEXT,
    fontSize: 16,
    fontWeight: '700',
  },
}); 