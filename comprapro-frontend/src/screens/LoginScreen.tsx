import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Dimensions, StatusBar, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await login(username.trim(), password);
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Error de conexión. Verifica que el backend esté activo.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient
        colors={[COLORS.primary, '#003D99', '#00B8D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Círculos decorativos */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Logo y titulo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.logoGradient}
              >
                <Ionicons name="cart" size={44} color={COLORS.white} />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>CompraPro</Text>
            <Text style={styles.appTagline}>Sistema de Gestión de Compras</Text>
          </View>

          {/* Card del formulario */}
          <View style={styles.card}>
            <Text style={styles.welcomeText}>Bienvenido de vuelta</Text>
            <Text style={styles.subtitleText}>Ingresa tus credenciales para continuar</Text>

            {/* Campo usuario */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Usuario</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Ingresa tu usuario"
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Campo contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputPassword]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor={COLORS.textTertiary}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error mensaje */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Botón login */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtnGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Credenciales demo */}
            <View style={styles.demoBox}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.info} />
              <Text style={styles.demoText}>
                Demo: <Text style={styles.demoBold}>admin</Text> / <Text style={styles.demoBold}>123456</Text>
              </Text>
            </View>
          </View>

          <Text style={styles.version}>v1.0.0 · CompraPro © 2024</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  gradient: { ...StyleSheet.absoluteFillObject },
  circle1: {
    position: 'absolute', width: 300, height: 300,
    borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.04)',
    top: -80, right: -80,
  },
  circle2: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: 100, backgroundColor: 'rgba(0,212,255,0.1)',
    top: 100, left: -60,
  },
  circle3: {
    position: 'absolute', width: 150, height: 150,
    borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 200, right: -30,
  },
  keyboardView: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl },

  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logoContainer: { marginBottom: SPACING.md },
  logoGradient: {
    width: 90, height: 90, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  appName: {
    fontSize: FONTS.sizes.xxxl, fontWeight: '800',
    color: COLORS.white, letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.75)',
    marginTop: 4, letterSpacing: 0.3,
  },

  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.xl, ...SHADOWS.lg,
  },
  welcomeText: {
    fontSize: FONTS.sizes.xxl, fontWeight: '700',
    color: COLORS.text, marginBottom: 4,
  },
  subtitleText: {
    fontSize: FONTS.sizes.sm, color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },

  inputGroup: { marginBottom: SPACING.md },
  inputLabel: {
    fontSize: FONTS.sizes.sm, fontWeight: '600',
    color: COLORS.text, marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1, height: 52, fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  inputPassword: { paddingRight: 40 },
  eyeBtn: { padding: SPACING.xs },

  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF1EE', borderRadius: RADIUS.sm,
    padding: SPACING.sm, marginBottom: SPACING.md,
    borderLeftWidth: 3, borderLeftColor: COLORS.danger,
  },
  errorText: {
    fontSize: FONTS.sizes.sm, color: COLORS.danger,
    marginLeft: SPACING.xs, flex: 1,
  },

  loginBtn: { marginTop: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOWS.md },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: SPACING.sm,
  },
  loginBtnText: {
    color: COLORS.white, fontSize: FONTS.sizes.lg,
    fontWeight: '700', letterSpacing: 0.3,
  },

  demoBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EBF5FF', borderRadius: RADIUS.sm,
    padding: SPACING.sm, marginTop: SPACING.md, gap: SPACING.xs,
  },
  demoText: { fontSize: FONTS.sizes.xs, color: COLORS.info },
  demoBold: { fontWeight: '700' },

  version: {
    textAlign: 'center', color: 'rgba(255,255,255,0.5)',
    fontSize: FONTS.sizes.xs, marginTop: SPACING.lg,
  },
});
