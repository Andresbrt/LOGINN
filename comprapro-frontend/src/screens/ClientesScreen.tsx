import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { clienteService } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../theme/colors';

interface Cliente {
  id: number; nombre: string; email: string;
  telefono: string; direccion: string; documento: string;
}

const emptyForm = { nombre: '', email: '', telefono: '', direccion: '', documento: '' };

export default function ClientesScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtered, setFiltered] = useState<Cliente[]>([]);
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
      const data = await clienteService.listar();
      setClientes(data);
      setFiltered(data);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar la lista de clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text) { setFiltered(clientes); return; }
    const q = text.toLowerCase();
    setFiltered(clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.documento?.toLowerCase().includes(q)
    ));
  };

  const openCrear = () => {
    setForm({ ...emptyForm });
    setEditMode(false);
    setSelectedId(null);
    setModalVisible(true);
  };

  const openEditar = (c: Cliente) => {
    setForm({ nombre: c.nombre, email: c.email || '', telefono: c.telefono || '', direccion: c.direccion || '', documento: c.documento || '' });
    setEditMode(true);
    setSelectedId(c.id);
    setModalVisible(true);
  };

  const handleGuardar = async () => {
    if (!form.nombre.trim()) {
      Alert.alert('Validación', 'El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      if (editMode && selectedId) {
        await clienteService.actualizar(selectedId, form);
      } else {
        await clienteService.crear(form);
      }
      setModalVisible(false);
      cargar();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Error al guardar cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = (c: Cliente) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Eliminar al cliente "${c.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await clienteService.eliminar(c.id);
              cargar();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el cliente');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Cliente }) => (
    <View style={[styles.card, SHADOWS.sm]}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.nombre.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          {item.email ? <Text style={styles.detail}>{item.email}</Text> : null}
          <View style={styles.row}>
            {item.telefono ? (
              <View style={styles.chip}>
                <Ionicons name="call-outline" size={11} color={COLORS.primary} />
                <Text style={styles.chipText}>{item.telefono}</Text>
              </View>
            ) : null}
            {item.documento ? (
              <View style={styles.chip}>
                <Ionicons name="card-outline" size={11} color={COLORS.success} />
                <Text style={styles.chipText}>{item.documento}</Text>
              </View>
            ) : null}
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Clientes</Text>
        <Text style={styles.headerSub}>{filtered.length} registros</Text>
      </LinearGradient>

      <View style={styles.body}>
        {/* Barra búsqueda */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre, email o documento..."
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
                <Ionicons name="people-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>No hay clientes registrados</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modal Crear/Editar */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Editar Cliente' : 'Nuevo Cliente'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {[
              { key: 'nombre', label: 'Nombre completo *', icon: 'person-outline', placeholder: 'Ej: María García' },
              { key: 'email', label: 'Correo electrónico', icon: 'mail-outline', placeholder: 'Ej: maria@email.com' },
              { key: 'telefono', label: 'Teléfono', icon: 'call-outline', placeholder: 'Ej: 555-0101' },
              { key: 'documento', label: 'Documento / ID', icon: 'card-outline', placeholder: 'Ej: 12345678A' },
              { key: 'direccion', label: 'Dirección', icon: 'location-outline', placeholder: 'Ej: Av. Principal 123' },
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
                    keyboardType={f.key === 'email' ? 'email-address' : 'default'}
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
                {saving ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>{editMode ? 'Guardar cambios' : 'Crear cliente'}</Text>
                )}
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
    paddingHorizontal: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  searchInput: { flex: 1, height: 46, fontSize: FONTS.sizes.sm, color: COLORS.text, marginLeft: SPACING.xs },
  addBtn: {
    width: 46, height: 46, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.sm,
  },
  loader: { marginTop: 60 },
  list: { paddingBottom: SPACING.xxl },

  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm,
    flexDirection: 'row', alignItems: 'center',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary + '18',
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm,
  },
  avatarText: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.primary },
  info: { flex: 1 },
  nombre: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  detail: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 1 },
  row: { flexDirection: 'row', gap: SPACING.xs, marginTop: 4, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.background, borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  chipText: { fontSize: 10, color: COLORS.textSecondary },

  actions: { flexDirection: 'row', gap: SPACING.xs },
  editBtn: {
    width: 34, height: 34, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 34, height: 34, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.danger + '12',
    alignItems: 'center', justifyContent: 'center',
  },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.textTertiary, marginTop: SPACING.md },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, paddingBottom: 40 },
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
