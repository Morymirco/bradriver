import React from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation';
import { OffersProvider } from './src/components/OffersContext';
import { AuthProvider } from './src/contexts/AuthContext';

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
