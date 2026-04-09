/**
 * Ruta raíz "/" — redirige inmediatamente al login.
 * El _layout.tsx se encargará de redirigir a /(tabs)/home
 * si ya hay una sesión activa en AsyncStorage.
 */
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
