import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { compraService } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../theme/colors';

interface Compra {
  id: number; numeroCompra: string; clienteNombre: string;
  total: number; subtotal: number; impuesto: number;
  estado: string; fechaCompra: string; observaciones: string;
  detalles: any[];
}

export default function MisComprasScreen() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Compra | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await compraService.listar();
      setCompras(data);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, []);

  const onRefresh = () => { setRefreshing(true); cargar(); };

  const formatFecha = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'COMPLETADA': return COLORS.success;
      case 'PENDIENTE': return COLORS.warning;
      case 'CANCELADA': return COLORS.danger;
      default: return COLORS.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: Compra }) => {
    const statusColor = getEstadoColor(item.estado);
    return (
    <TouchableOpacity
      style={[styles.card, SHADOWS.sm]}
      onPress={() => { setSelected(item); setModalVisible(true); }}
      activeOpacity={0.8}
    >
      {/* Stripe izquierdo de color por estado */}
      <View style={[styles.cardStripe, { backgroundColor: statusColor }]} />

      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View style={styles.orderBadge}>
            <Ionicons name="receipt-outline" size={14} color={COLORS.primary} />
            <Text style={styles.orderNum}>{item.numeroCompra}</Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.estadoDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.estadoText, { color: statusColor }]}>{item.estado}</Text>
          </View>
        </View>

        <Text style={styles.clienteNombre}>{item.clienteNombre}</Text>
        <Text style={styles.fecha}>{formatFecha(item.fechaCompra)}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.itemsCount}>
            <Ionicons name="cube-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.itemsText}>{item.detalles?.length || 0} producto{(item.detalles?.length || 0) !== 1 ? 's' : ''}</Text>
          </View>
          <Text style={[styles.total, { color: statusColor }]}>${(item.total || 0).toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <LinearGradient colors={['#0052CC', '#6554C0']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.header}>
        <Text style={styles.headerTitle}>Mis Compras</Text>
        <Text style={styles.headerSub}>{compras.length} registros totales</Text>
        {compras.length > 0 && (
          <View style={styles.headerStat}>
            <Ionicons name="cash-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.headerStatText}>
              Total acumulado: ${compras.reduce((s, c) => s + (c.total || 0), 0).toFixed(2)}
            </Text>
          </View>
        )}
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={compras}
          keyExtractor={i => i.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={56} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Sin compras aún</Text>
              <Text style={styles.emptyText}>Las compras registradas aparecerán aquí</Text>
            </View>
          }
        />
      )}

      {/* Modal Detalle Compra */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Detalle de Compra</Text>
                <Text style={styles.modalSub}>{selected?.numeroCompra}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Info cliente */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Cliente</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailValue}>{selected.clienteNombre}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailValue}>{formatFecha(selected.fechaCompra)}</Text>
                  </View>
                  {selected.observaciones ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="chatbox-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.detailValue}>{selected.observaciones}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Productos */}
                <Text style={styles.detailSectionTitle}>Productos</Text>
                {selected.detalles?.map((d: any, idx: number) => (
                  <View key={idx} style={styles.detalleItem}>
                    <View style={styles.detalleInfo}>
                      <Text style={styles.detalleNombre}>{d.productoNombre}</Text>
                      <Text style={styles.detallePrecio}>${d.precioUnitario?.toFixed(2)} × {d.cantidad}</Text>
                    </View>
                    <Text style={styles.detalleSubtotal}>${d.subtotal?.toFixed(2)}</Text>
                  </View>
                ))}

                {/* Totales */}
                <View style={styles.totalesCard}>
                  <View style={styles.totalesRow}>
                    <Text style={styles.totalesLabel}>Subtotal</Text>
                    <Text style={styles.totalesValue}>${selected.subtotal?.toFixed(2)}</Text>
                  </View>
                  <View style={styles.totalesRow}>
                    <Text style={styles.totalesLabel}>IVA (12%)</Text>
                    <Text style={styles.totalesValue}>${selected.impuesto?.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.totalesRow, styles.totalesRowFinal]}>
                    <Text style={styles.totalesFinalLabel}>TOTAL</Text>
                    <Text style={styles.totalesFinalValue}>${selected.total?.toFixed(2)}</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 50, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
  },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerStat: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, marginTop: 10,
  },
  headerStatText: { fontSize: FONTS.sizes.xs, color: '#fff', fontWeight: '600' },
  loader: { marginTop: 60 },
  list: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm, flexDirection: 'row',
    overflow: 'hidden',
  },
  cardStripe: { width: 5, borderRadius: 0 },
  cardContent: { flex: 1, padding: SPACING.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  orderBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderNum: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.primary, fontFamily: 'monospace' },
  estadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  estadoDot: { width: 6, height: 6, borderRadius: 3 },
  estadoText: { fontSize: 10, fontWeight: '700' },
  clienteNombre: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  fecha: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },
  itemsCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemsText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  total: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text, marginTop: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING.lg, paddingBottom: 40, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text },
  modalSub: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '600' },

  detailSection: { marginBottom: SPACING.md },
  detailSectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 6 },
  detailValue: { fontSize: FONTS.sizes.sm, color: COLORS.text },

  detalleItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  detalleInfo: { flex: 1 },
  detalleNombre: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  detallePrecio: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  detalleSubtotal: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.primary },

  totalesCard: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.md,
  },
  totalesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  totalesLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  totalesValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  totalesRowFinal: { marginTop: SPACING.xs, paddingTop: SPACING.xs, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalesFinalLabel: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.text },
  totalesFinalValue: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
});
