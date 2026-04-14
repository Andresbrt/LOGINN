import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, StatusBar, ActivityIndicator, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../theme/colors';

const { width } = Dimensions.get('window');

interface Stats {
  totalClientes: number;
  totalProductos: number;
  comprasHoy: number;
  ventasHoy: number;
  productosStockBajo: number;
}

const STAT_CARDS = [
  { key: 'totalClientes', icon: 'people', label: 'Clientes', gradients: ['#0052CC', '#2684FF'] as [string, string], isCurrency: false },
  { key: 'totalProductos', icon: 'cube', label: 'Productos', gradients: ['#36B37E', '#00B890'] as [string, string], isCurrency: false },
  { key: 'comprasHoy', icon: 'receipt', label: 'Compras Hoy', gradients: ['#6554C0', '#8777D9'] as [string, string], isCurrency: false },
  { key: 'ventasHoy', icon: 'cash', label: 'Ventas Hoy', gradients: ['#FF5630', '#FF8F73'] as [string, string], isCurrency: true },
];

const QUICK_ACTIONS = [
  { icon: 'cart', label: 'Nueva\nCompra', gradients: ['#0052CC', '#2684FF'] as [string, string], route: 'Compra' },
  { icon: 'people', label: 'Clientes', gradients: ['#36B37E', '#00B890'] as [string, string], route: 'Clientes' },
  { icon: 'cube', label: 'Productos', gradients: ['#6554C0', '#8777D9'] as [string, string], route: 'Productos' },
  { icon: 'receipt', label: 'Mis\nCompras', gradients: ['#FF5630', '#FF8F73'] as [string, string], route: 'MisCompras' },
];

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (e) {
      console.log('Error cargando stats:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, []);

  const onRefresh = () => { setRefreshing(true); loadStats(); };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Buenos días', icon: '☀️' };
    if (hour < 18) return { text: 'Buenas tardes', icon: '🌤' };
    return { text: 'Buenas noches', icon: '🌙' };
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const g = greeting();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0052CC" />

      {/* Header con gradiente vibrante */}
      <LinearGradient
        colors={['#0052CC', '#6554C0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Círculos decorativos */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{g.icon} {g.text}</Text>
            <Text style={styles.userName}>{user?.nombre || 'Usuario'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        <View style={styles.roleRow}>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={11} color="#FFD700" />
            <Text style={styles.roleText}>{user?.rol || 'USER'}</Text>
          </View>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0052CC']} />}
      >
        {/* Cards de estadísticas con gradiente */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resumen del día</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.statsGrid}>
            {STAT_CARDS.map(card => {
              const raw = stats?.[card.key as keyof Stats] ?? 0;
              const display = card.isCurrency ? formatCurrency(raw as number) : String(raw ?? '—');
              return (
                <LinearGradient
                  key={card.key}
                  colors={card.gradients}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statCard}
                >
                  <View style={styles.statIconCircle}>
                    <Ionicons name={card.icon as any} size={20} color="rgba(255,255,255,0.95)" />
                  </View>
                  <Text style={styles.statValue}>{display}</Text>
                  <Text style={styles.statLabel}>{card.label}</Text>
                </LinearGradient>
              );
            })}
          </View>
        )}

        {/* Alerta stock bajo */}
        {stats && stats.productosStockBajo > 0 && (
          <TouchableOpacity
            style={styles.alertCard}
            onPress={() => navigation.navigate('Productos')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#FF991F', '#FF5630']} style={styles.alertIconBox}>
              <Ionicons name="warning" size={17} color="#fff" />
            </LinearGradient>
            <View style={styles.alertBody}>
              <Text style={styles.alertTitle}>¡Atención! Stock bajo</Text>
              <Text style={styles.alertText}>
                {stats.productosStockBajo} producto{stats.productosStockBajo > 1 ? 's necesitan' : ' necesita'} reposición urgente
              </Text>
            </View>
            <View style={styles.alertChevron}>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Acciones rápidas — grid 2x2 */}
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.route}
              style={[styles.actionCard, SHADOWS.sm]}
              onPress={() => navigation.navigate(action.route)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={action.gradients}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionIconBox}
              >
                <Ionicons name={action.icon as any} size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Banner CTA */}
        <LinearGradient
          colors={['#6554C0', '#0052CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerDecor} />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>¡Listo para gestionar!</Text>
            <Text style={styles.bannerSub}>Registra compras en segundos</Text>
          </View>
          <TouchableOpacity
            style={styles.bannerBtn}
            onPress={() => navigation.navigate('Compra')}
            activeOpacity={0.9}
          >
            <Text style={styles.bannerBtnText}>Empezar</Text>
            <Ionicons name="arrow-forward" size={14} color="#6554C0" />
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const cardWidth = (width - SPACING.lg * 2 - SPACING.sm) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  /* Header */
  header: {
    paddingTop: 50,
    paddingBottom: 28,
    paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40,
  },
  decorCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)', top: 20, right: 60,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1 },
  greeting: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  userName: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  roleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  roleText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  headerDate: { fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'capitalize' },

  /* Scroll */
  scrollContent: { padding: SPACING.lg, paddingBottom: 40 },

  /* Section headers */
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: {
    fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text,
    marginBottom: 12, marginTop: 4,
  },

  /* Stats gradient cards */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: {
    width: cardWidth, borderRadius: RADIUS.xl,
    padding: SPACING.md, paddingBottom: SPACING.lg,
    overflow: 'hidden',
  },
  statIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statValue: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  statLabel: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },

  /* Alert */
  alertCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF8F0', borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: '#FFD8B3',
    ...SHADOWS.sm,
  },
  alertIconBox: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm,
  },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text },
  alertText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 1 },
  alertChevron: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },

  /* Quick actions grid 2x2 */
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  actionCard: {
    width: cardWidth, backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl, paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  actionIconBox: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  actionLabel: {
    fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.text,
    textAlign: 'center', lineHeight: 16,
  },

  /* Banner */
  banner: {
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    overflow: 'hidden', ...SHADOWS.md,
  },
  bannerDecor: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.07)', right: -30, top: -40,
  },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  bannerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  bannerBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: '#6554C0' },
});
