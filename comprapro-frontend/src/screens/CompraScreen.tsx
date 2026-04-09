import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ScrollView, ActivityIndicator, Alert, StatusBar, Modal,
  KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clienteService, productoService, compraService } from '../services/api';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../theme/colors';

interface Cliente { id: number; nombre: string; email: string; telefono: string; documento: string; }
interface Producto { id: number; nombre: string; precio: number; stock: number; categoria: string; codigo: string; }
interface CartItem { producto: Producto; cantidad: number; }

// ── Chip de stock con tres colores ──────────────────────────────────────────
function StockChip({ stock }: { stock: number }) {
  const color =
    stock === 0 ? COLORS.danger :
    stock <= 5  ? COLORS.warning :
                  COLORS.success;
  const label =
    stock === 0 ? 'Sin stock' :
    stock <= 5  ? `Stock: ${stock}` :
                  `Stock: ${stock}`;
  return (
    <View style={[stockStyles.chip, { backgroundColor: color + '20' }]}>
      <View style={[stockStyles.dot, { backgroundColor: color }]} />
      <Text style={[stockStyles.label, { color }]}>{label}</Text>
    </View>
  );
}
const stockStyles = StyleSheet.create({
  chip:  { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 3, gap: 4 },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 10, fontWeight: '700' },
});

export default function CompraScreen() {
  const insets = useSafeAreaInsets();

  const [clientes,          setClientes]          = useState<Cliente[]>([]);
  const allClientesRef                            = useRef<Cliente[]>([]);   // buffer completo para búsqueda local
  const [productos,         setProductos]          = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [cart,       setCart]       = useState<CartItem[]>([]);
  const [searchCliente, setSearchCliente] = useState('');
  const [searchProducto, setSearchProducto] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [refreshing,  setRefreshing]  = useState(false);

  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [modalCliente,  setModalCliente]  = useState(false);
  const [modalProducto, setModalProducto] = useState(false);
  const [modalListo,    setModalListo]    = useState(false);
  const [compraRealizada, setCompraRealizada] = useState<any>(null);

  const IVA = 0.12;

  const cargarClientes = useCallback(async () => {
    setLoadingClientes(true);
    try {
      const data = await clienteService.listar();
      allClientesRef.current = data;   // guardar buffer completo
      setClientes(data);
    } catch { } finally { setLoadingClientes(false); }
  }, []);

  const cargarProductos = useCallback(async () => {
    setLoadingProductos(true);
    try {
      const data = await productoService.listar();
      setProductos(data);
      setFilteredProductos(data);
    } catch { } finally { setLoadingProductos(false); }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([cargarClientes(), cargarProductos()]);
    setRefreshing(false);
  }, [cargarClientes, cargarProductos]);

  useEffect(() => { cargarClientes(); cargarProductos(); }, []);

  // ── Búsqueda de clientes: filtra sobre el buffer completo (sin mutar) ──────
  const buscarCliente = (text: string) => {
    setSearchCliente(text);
    if (!text.trim()) {
      setClientes(allClientesRef.current);
      return;
    }
    const q = text.toLowerCase();
    setClientes(
      allClientesRef.current.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.documento?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      )
    );
  };

  // ── Búsqueda de productos: filtra sobre la lista completa ────────────────
  const buscarProducto = (text: string) => {
    setSearchProducto(text);
    if (!text.trim()) { setFilteredProductos(productos); return; }
    const q = text.toLowerCase();
    setFilteredProductos(productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.categoria?.toLowerCase().includes(q) ||
      p.codigo?.toLowerCase().includes(q)
    ));
  };

  const agregarAlCarrito = (producto: Producto) => {
    if (producto.stock <= 0) {
      Alert.alert('Sin stock', `"${producto.nombre}" no tiene unidades disponibles.`);
      return;
    }
    setCart(prev => {
      const existe = prev.find(i => i.producto.id === producto.id);
      if (existe) {
        if (existe.cantidad >= producto.stock) {
          Alert.alert('Stock insuficiente', `Máximo disponible para "${producto.nombre}": ${producto.stock} unidades.`);
          return prev;
        }
        return prev.map(i => i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { producto, cantidad: 1 }];
    });
    setModalProducto(false);
    setSearchProducto('');
    setFilteredProductos(productos);
  };

  const cambiarCantidad = (id: number, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.producto.id !== id) return i;
          const nueva = i.cantidad + delta;
          if (nueva <= 0) return null;
          if (nueva > i.producto.stock) {
            Alert.alert('Stock insuficiente', `Máximo disponible para "${i.producto.nombre}": ${i.producto.stock} unidades.`);
            return i;
          }
          return { ...i, cantidad: nueva };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const quitarDelCarrito = (id: number) => {
    setCart(prev => prev.filter(i => i.producto.id !== id));
  };

  const subtotal = cart.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);
  const impuesto = subtotal * IVA;
  const total = subtotal + impuesto;

  const confirmarCompra = async () => {
    if (!clienteSeleccionado) {
      Alert.alert('Atención', 'Selecciona un cliente para continuar');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Atención', 'Agrega al menos un producto al carrito');
      return;
    }
    setConfirming(true);
    try {
      const payload = {
        clienteId: clienteSeleccionado.id,
        observaciones,
        detalles: cart.map(i => ({ productoId: i.producto.id, cantidad: i.cantidad })),
      };
      const result = await compraService.realizar(payload);
      setCompraRealizada(result);
      setModalListo(true);
      setCart([]);
      setClienteSeleccionado(null);
      setObservaciones('');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'No se pudo procesar la compra');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header con safe area */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Nueva Compra</Text>
            <Text style={styles.headerSub}>Registra una orden de compra</Text>
          </View>
          {/* Badge del carrito en el header */}
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Ionicons name="cart" size={18} color={COLORS.white} />
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >

        {/* Step 1: Cliente */}
        <View style={styles.section}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Seleccionar Cliente</Text>
            <Text style={styles.sectionSub}>Elige el cliente para esta compra</Text>
          </View>

          {clienteSeleccionado ? (
            <View style={[styles.selectedCard, SHADOWS.sm]}>
              <View style={styles.selectedAvatar}>
                <Text style={styles.selectedAvatarText}>{clienteSeleccionado.nombre.charAt(0)}</Text>
              </View>
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedNombre}>{clienteSeleccionado.nombre}</Text>
                <Text style={styles.selectedDetail}>{clienteSeleccionado.email || clienteSeleccionado.documento}</Text>
              </View>
              <TouchableOpacity
                style={styles.changeBtn}
                onPress={() => { setModalCliente(true); cargarClientes(); }}
              >
                <Text style={styles.changeBtnText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.selectBtn, SHADOWS.sm]}
              onPress={() => { setModalCliente(true); cargarClientes(); }}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
              <Text style={styles.selectBtnText}>Seleccionar cliente</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Step 2: Productos */}
        <View style={styles.section}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNum}>2</Text>
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Agregar Productos</Text>
            <Text style={styles.sectionSub}>{cart.length} producto{cart.length !== 1 ? 's' : ''} en el carrito</Text>
          </View>

          <TouchableOpacity
            style={[styles.addProductBtn, SHADOWS.sm]}
            onPress={() => { setModalProducto(true); cargarProductos(); }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.accent, COLORS.primary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.addProductBtnGradient}
            >
              <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
              <Text style={styles.addProductBtnText}>Buscar y Agregar Producto</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Carrito */}
          {cart.length > 0 && (
            <View style={styles.cartContainer}>
              {cart.map(item => (
                <View key={item.producto.id} style={[styles.cartItem, SHADOWS.sm]}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemNombre} numberOfLines={1}>{item.producto.nombre}</Text>
                    <Text style={styles.cartItemPrecio}>${item.producto.precio.toFixed(2)} c/u</Text>
                  </View>
                  <View style={styles.cartItemControls}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => cambiarCantidad(item.producto.id, -1)}>
                      <Ionicons name="remove" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.qty}>{item.cantidad}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => cambiarCantidad(item.producto.id, 1)}>
                      <Ionicons name="add" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cartItemRight}>
                    <Text style={styles.cartSubtotal}>${(item.producto.precio * item.cantidad).toFixed(2)}</Text>
                    <TouchableOpacity onPress={() => quitarDelCarrito(item.producto.id)}>
                      <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Step 3: Observaciones */}
        <View style={styles.section}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNum}>3</Text>
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <Text style={styles.sectionSub}>Opcional</Text>
          </View>
          <View style={[styles.obsInput, SHADOWS.sm]}>
            <TextInput
              style={styles.obsTextInput}
              placeholder="Notas adicionales sobre la compra..."
              placeholderTextColor={COLORS.textTertiary}
              value={observaciones}
              onChangeText={setObservaciones}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Resumen total */}
        {cart.length > 0 && (
          <View style={[styles.summaryCard, SHADOWS.md]}>
            <Text style={styles.summaryTitle}>Resumen de Compra</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>IVA (12%)</Text>
              <Text style={styles.summaryValue}>${impuesto.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Botón confirmar */}
        <TouchableOpacity
          style={[styles.confirmBtn, (confirming || cart.length === 0 || !clienteSeleccionado) && styles.confirmBtnDisabled]}
          onPress={confirmarCompra}
          disabled={confirming || cart.length === 0 || !clienteSeleccionado}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[COLORS.success, '#2A9D69']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.confirmBtnGradient}
          >
            {confirming ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                <View>
                  <Text style={styles.confirmBtnText}>Confirmar Compra</Text>
                  {cart.length > 0 && (
                    <Text style={styles.confirmBtnSub}>
                      {cart.length} producto{cart.length !== 1 ? 's' : ''} · Total ${total.toFixed(2)}
                    </Text>
                  )}
                </View>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Seleccionar Cliente */}
      <Modal visible={modalCliente} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
              <TouchableOpacity onPress={() => setModalCliente(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearch}>
              <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar cliente..."
                placeholderTextColor={COLORS.textTertiary}
                value={searchCliente}
                onChangeText={buscarCliente}
              />
            </View>
            {loadingClientes ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={clientes}
                keyExtractor={i => i.id.toString()}
                style={{ maxHeight: 400 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.clienteItem}
                    onPress={() => { setClienteSeleccionado(item); setModalCliente(false); }}
                  >
                    <View style={styles.clienteAvatar}>
                      <Text style={styles.clienteAvatarText}>{item.nombre.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.clienteNombre}>{item.nombre}</Text>
                      <Text style={styles.clienteDetail}>{item.email || item.documento || item.telefono}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyModal}>No se encontraron clientes</Text>}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Seleccionar Producto */}
      <Modal visible={modalProducto} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Producto</Text>
              <TouchableOpacity onPress={() => { setModalProducto(false); setSearchProducto(''); setFilteredProductos(productos); }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearch}>
              <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar producto..."
                placeholderTextColor={COLORS.textTertiary}
                value={searchProducto}
                onChangeText={buscarProducto}
              />
            </View>
            {loadingProductos ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={filteredProductos}
                keyExtractor={i => i.id.toString()}
                style={{ maxHeight: 420 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.productoItem, item.stock === 0 && styles.productoItemDisabled]}
                    onPress={() => agregarAlCarrito(item)}
                    disabled={item.stock === 0}
                  >
                    <View style={styles.productoInfo}>
                      <Text style={styles.productoNombre}>{item.nombre}</Text>
                      <Text style={styles.productoCategoria}>
                        {item.categoria}{item.codigo ? ` · ${item.codigo}` : ''}
                      </Text>
                    </View>
                    <View style={styles.productoRight}>
                      <Text style={styles.productoPrecio}>${item.precio?.toFixed(2)}</Text>
                      <StockChip stock={item.stock} />
                    </View>
                    {item.stock > 0 && (
                      <Ionicons name="add-circle" size={24} color={COLORS.primary} style={{ marginLeft: SPACING.sm }} />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyModal}>No se encontraron productos</Text>}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Compra Exitosa */}
      <Modal visible={modalListo} animationType="fade" transparent>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.successModal}>
            <LinearGradient colors={[COLORS.success, '#2A9D69']} style={styles.successIcon}>
              <Ionicons name="checkmark" size={44} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.successTitle}>¡Compra Registrada!</Text>
            <Text style={styles.successNum}>{compraRealizada?.numeroCompra}</Text>

            {/* Detalles de la orden */}
            <View style={styles.successDetails}>
              <View style={styles.successDetailRow}>
                <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.successDetailText}>{compraRealizada?.clienteNombre}</Text>
              </View>
              <View style={styles.successDetailRow}>
                <Ionicons name="receipt-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.successDetailText}>
                  Subtotal ${compraRealizada?.subtotal?.toFixed?.(2) ?? '0.00'}  ·  IVA ${compraRealizada?.impuesto?.toFixed?.(2) ?? '0.00'}
                </Text>
              </View>
              <View style={styles.successTotalRow}>
                <Text style={styles.successTotalLabel}>TOTAL</Text>
                <Text style={styles.successTotal}>${compraRealizada?.total?.toFixed?.(2) ?? '0.00'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => { setModalListo(false); router.push('/(tabs)/mis-compras'); }}
            >
              <Ionicons name="list-outline" size={16} color={COLORS.white} />
              <Text style={styles.successBtnText}>Ver Mis Compras</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.successBtnOutline}
              onPress={() => setModalListo(false)}
            >
              <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
              <Text style={styles.successBtnOutlineText}>Nueva Compra</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  cartBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  cartBadgeText: { color: COLORS.white, fontWeight: '800', fontSize: FONTS.sizes.sm },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: 120 },

  section: { marginBottom: SPACING.lg, position: 'relative', paddingLeft: 44 },
  stepBadge: {
    position: 'absolute', left: 0, top: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { color: COLORS.white, fontWeight: '800', fontSize: FONTS.sizes.sm },
  sectionHeader: { marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  sectionSub: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },

  selectBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.sm,
    borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed',
  },
  selectBtnText: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.textSecondary },

  selectedCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  selectedAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm,
  },
  selectedAvatarText: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.primary },
  selectedInfo: { flex: 1 },
  selectedNombre: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  selectedDetail: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  changeBtn: {
    paddingHorizontal: SPACING.sm, paddingVertical: 6,
    backgroundColor: COLORS.primary + '15', borderRadius: RADIUS.full,
  },
  changeBtnText: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.primary },

  addProductBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.sm },
  addProductBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 14 },
  addProductBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },

  cartContainer: { gap: SPACING.xs },
  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.sm,
  },
  cartItemInfo: { flex: 1 },
  cartItemNombre: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  cartItemPrecio: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  cartItemControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginHorizontal: SPACING.sm },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  qty: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text, minWidth: 24, textAlign: 'center' },
  cartItemRight: { alignItems: 'flex-end', gap: 4 },
  cartSubtotal: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.primary },

  obsInput: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  obsTextInput: { fontSize: FONTS.sizes.sm, color: COLORS.text, minHeight: 60 },

  summaryCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md,
    borderTopWidth: 4, borderTopColor: COLORS.primary,
  },
  summaryTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  summaryLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  totalLabel: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.text },
  totalValue: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },

  confirmBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: SPACING.xl, ...SHADOWS.lg },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: SPACING.md,
  },
  confirmBtnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '800' },
  confirmBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.xs },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING.lg, paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  modalSearchInput: { flex: 1, height: 44, fontSize: FONTS.sizes.sm, color: COLORS.text, marginLeft: SPACING.xs },

  clienteItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  clienteAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primary + '18', alignItems: 'center', justifyContent: 'center',
  },
  clienteAvatarText: { fontWeight: '700', color: COLORS.primary, fontSize: FONTS.sizes.md },
  clienteNombre: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  clienteDetail: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },

  productoItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  productoItemDisabled: { opacity: 0.4 },
  productoInfo: { flex: 1 },
  productoNombre: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  productoCategoria: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  productoRight: { alignItems: 'flex-end' },
  productoPrecio: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.primary },

  emptyModal: { textAlign: 'center', color: COLORS.textTertiary, marginTop: 20 },

  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  successModal: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl + 4,
    padding: SPACING.xl, alignItems: 'center', width: '100%',
    ...SHADOWS.lg,
  },
  successIcon: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  successTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  successNum: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.md },
  successDetails: {
    width: '100%', backgroundColor: COLORS.background, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.lg, gap: SPACING.xs,
  },
  successDetailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  successDetailText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  successTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.xs },
  successTotalLabel: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  successTotal: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  successBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    width: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 14, justifyContent: 'center', marginBottom: SPACING.sm,
  },
  successBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
  successBtnOutline: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    width: '100%', borderWidth: 2, borderColor: COLORS.primary,
    borderRadius: RADIUS.lg, paddingVertical: 12, justifyContent: 'center',
  },
  successBtnOutlineText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.primary },
});
