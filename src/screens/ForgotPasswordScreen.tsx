import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Input, Button } from '../components';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#fff';
const RED = '#E31837';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez entrer votre email.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={26} color={DARK_TEXT} />
        </TouchableOpacity>
        <Text style={styles.title}>Mot de passe oublié</Text>
        {sent ? (
          <View style={styles.confirmContainer}>
            <MaterialIcons name="mark-email-read" size={64} color={RED} style={{marginBottom: 16}} />
            <Text style={styles.confirmText}>Un email de réinitialisation a été envoyé à :</Text>
            <Text style={styles.confirmEmail}>{email}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>Entrez votre email pour recevoir un lien de réinitialisation.</Text>
            <Input
              label="Email"
              placeholder="votre.email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              title="Envoyer le lien"
              onPress={handleReset}
              loading={loading}
              style={styles.button}
            />
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: DARK_TEXT,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
    backgroundColor: RED,
    borderRadius: 8,
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    color: RED,
    fontWeight: '600',
    fontSize: 15,
  },
  confirmContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  confirmText: {
    color: DARK_TEXT,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmEmail: {
    color: RED,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
}); 