import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { productoService } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../theme/colors';

interface Producto {
  id: number; nombre: string; descripcion: string; precio: number;
  stock: number; categoria: string; codigo: string;
}

const emptyForm = { nombre: '', descripcion: '', precio: '', stock: '', categoria: '', codigo: '' };

const CATEGORY_MAP: Record<string, { icon: string; colors: [string, string] }> = {
  'Electrónicos':    { icon: 'laptop-outline',        colors: ['#0052CC', '#2684FF'] },
  'Periféricos':     { icon: 'mouse-outline',          colors: ['#6554C0', '#8777D9'] },
  'Audio':           { icon: 'headset-outline',        colors: ['#FF5630', '#FF8F73'] },
  'Monitores':       { icon: 'desktop-outline',        colors: ['#36B37E', '#57D9A3'] },
  'Almacenamiento':  { icon: 'save-outline',           colors: ['#FF991F', '#FFAB00'] },
  'Accesorios':      { icon: 'hardware-chip-outline',  colors: ['#00B8D9', '#00D4FF'] },
  'Memoria':         { icon: 'server-outline',         colors: ['#6554C0', '#998DD9'] },
  'General':         { icon: 'cube-outline',           colors: ['#5E6C84', '#8993A4'] },
};

const getCategoryMeta = (cat: string) =>
  CATEGORY_MAP[cat] ?? { icon: 'cube-outline', colors: ['#5E6C84', '#8993A4'] as [string, string] };

export default function ProductosScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtered, setFiltered] = useState<Producto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productoService.listar();
      setProductos(data);
      setFiltered(data);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la lista de productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text) { setFiltered(productos); return; }
    const q = text.toLowerCase();
    setFiltered(productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.categoria?.toLowerCase().includes(q) ||
      p.codigo?.toLowerCase().includes(q)
    ));
  };

  const openCrear = () => {
    setForm({ ...emptyForm });
    setEditMode(false);
    setSelectedId(null);
    setModalVisible(true);
  };

  const openEditar = (p: Producto) => {
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio: p.precio?.toString() || '',
      stock: p.stock?.toString() || '',
      categoria: p.categoria || '',
      codigo: p.codigo || '',
    });
    setEditMode(true);
    setSelectedId(p.id);
    setModalVisible(true);
  };

  const handleGuardar = async () => {
    if (!form.nombre.trim() || !form.precio) {
      Alert.alert('Validación', 'Nombre y precio son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        precio: parseFloat(form.precio),
        stock: parseInt(form.stock) || 0,
      };
      if (editMode && selectedId) {
        await productoService.actualizar(selectedId, payload);
      } else {
        await productoService.crear(payload);
      }
      setModalVisible(false);
      cargar();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Error al guardar producto');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = (p: Producto) => {
    Alert.alert('Confirmar', `¿Eliminar "${p.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await productoService.eliminar(p.id);
            cargar();
          } catch {
            Alert.alert('Error', 'No se pudo eliminar el producto');
          }
        },
      },
    ]);
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return COLORS.danger;
    if (stock <= 10) return COLORS.warning;
    return COLORS.success;
  };

  const renderItem = ({ item }: { item: Producto }) => {
    const meta = getCategoryMeta(item.categoria || 'General');
    return (
    <View style={[styles.card, SHADOWS.sm]}>
      {/* Icono de categoría con gradiente */}
      <LinearGradient colors={meta.colors} style={styles.catIcon} start={{x:0,y:0}} end={{x:1,y:1}}>
        <Ionicons name={meta.icon as any} size={22} color="#fff" />
      </LinearGradient>

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.categoryChip, { backgroundColor: meta.colors[0] + '18' }]}>
            <Text style={[styles.categoryText, { color: meta.colors[0] }]}>{item.categoria || 'General'}</Text>
          </View>
          {item.codigo ? <Text style={styles.codigo}>{item.codigo}</Text> : null}
        </View>
        <Text style={styles.nombre}>{item.nombre}</Text>
        {item.descripcion ? <Text style={styles.desc} numberOfLines={2}>{item.descripcion}</Text> : null}
        <View style={styles.cardFooter}>
          <Text style={[styles.precio, { color: meta.colors[0] }]}>${(item.precio || 0).toFixed(2)}</Text>
          <View style={[styles.stockBadge, { backgroundColor: getStockColor(item.stock) + '20' }]}>
            <View style={[styles.stockDot, { backgroundColor: getStockColor(item.stock) }]} />
            <Text style={[styles.stockText, { color: getStockColor(item.stock) }]}>
              Stock: {item.stock}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEditar(item)}>
          <Ionicons name="pencil-outline" size={17} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleEliminar(item)}>
          <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient colors={['#0052CC', '#6554C0']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.header}>
        <Text style={styles.headerTitle}>Productos</Text>
        <Text style={styles.headerSub}>{filtered.length} artículos en catálogo</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre, código o categoría..."
              placeholderTextColor={COLORS.textTertiary}
              value={search}
              onChangeText={handleSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openCrear}>
            <Ionicons name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={i => i.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="cube-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>No hay productos registrados</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Editar Producto' : 'Nuevo Producto'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {[
              { key: 'nombre', label: 'Nombre del producto *', icon: 'cube-outline', placeholder: 'Ej: Laptop Dell XPS', keyboard: 'default' },
              { key: 'descripcion', label: 'Descripción', icon: 'document-text-outline', placeholder: 'Descripción breve', keyboard: 'default' },
              { key: 'precio', label: 'Precio *', icon: 'cash-outline', placeholder: '0.00', keyboard: 'decimal-pad' },
              { key: 'stock', label: 'Stock inicial', icon: 'layers-outline', placeholder: '0', keyboard: 'numeric' },
              { key: 'categoria', label: 'Categoría', icon: 'pricetag-outline', placeholder: 'Ej: Electrónicos', keyboard: 'default' },
              { key: 'codigo', label: 'Código SKU', icon: 'barcode-outline', placeholder: 'Ej: LAP-001', keyboard: 'default' },
            ].map(f => (
              <View key={f.key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <View style={styles.fieldInput}>
                  <Ionicons name={f.icon as any} size={18} color={COLORS.textSecondary} />
                  <TextInput
                    style={styles.fieldTextInput}
                    placeholder={f.placeholder}
                    placeholderTextColor={COLORS.textTertiary}
                    value={(form as any)[f.key]}
                    onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                    keyboardType={f.keyboard as any}
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleGuardar}
              disabled={saving}
            >
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.saveBtnGradient}>
                {saving
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.saveBtnText}>{editMode ? 'Guardar cambios' : 'Crear producto'}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  body: { flex: 1, padding: SPACING.lg },
  searchRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  searchInput: { flex: 1, height: 46, fontSize: FONTS.sizes.sm, color: COLORS.text, marginLeft: SPACING.xs },
  addBtn: {
    width: 46, height: 46, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
  },
  loader: { marginTop: 60 },
  list: { paddingBottom: SPACING.xxl },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  catIcon: {
    width: 50, height: 50, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm,
    flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  categoryChip: {
    backgroundColor: COLORS.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full,
  },
  categoryText: { fontSize: 10, fontWeight: '600', color: COLORS.primary },
  codigo: { fontSize: 10, color: COLORS.textTertiary, fontWeight: '500' },
  nombre: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  desc: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, lineHeight: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },
  precio: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  actions: { flexDirection: 'column', gap: SPACING.xs, marginLeft: SPACING.sm },
  editBtn: { width: 34, height: 34, borderRadius: RADIUS.sm, backgroundColor: COLORS.primary + '12', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 34, height: 34, borderRadius: RADIUS.sm, backgroundColor: COLORS.danger + '12', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.textTertiary, marginTop: SPACING.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, paddingBottom: 40, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text },
  fieldGroup: { marginBottom: SPACING.sm },
  fieldLabel: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  fieldInput: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.sm,
  },
  fieldTextInput: { flex: 1, height: 44, fontSize: FONTS.sizes.sm, color: COLORS.text, marginLeft: SPACING.xs },
  saveBtn: { marginTop: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnGradient: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700' },
});
