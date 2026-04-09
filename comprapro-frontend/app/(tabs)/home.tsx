import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../../src/services/api';

const { width } = Dimensions.get('window');

// ── Paleta de colores ─────────────────────────────────────────────────────────
const C = {
  primary:       '#0052CC',
  primaryDark:   '#003D99',
  accent:        '#00D4FF',
  white:         '#FFFFFF',
  background:    '#F4F7FF',
  text:          '#091E42',
  textSecondary: '#5E6C84',
  success:       '#36B37E',
  warning:       '#FFAB00',
  danger:        '#FF5630',
  info:          '#0065FF',
  purple:        '#7C3AED',
};

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Stats {
  totalClientes:        number;
  totalProductos:       number;
  comprasHoy:           number;
  ventasHoy:            number;
  productosStockBajo:   number;
}

// ── Componente: tarjeta de estadística ───────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
  sublabel,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  sublabel?: string;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <View style={[styles.statIconBg, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {!!sublabel && <Text style={styles.statSublabel}>{sublabel}</Text>}
    </View>
  );
}

// ── Componente: acción rápida ─────────────────────────────────────────────────
function QuickAction({
  icon,
  label,
  color,
  route,
}: {
  icon: string;
  label: string;
  color: string;
  route: string;
}) {
  return (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={() => router.push(route as any)}
      activeOpacity={0.8}
    >
      <LinearGradient colors={[color, color + 'CC']} style={styles.quickActionIcon}>
        <Ionicons name={icon as any} size={24} color={C.white} />
      </LinearGradient>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [stats,      setStats]      = useState<Stats | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Carga estadísticas del backend
  const loadStats = useCallback(async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch {
      // Backend no disponible: mostrar valores en cero sin crashear
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, []);

  // Pull-to-refresh
  const onRefresh = () => { setRefreshing(true); loadStats(); };

  // Cerrar sesión con confirmación
  const handleLogout = () =>
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => { await logout(); },
        },
      ]
    );

  // Saludo según hora
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(n || 0);

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
      >
        {/* ── Cabecera con degradado ── */}
        <LinearGradient
          colors={[C.primary, C.primaryDark]}
          style={styles.header}
        >
          {/* Saludo + info de usuario */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{greeting()},</Text>
              {/* ¡BIENVENIDO, {nombre}! */}
              <Text style={styles.welcomeMsg} numberOfLines={1}>
                ¡Bienvenido, {user?.nombre ?? 'Usuario'}!
              </Text>
              {/* Badge de rol */}
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={11} color="rgba(255,255,255,0.9)" />
                <Text style={styles.roleText}>{user?.rol ?? 'USER'}</Text>
              </View>
            </View>

            {/* Botón cerrar sesión */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.75}
            >
              <Ionicons name="log-out-outline" size={22} color={C.white} />
            </TouchableOpacity>
          </View>

          {/* Resumen rápido de hoy */}
          <View style={styles.quickSummary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>
                {isLoading ? '—' : (stats?.comprasHoy ?? 0)}
              </Text>
              <Text style={styles.summaryLbl}>Compras hoy</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>
                {isLoading ? '—' : fmt(stats?.ventasHoy ?? 0)}
              </Text>
              <Text style={styles.summaryLbl}>Ventas hoy</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Tarjetas de estadísticas ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen General</Text>
          {isLoading ? (
            <ActivityIndicator color={C.primary} size="large" style={{ marginVertical: 24 }} />
          ) : (
            <View style={styles.statsGrid}>
              <StatCard
                icon="people"
                label="Clientes"
                value={stats?.totalClientes ?? 0}
                color={C.info}
              />
              <StatCard
                icon="cube-outline"
                label="Productos"
                value={stats?.totalProductos ?? 0}
                color={C.success}
              />
              <StatCard
                icon="cart-outline"
                label="Compras Hoy"
                value={stats?.comprasHoy ?? 0}
                color={C.primary}
              />
              <StatCard
                icon="alert-circle-outline"
                label="Stock Bajo"
                value={stats?.productosStockBajo ?? 0}
                color={C.warning}
                sublabel={stats?.productosStockBajo ? 'Requieren atención' : 'Todo en orden'}
              />
            </View>
          )}
        </View>

        {/* ── Acciones rápidas ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            <QuickAction icon="cart"       label="Nueva Compra"   color={C.primary} route="/(tabs)/compra"     />
            <QuickAction icon="person-add" label="Nuevo Cliente"  color={C.success} route="/(tabs)/clientes"   />
            <QuickAction icon="cube"       label="Productos"      color={C.info}    route="/(tabs)/productos"  />
            <QuickAction icon="receipt"    label="Mis Compras"    color={C.purple}  route="/(tabs)/mis-compras" />
          </View>
        </View>

        {/* ── Banner de estado ── */}
        <View style={styles.section}>
          <LinearGradient
            colors={[C.primary, C.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.banner}
          >
            <Ionicons name="shield-checkmark" size={28} color={C.white} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.bannerTitle}>Sistema Activo</Text>
              <Text style={styles.bannerSub}>
                Todos los servicios operando con normalidad
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── Botón grande Cerrar Sesión ── */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.82}
            style={styles.logoutBigBtn}
          >
            <Ionicons name="log-out-outline" size={20} color={C.danger} />
            <Text style={styles.logoutBigText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 36 }} />
      </ScrollView>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const CARD_W = (width - 52) / 2;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F7FF' },

  /* Cabecera */
  header: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.72)' },
  welcomeMsg: {
    fontSize: 24,
    fontWeight: '800',
    color: C.white,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  roleText: { fontSize: 11, fontWeight: '700', color: C.white, letterSpacing: 0.8 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 11,
    marginTop: 4,
  },

  /* Resumen rápido */
  quickSummary: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 18,
    padding: 18,
  },
  summaryItem:   { flex: 1, alignItems: 'center' },
  summaryVal:    { fontSize: 22, fontWeight: '800', color: C.white },
  summaryLbl:    { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 3 },
  summaryDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.22)' },

  /* Secciones */
  section:      { paddingHorizontal: 20, marginTop: 28 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 14 },

  /* Stats */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: CARD_W,
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue:   { fontSize: 28, fontWeight: '800', color: C.text },
  statLabel:   { fontSize: 12, color: C.textSecondary, marginTop: 4, textAlign: 'center' },
  statSublabel:{ fontSize: 11, color: C.textSecondary, marginTop: 2 },

  /* Acciones rápidas */
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickAction: {
    width: CARD_W,
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionLabel: { fontSize: 13, fontWeight: '600', color: C.text, textAlign: 'center' },

  /* Banner */
  banner: {
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: C.white },
  bannerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.80)', marginTop: 3 },

  /* Botón grande cerrar sesión */
  logoutBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: 16,
  },
  logoutBigText: { fontSize: 16, fontWeight: '700', color: C.danger },
});

