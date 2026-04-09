import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ClientesScreen from '../screens/ClientesScreen';
import ProductosScreen from '../screens/ProductosScreen';
import CompraScreen from '../screens/CompraScreen';
import MisComprasScreen from '../screens/MisComprasScreen';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
          borderTopLeftRadius: RADIUS.lg,
          borderTopRightRadius: RADIUS.lg,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Inicio: ['home', 'home-outline'],
            Clientes: ['people', 'people-outline'],
            Compra: ['cart', 'cart-outline'],
            Productos: ['cube', 'cube-outline'],
            MisCompras: ['receipt', 'receipt-outline'],
          };
          const [active, inactive] = icons[route.name] || ['help', 'help-outline'];
          const iconName = focused ? active : inactive;

          if (route.name === 'Compra') {
            return (
              <View style={{
                width: 50, height: 50, borderRadius: 25,
                backgroundColor: focused ? COLORS.primary : COLORS.primaryLight,
                alignItems: 'center', justifyContent: 'center',
                marginTop: -20,
                ...SHADOWS.md,
              }}>
                <Ionicons name={iconName as any} size={26} color="white" />
              </View>
            );
          }

          return <Ionicons name={iconName as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="Clientes" component={ClientesScreen} options={{ tabBarLabel: 'Clientes' }} />
      <Tab.Screen name="Compra" component={CompraScreen} options={{ tabBarLabel: 'Comprar' }} />
      <Tab.Screen name="Productos" component={ProductosScreen} options={{ tabBarLabel: 'Productos' }} />
      <Tab.Screen name="MisCompras" component={MisComprasScreen} options={{ tabBarLabel: 'Historial' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
