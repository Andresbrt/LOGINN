import { Tabs, Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Mientras se determina el estado de sesión mostrar spinner
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // Guard: si no está autenticado redirigir al login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0052CC',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F2F5',
          height: Platform.OS === 'ios' ? 80 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 6,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* Tab 1: Inicio */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 2: Clientes */}
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 3: Compra — botón central elevado */}
      <Tabs.Screen
        name="compra"
        options={{
          title: 'Comprar',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.compraBtn, focused && styles.compraBtnActive]}>
              <Ionicons name="cart" size={26} color="#FFFFFF" />
            </View>
          ),
          tabBarLabel: () => null, // Sin etiqueta en el botón central
        }}
      />

      {/* Tab 4: Productos */}
      <Tabs.Screen
        name="productos"
        options={{
          title: 'Productos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 5: Mis Compras */}
      <Tabs.Screen
        name="mis-compras"
        options={{
          title: 'Mis Compras',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0052CC',
  },
  compraBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0052CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  compraBtnActive: {
    backgroundColor: '#003D99',
  },
});
