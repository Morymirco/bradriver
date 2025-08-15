import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Button, Input } from '../components';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';
import { DriverRegistrationData } from '../services/driverAuthService';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#FFFFFF';
const RED = '#E31837';
const DARK_HEADER = '#23262F';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState<DriverRegistrationData>({
    email: '',
    phone: '',
    name: '',
    password: '',
    driver_type: 'independent',
    vehicle_type: '',
    vehicle_plate: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focus, setFocus] = useState<'email' | 'phone' | 'name' | 'password' | 'confirmPassword' | 'vehicle_type' | 'vehicle_plate' | null>(null);

  const updateFormData = (field: keyof DriverRegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    // Validation des champs
    if (!formData.email || !formData.phone || !formData.name || !formData.password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (formData.password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide.');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signUp(formData);
      
      if (error) {
        console.error('Erreur d\'inscription:', error);
        Alert.alert('Erreur d\'inscription', error.message || 'Erreur lors de l\'inscription');
      } else {
        Alert.alert(
          'Inscription réussie',
          'Votre compte a été créé avec succès. Vérifiez votre email pour confirmer votre compte.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => navigation.goBack()}
              >
                <MaterialIcons name="arrow-back" size={24} color={DARK_TEXT} />
              </TouchableOpacity>
              <Text style={styles.logo}>BraPrime</Text>
              <Text style={styles.subtitle}>Inscription Driver</Text>
            </View>

            {/* Register Form */}
            <View style={styles.formCard}>
              <Text style={styles.title}>Créer un compte</Text>
              <Text style={styles.description}>
                Rejoignez notre équipe de chauffeurs
              </Text>

              {/* Nom complet */}
              <Input
                label="Nom complet"
                placeholder="Votre nom complet"
                placeholderTextColor="#888"
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                autoCapitalize="words"
                containerStyle={[
                  styles.inputContainer,
                  focus === 'name' && styles.inputContainerFocus
                ]}
                inputStyle={styles.inputText}
                onFocus={() => setFocus('name')}
                onBlur={() => setFocus(null)}
                leftIcon={<MaterialIcons name="person" size={22} color={focus === 'name' ? RED : '#888'} />}
              />

              {/* Email */}
              <Input
                label="Email"
                placeholder="votre.email@example.com"
                placeholderTextColor="#888"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                containerStyle={[
                  styles.inputContainer,
                  focus === 'email' && styles.inputContainerFocus
                ]}
                inputStyle={styles.inputText}
                onFocus={() => setFocus('email')}
                onBlur={() => setFocus(null)}
                leftIcon={<MaterialIcons name="email" size={22} color={focus === 'email' ? RED : '#888'} />}
              />

              {/* Téléphone */}
              <Input
                label="Téléphone"
                placeholder="+33 6 12 34 56 78"
                placeholderTextColor="#888"
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                keyboardType="phone-pad"
                containerStyle={[
                  styles.inputContainer,
                  focus === 'phone' && styles.inputContainerFocus
                ]}
                inputStyle={styles.inputText}
                onFocus={() => setFocus('phone')}
                onBlur={() => setFocus(null)}
                leftIcon={<MaterialIcons name="phone" size={22} color={focus === 'phone' ? RED : '#888'} />}
              />

              {/* Type de véhicule */}
              <Input
                label="Type de véhicule (optionnel)"
                placeholder="Ex: Scooter, Voiture, Moto"
                placeholderTextColor="#888"
                value={formData.vehicle_type}
                onChangeText={(value) => updateFormData('vehicle_type', value)}
                containerStyle={[
                  styles.inputContainer,
                  focus === 'vehicle_type' && styles.inputContainerFocus
                ]}
                inputStyle={styles.inputText}
                onFocus={() => setFocus('vehicle_type')}
                onBlur={() => setFocus(null)}
                leftIcon={<MaterialIcons name="directions-car" size={22} color={focus === 'vehicle_type' ? RED : '#888'} />}
              />

              {/* Plaque d'immatriculation */}
              <Input
                label="Plaque d'immatriculation (optionnel)"
                placeholder="Ex: AB-123-CD"
                placeholderTextColor="#888"
                value={formData.vehicle_plate}
                onChangeText={(value) => updateFormData('vehicle_plate', value)}
                autoCapitalize="characters"
                containerStyle={[
                  styles.inputContainer,
                  focus === 'vehicle_plate' && styles.inputContainerFocus
                ]}
                inputStyle={styles.inputText}
                onFocus={() => setFocus('vehicle_plate')}
                onBlur={() => setFocus(null)}
                leftIcon={<MaterialIcons name="confirmation-number" size={22} color={focus === 'vehicle_plate' ? RED : '#888'} />}
              />

              {/* Mot de passe */}
              <Input
                label="Mot de passe"
                placeholder="Votre mot de passe"
                placeholderTextColor="#888"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                containerStyle={[
                  styles.inputContainer,
                  focus === 'password' && styles.inputContainerFocus
                ]}
                inputStyle={styles.inputText}
                onFocus={() => setFocus('password')}
                onBlur={() => setFocus(null)}
                leftIcon={<MaterialIcons name="lock" size={22} color={focus === 'password' ? RED : '#888'} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                    <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={22} color="#888" />
                  </TouchableOpacity>
                }
              />

              {/* Confirmation mot de passe */}
              <Input
                label="Confirmer le mot de passe"
                placeholder="Confirmez votre mot de passe"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                containerStyle={[
                  styles.inputContainer,
                  focus === 'confirmPassword' && styles.inputContainerFocus
                ]}
                inputStyle={styles.inputText}
                onFocus={() => setFocus('confirmPassword')}
                onBlur={() => setFocus(null)}
                leftIcon={<MaterialIcons name="lock" size={22} color={focus === 'confirmPassword' ? RED : '#888'} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)}>
                    <MaterialIcons name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={22} color="#888" />
                  </TouchableOpacity>
                }
              />

              <Button
                title="Créer mon compte"
                onPress={handleRegister}
                loading={loading}
                style={styles.registerButton}
              />

              <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                Déjà un compte ? Se connecter
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                © 2024 BraPrime. Tous droits réservés.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: RED,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK_TEXT,
  },
  formCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 18,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: DARK_TEXT,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 50,
  },
  inputContainerFocus: {
    borderColor: RED,
  },
  inputText: {
    color: '#222',
    fontSize: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  registerButton: {
    marginTop: 12,
    backgroundColor: RED,
    borderRadius: 8,
  },
  loginLink: {
    fontSize: 15,
    color: RED,
    textAlign: 'center',
    marginTop: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: DARK_TEXT,
    marginTop: 24,
  },
}); 