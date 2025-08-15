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
} from 'react-native';
import { Button, Input } from '../components';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';
import { ERROR_MESSAGES } from '../config/env';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#FFFFFF';
const RED = '#E31837';
const DARK_HEADER = '#23262F';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('chauffeur@braprime.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focus, setFocus] = useState<'email' | 'password' | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('Erreur de connexion:', error);
        Alert.alert('Erreur de connexion', error.message || 'Identifiants invalides');
      } else {
        // La navigation sera gérée automatiquement par le contexte d'authentification
        console.log('Connexion réussie');
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
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>BraPrime</Text>
            <Text style={styles.subtitle}>Driver App</Text>
          </View>
          {/* Login Form */}
          <View style={styles.formCard}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.description}>
              Connectez-vous à votre compte chauffeur
            </Text>
            {/* Email Input amélioré */}
            <Input
              label="Email"
              placeholder="votre.email@example.com"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
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
            {/* Mot de passe Input amélioré */}
            <Input
              label="Mot de passe"
              placeholder="Votre mot de passe"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
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
            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />
            <Text style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
              Mot de passe oublié ?
            </Text>
            <Text style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
              Pas encore de compte ? S'inscrire
            </Text>
          </View>
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2024 BraPrime. Tous droits réservés.
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  loginButton: {
    marginTop: 12,
    backgroundColor: RED,
    borderRadius: 8,
  },
  loginButtonText: {
    color: DARK_TEXT,
    fontWeight: 'bold',
    fontSize: 16,
  },
  forgotPassword: {
    fontSize: 15,
    color: RED,
    textAlign: 'center',
    marginTop: 18,
    fontWeight: '600',
  },
  registerLink: {
    fontSize: 15,
    color: RED,
    textAlign: 'center',
    marginTop: 12,
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