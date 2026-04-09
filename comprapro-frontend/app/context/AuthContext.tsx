import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../src/services/api';

const KEY_TOKEN = '@comprapro_token';
const KEY_USER  = '@comprapro_user';

export interface User {
  token: string;
  nombre: string;
  rol: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const token  = await AsyncStorage.getItem(KEY_TOKEN);
      const stored = await AsyncStorage.getItem(KEY_USER);
      if (token && stored) {
        const parsed: Omit<User, 'token'> = JSON.parse(stored);
        setUser({ token, nombre: parsed.nombre, rol: parsed.rol });
      }
    } catch (e) {
      console.warn('[AuthContext] Error cargando sesion:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const data = await authService.login(username, password);
    const userData: User = { token: data.token, nombre: data.nombre, rol: data.rol };
    await AsyncStorage.setItem(KEY_TOKEN, data.token);
    await AsyncStorage.setItem(KEY_USER, JSON.stringify({ nombre: userData.nombre, rol: userData.rol }));
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([KEY_TOKEN, KEY_USER]);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}