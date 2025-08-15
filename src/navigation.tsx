import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HomeScreen } from './screens/HomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SplashScreen } from './screens/SplashScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { OrderDetailScreen } from './screens/OrderDetailScreen';
import { NavigationScreen } from './screens/NavigationScreen';
import { GoogleMapScreen } from './screens/GoogleMapScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { AvailableOffersScreen } from './screens/AvailableOffersScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { StatisticsScreen } from './screens/StatisticsScreen';
import { ServiceSelectionScreen } from './screens/ServiceSelectionScreen';
import { useAuth } from './contexts/AuthContext';

export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  Profile: undefined;
  Splash: undefined;
  History: undefined;
  OrderDetail: {
    orderId: string;
  };
  Navigation: undefined;
  GoogleMap: undefined;
  ForgotPassword: undefined;
  Calendar: undefined;
  Statistics: undefined;
  ServiceSelection: undefined;
};

export type MainTabParamList = {
  Orders: undefined;
  Offers: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#181A20',
  },
};

// Composant de chargement
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#E31837" />
    <Text style={styles.loadingText}>Chargement...</Text>
  </View>
);

// Navigation par onglets
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          if (route.name === 'Orders') {
            iconName = focused ? 'local-shipping' : 'local-shipping';
          } else if (route.name === 'Offers') {
            iconName = focused ? 'local-offer' : 'local-offer';
          } else {
            iconName = 'help';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#E31837',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#23262F',
          borderTopColor: '#353945',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Orders" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Commandes',
        }}
      />
      <Tab.Screen 
        name="Offers" 
        component={AvailableOffersScreen}
        options={{
          tabBarLabel: 'Offres',
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { session, loading } = useAuth();

  // Afficher l'écran de chargement pendant la vérification de l'authentification
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator 
        initialRouteName={session ? "MainTabs" : "Login"} 
        screenOptions={{ headerShown: false }}
      >
        {session ? (
          // Routes authentifiées
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="Navigation" component={NavigationScreen} />
            <Stack.Screen name="GoogleMap" component={GoogleMapScreen} />
            <Stack.Screen name="Calendar" component={CalendarScreen} />
            <Stack.Screen name="Statistics" component={StatisticsScreen} />
            <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />
          </>
        ) : (
          // Routes non authentifiées
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="Splash" component={SplashScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181A20',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
}); 