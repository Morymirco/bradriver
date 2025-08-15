import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useNavigation, StackActions } from '@react-navigation/native';

const DARK_BG = '#181A20';
const DARK_CARD = '#23262F';
const DARK_TEXT = '#fff';
const RED = '#E31837';
const DARK_HEADER = '#23262F';
const WHITE = '#fff';

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.dispatch(StackActions.replace('Login'));
    }, 1000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>BraPrime </Text>
        <Text style={styles.logoText2}>Driver</Text>
      </View>
      {/* Made in Conakry text */}
      <View style={styles.madeInContainer}>
        <View style={styles.madeInWrapper}>
          <Text style={styles.madeInText}>Made in Conakry with ❤️</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: RED,
    fontFamily: 'System',
  },
  logoText2: {
    fontSize: 26,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'System',
  },
  madeInContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  madeInWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  madeInText: {
    fontSize: 16,
    color: WHITE,
    fontFamily: 'System',
  },
}); 