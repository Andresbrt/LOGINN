import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor: adjuntar JWT token a cada request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@comprapro_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['@comprapro_token', '@comprapro_user']);
    }
    return Promise.reject(error);
  }
);

// ============== AUTH ==============
export const authService = {
  login: async (username: string, password: string) => {
    const res = await api.post('/api/auth/login', { username, password });
    return res.data;
  },
  validate: async () => {
    const res = await api.get('/api/auth/validate');
    return res.data;
  },
};

// ============== DASHBOARD ==============
export const dashboardService = {
  getStats: async () => {
    const res = await api.get('/api/dashboard/stats');
    return res.data;
  },
};

// ============== CLIENTES ==============
export const clienteService = {
  listar: async () => {
    const res = await api.get('/api/clientes');
    return res.data;
  },
  buscar: async (q: string) => {
    const res = await api.get('/api/clientes/buscar', { params: { q } });
    return res.data;
  },
  crear: async (data: any) => {
    const res = await api.post('/api/clientes', data);
    return res.data;
  },
  actualizar: async (id: number, data: any) => {
    const res = await api.put(`/api/clientes/${id}`, data);
    return res.data;
  },
  eliminar: async (id: number) => {
    const res = await api.delete(`/api/clientes/${id}`);
    return res.data;
  },
};

// ============== PRODUCTOS ==============
export const productoService = {
  listar: async () => {
    const res = await api.get('/api/productos');
    return res.data;
  },
  buscar: async (q: string) => {
    const res = await api.get('/api/productos/buscar', { params: { q } });
    return res.data;
  },
  crear: async (data: any) => {
    const res = await api.post('/api/productos', data);
    return res.data;
  },
  actualizar: async (id: number, data: any) => {
    const res = await api.put(`/api/productos/${id}`, data);
    return res.data;
  },
  eliminar: async (id: number) => {
    const res = await api.delete(`/api/productos/${id}`);
    return res.data;
  },
  stockBajo: async (limite = 10) => {
    const res = await api.get('/api/productos/stock-bajo', { params: { limite } });
    return res.data;
  },
};

// ============== COMPRAS ==============
export const compraService = {
  realizar: async (compra: any) => {
    const res = await api.post('/api/compras', compra);
    return res.data;
  },
  listar: async () => {
    const res = await api.get('/api/compras');
    return res.data;
  },
  obtener: async (id: number) => {
    const res = await api.get(`/api/compras/${id}`);
    return res.data;
  },
};

export default api;
