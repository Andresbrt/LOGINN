import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

interface User {
  username: string;
  nombre: string;
  rol: string;
  userId: number;
  token: string;
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
      const token = await AsyncStorage.getItem('@comprapro_token');
      const userData = await AsyncStorage.getItem('@comprapro_user');
      if (token && userData) {
        const parsed = JSON.parse(userData);
        setUser({ ...parsed, token });
      }
    } catch (e) {
      console.log('Error cargando sesión:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const data = await authService.login(username, password);
    const userData: User = {
      username: data.username,
      nombre: data.nombre,
      rol: data.rol,
      userId: data.userId,
      token: data.token,
    };
    await AsyncStorage.setItem('@comprapro_token', data.token);
    await AsyncStorage.setItem('@comprapro_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['@comprapro_token', '@comprapro_user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
