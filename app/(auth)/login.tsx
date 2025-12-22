// app/(auth)/login.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Lock, LogIn, ChevronLeft } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const { login, setLoading, isLoading } = useAuthStore();

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const handleLogin = async () => {
    if (!credentials.email || !credentials.password) {
      Alert.alert('Fehler', 'Bitte geben Sie E-Mail und Passwort ein.');
      return;
    }

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock-User - Admin wenn Email "admin" enthält
      const isAdmin = credentials.email.toLowerCase().includes('admin');
      const mockUser = {
        id: '1',
        email: credentials.email,
        firstName: isAdmin ? 'Admin' : 'Max',
        lastName: isAdmin ? 'User' : 'Mustermann',
        role: isAdmin ? 'admin' as const : 'employee' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await login(mockUser, 'mock-token-12345');
      // Navigation wird automatisch durch _layout.tsx gehandelt
    } catch (error) {
      Alert.alert('Fehler', 'Anmeldung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ChevronLeft size={24} color={theme.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <User size={32} color="#fff" />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Anmelden</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Zugang zum Mitarbeiterbereich
            </Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputContainer, {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            }]}>
              <User size={20} color={theme.textMuted} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="E-Mail oder Benutzername"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={credentials.email}
                onChangeText={(text) => setCredentials({ ...credentials, email: text })}
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputContainer, {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            }]}>
              <Lock size={20} color={theme.textMuted} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Passwort"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                value={credentials.password}
                onChangeText={(text) => setCredentials({ ...credentials, password: text })}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <LogIn size={18} color="#fff" />
                  <Text style={styles.loginButtonText}>Einloggen</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.helpContainer}>
            <Text style={[styles.helpText, { color: theme.textMuted }]}>
              Passwort vergessen?
            </Text>
            <Text style={[styles.helpText, { color: theme.textMuted }]}>
              Bitte an die Personalabteilung wenden.
            </Text>
          </View>

          {/* Dev Hint */}
          <View style={[styles.devHint, { backgroundColor: theme.surface }]}>
            <Text style={[styles.devHintText, { color: theme.textMuted }]}>
              Dev: "admin" in E-Mail = Admin-Rolle
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { padding: spacing.base },
  keyboardView: { flex: 1 },
  content: { flex: 1, padding: spacing.base, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: spacing['3xl'] },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5, marginBottom: spacing.sm },
  subtitle: { fontSize: 12 },
  form: { marginBottom: spacing['2xl'] },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  input: { flex: 1, fontSize: 14, padding: 0 },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: 16,
    borderRadius: borderRadius.button,
    backgroundColor: '#3b82f6',
    marginTop: spacing.sm,
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  helpContainer: { alignItems: 'center' },
  helpText: { fontSize: 12, lineHeight: 20, textAlign: 'center' },
  devHint: { marginTop: spacing.xl, padding: spacing.sm, borderRadius: borderRadius.sm, alignItems: 'center' },
  devHintText: { fontSize: 10 },
});