// app/(auth)/login.tsx

import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Lock, LogIn } from 'lucide-react-native';

import { Typography, Button, Input, IconBox } from '@/src/components/atoms';

import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/store/authStore';
import { spacing } from '@/src/constants/spacing';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Fehler', 'Bitte E-Mail und Passwort eingeben.');
      return;
    }

    try {
      await login(email.trim(), password);
      router.replace('/(employee)');
    } catch (error) {
      Alert.alert('Fehler', 'Anmeldung fehlgeschlagen. Bitte prüfen Sie Ihre Zugangsdaten.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <IconBox icon={User} size="xl" backgroundColor="#3b82f6" color="#fff" />
            <Typography variant="h2" style={styles.title}>Anmelden</Typography>
            <Typography variant="caption" color="muted">
              Zugang zum Mitarbeiterbereich
            </Typography>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              icon={User}
              placeholder="E-Mail oder Benutzername"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
              containerStyle={styles.inputSpacing}
            />

            <Input
              icon={Lock}
              placeholder="Passwort"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              containerStyle={styles.inputSpacing}
            />

            <Button
              title="Einloggen"
              icon={LogIn}
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              style={styles.loginButton}
            />
          </View>

          {/* Help */}
          <View style={styles.helpContainer}>
            <Typography variant="caption" color="muted" style={styles.helpText}>
              Passwort vergessen?
            </Typography>
            <Typography variant="caption" color="muted" style={styles.helpText}>
              Bitte an die Personalabteilung wenden.
            </Typography>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.base,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  title: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  form: {
    marginBottom: spacing['2xl'],
  },
  inputSpacing: {
    marginBottom: spacing.md,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  helpContainer: {
    alignItems: 'center',
  },
  helpText: {
    textAlign: 'center',
    lineHeight: 20,
  },
});