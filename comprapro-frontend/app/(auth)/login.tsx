import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const C = {
  primary:       '#0052CC',
  primaryDark:   '#003D99',
  accent:        '#00D4FF',
  white:         '#FFFFFF',
  text:          '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary:  '#9CA3AF',
  error:         '#EF4444',
  inputBorder:   '#E5E7EB',
  infoBg:        '#EFF6FF',
  disabled:      '#9CA3AF',
};

export default function LoginScreen() {
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [showPass,  setShowPass]    = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [fieldError, setFieldError] = useState<{ user?: string; pass?: string }>({});

  const passwordRef = useRef<TextInput>(null);
  const { login }   = useAuth();
  const router      = useRouter();

  // ── Validación ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: { user?: string; pass?: string } = {};
    if (!username.trim())         errs.user = 'El campo usuario es obligatorio';
    if (!password.trim())         errs.pass = 'El campo contraseña es obligatorio';
    else if (password.length < 4) errs.pass = 'La contraseña debe tener mínimo 4 caracteres';
    setFieldError(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Acción principal ──────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login(username.trim(), password);
      // Redirigir al home (también lo hace _layout.tsx al detectar isAuthenticated=true)
      router.replace('/(tabs)/home');
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        Alert.alert(
          'Acceso denegado',
          'Usuario o contraseña incorrectos.\nVerifica tus datos e intenta de nuevo.',
          [{ text: 'Reintentar', style: 'default' }]
        );
      } else if (!e?.response) {
        Alert.alert(
          'Sin conexión',
          'No se puede conectar al servidor.\n\n• Verifica que el backend esté activo\n• Revisa la IP en src/config.ts\n• Asegúrate de estar en la misma red Wi-Fi',
          [{ text: 'Entendido', style: 'cancel' }]
        );
      } else {
        Alert.alert(
          'Error inesperado',
          e?.response?.data?.error ?? 'Ocurrió un error. Intenta nuevamente.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* Fondo degradado: #0052CC → #003D99 → #00D4FF */}
      <LinearGradient
        colors={[C.primary, C.primaryDark, C.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Círculos decorativos de fondo */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Sección logo / título ── */}
          <View style={styles.header}>
            <LinearGradient
              colors={['rgba(255,255,255,0.30)', 'rgba(255,255,255,0.08)']}
              style={styles.logoBox}
            >
              <Ionicons name="cart" size={46} color={C.white} />
            </LinearGradient>
            <Text style={styles.appName}>CompraPro</Text>
            <Text style={styles.appTagline}>Sistema de Gestión de Compras</Text>
          </View>

          {/* ── Card del formulario ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bienvenido de vuelta</Text>
            <Text style={styles.cardSub}>Ingresa tus credenciales para continuar</Text>

            {/* Campo: Usuario */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Usuario</Text>
              <View style={[styles.fieldRow, !!fieldError.user && styles.fieldRowErr]}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={C.textSecondary}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.fieldInput}
                  value={username}
                  onChangeText={(v) => {
                    setUsername(v);
                    setFieldError((p) => ({ ...p, user: undefined }));
                  }}
                  placeholder="Ingresa tu usuario"
                  placeholderTextColor={C.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!isLoading}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  testID="input-username"
                />
              </View>
              {!!fieldError.user && (
                <Text style={styles.fieldErrMsg}>{fieldError.user}</Text>
              )}
            </View>

            {/* Campo: Contraseña */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Contraseña</Text>
              <View style={[styles.fieldRow, !!fieldError.pass && styles.fieldRowErr]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={C.textSecondary}
                  style={styles.fieldIcon}
                />
                <TextInput
                  ref={passwordRef}
                  style={[styles.fieldInput, { flex: 1 }]}
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    setFieldError((p) => ({ ...p, pass: undefined }));
                  }}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor={C.textTertiary}
                  secureTextEntry={!showPass}
                  returnKeyType="done"
                  editable={!isLoading}
                  onSubmitEditing={handleLogin}
                  testID="input-password"
                />
                <TouchableOpacity
                  onPress={() => setShowPass((v) => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={C.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {!!fieldError.pass && (
                <Text style={styles.fieldErrMsg}>{fieldError.pass}</Text>
              )}
            </View>

            {/* Botón Iniciar Sesión */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.82}
              style={styles.btnWrapper}
              testID="btn-login"
            >
              <LinearGradient
                colors={isLoading ? [C.disabled, C.disabled] : [C.primary, C.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                {isLoading ? (
                  <ActivityIndicator color={C.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.btnText}>Iniciar Sesión</Text>
                    <Ionicons name="arrow-forward" size={18} color={C.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Credenciales de demo */}
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={15} color={C.primary} />
              <Text style={styles.infoText}>
                Demo:{' '}
                <Text style={styles.infoBold}>admin</Text>
                {' / '}
                <Text style={styles.infoBold}>123456</Text>
              </Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 52,
  },

  /* Círculos decorativos */
  circle1: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -80, right: -65,
  },
  circle2: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(0,212,255,0.10)', top: 100, left: -55,
  },
  circle3: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: 110, right: 8,
  },

  /* Header */
  header:     { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 92, height: 92, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: 20,
  },
  appName:    { fontSize: 38, fontWeight: '800', color: '#FFF', letterSpacing: 1.4 },
  appTagline: { fontSize: 14, color: 'rgba(255,255,255,0.68)', marginTop: 7, letterSpacing: 0.4 },

  /* Card */
  card: {
    backgroundColor: '#FFF', borderRadius: 26, padding: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20, shadowRadius: 30, elevation: 14,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  cardSub:   { fontSize: 14, color: '#6B7280', marginBottom: 26 },

  /* Campos */
  fieldGroup:   { marginBottom: 20 },
  fieldLabel:   { fontSize: 13, fontWeight: '600', color: '#1A1A2E', marginBottom: 7 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 14, paddingHorizontal: 14, height: 54,
    backgroundColor: '#F9FAFB',
  },
  fieldRowErr:  { borderColor: '#EF4444' },
  fieldIcon:    { marginRight: 10 },
  fieldInput:   { flex: 1, fontSize: 15, color: '#1A1A2E' },
  fieldErrMsg:  { fontSize: 12, color: '#EF4444', marginTop: 5, marginLeft: 4 },

  /* Botón */
  btnWrapper: { marginTop: 4, marginBottom: 20 },
  btn: {
    height: 56, borderRadius: 16,
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 10,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },

  /* Info demo */
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 13,
  },
  infoText:  { fontSize: 13, color: '#0052CC' },
  infoBold:  { fontWeight: '700' },
});

