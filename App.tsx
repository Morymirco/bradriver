import React from 'react';
import { StatusBar } from 'react-native';
import { OffersProvider } from './src/components/OffersContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation';

export default function App() {
  return (
    <AuthProvider>
      <OffersProvider>
        <StatusBar barStyle="light-content" backgroundColor="#181A20" />
        <AppNavigator />
      </OffersProvider>
    </AuthProvider>
  );
}
