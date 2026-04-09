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

const StatCard = ({ icon, label, value, color, sublabel }: any) => (
  <View style={[styles.statCard, SHADOWS.md]}>
    <View style={[styles.statIconBg, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sublabel ? <Text style={styles.statSublabel}>{sublabel}</Text> : null}
  </View>
);

const QuickAction = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity style={[styles.quickAction, SHADOWS.sm]} onPress={onPress} activeOpacity={0.8}>
    <LinearGradient
      colors={[color, color + 'CC']}
      style={styles.quickActionGradient}
    >
      <Ionicons name={icon} size={24} color={COLORS.white} />
    </LinearGradient>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

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
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{user?.nombre || 'Usuario'}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => logout()}
          >
            <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerBadge}>
          <Ionicons name="shield-checkmark" size={12} color={COLORS.accent} />
          <Text style={styles.rolText}>{user?.rol || 'USER'}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Resumen del día</Text>

        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              icon="people"
              label="Clientes"
              value={stats?.totalClientes ?? '—'}
              color={COLORS.primary}
            />
            <StatCard
              icon="cube"
              label="Productos"
              value={stats?.totalProductos ?? '—'}
              color={COLORS.success}
            />
            <StatCard
              icon="receipt"
              label="Compras Hoy"
              value={stats?.comprasHoy ?? '—'}
              color={COLORS.accent}
            />
            <StatCard
              icon="cash"
              label="Ventas Hoy"
              value={formatCurrency(stats?.ventasHoy ?? 0)}
              color={COLORS.warning}
            />
          </View>
        )}

        {/* Alerta stock bajo */}
        {stats && stats.productosStockBajo > 0 && (
          <TouchableOpacity
            style={styles.alertCard}
            onPress={() => navigation.navigate('Productos')}
            activeOpacity={0.8}
          >
            <View style={styles.alertIcon}>
              <Ionicons name="warning" size={20} color={COLORS.warning} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Stock Bajo</Text>
              <Text style={styles.alertText}>
                {stats.productosStockBajo} producto{stats.productosStockBajo > 1 ? 's' : ''} con stock ≤ 10 unidades
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Acciones rápidas */}
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.quickActions}>
          <QuickAction
            icon="cart"
            label="Nueva Compra"
            color={COLORS.primary}
            onPress={() => navigation.navigate('Compra')}
          />
          <QuickAction
            icon="people"
            label="Clientes"
            color={COLORS.success}
            onPress={() => navigation.navigate('Clientes')}
          />
          <QuickAction
            icon="cube-outline"
            label="Productos"
            color={COLORS.accent}
            onPress={() => navigation.navigate('Productos')}
          />
          <QuickAction
            icon="list"
            label="Mis Compras"
            color={COLORS.warning}
            onPress={() => navigation.navigate('MisCompras')}
          />
        </View>

        {/* Banner promocional */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.banner}
        >
          <View>
            <Text style={styles.bannerTitle}>¡Gestiona tu negocio!</Text>
            <Text style={styles.bannerSub}>Registra compras de forma rápida y eficiente</Text>
          </View>
          <TouchableOpacity
            style={styles.bannerBtn}
            onPress={() => navigation.navigate('Compra')}
          >
            <Text style={styles.bannerBtnText}>Iniciar</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const cardWidth = (width - SPACING.lg * 2 - SPACING.sm) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 50, paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  greeting: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.75)' },
  userName: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.white },
  logoutBtn: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full, marginTop: SPACING.sm,
  },
  rolText: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  sectionTitle: {
    fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text,
    marginBottom: SPACING.md, marginTop: SPACING.sm,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: {
    width: cardWidth, backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    alignItems: 'flex-start',
  },
  statIconBg: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  statValue: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  statSublabel: { fontSize: FONTS.sizes.xs, color: COLORS.textTertiary },

  alertCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFBE6', borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderLeftWidth: 4, borderLeftColor: COLORS.warning,
    ...SHADOWS.sm,
  },
  alertIcon: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    backgroundColor: COLORS.warning + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm,
  },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text },
  alertText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },

  quickActions: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  quickAction: { flex: 1, alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, ...SHADOWS.sm },
  quickActionGradient: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs,
  },
  quickActionLabel: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.text, textAlign: 'center' },

  banner: {
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    ...SHADOWS.md,
  },
  bannerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  bannerSub: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  bannerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.white, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  bannerBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.primary },
});
