// app/(auth)/login.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, X } from 'lucide-react-native';
// LinearGradient benötigt: npx expo install expo-linear-gradient
// Fallback: einfache Box mit Primärfarbe
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus.');
      return;
    }

    const success = await login(email, password);
    if (success) {
      router.replace('/(employee)');
    } else {
      Alert.alert('Fehler', 'Ungültige Anmeldedaten.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Header with Close Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
            <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>LOGIN</Text>
          </View>
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBox}>
            <User size={32} color="#fff" strokeWidth={1.5} />
          </View>
        </View>

        {/* Header */}
        <Text style={[styles.title, { color: theme.text }]}>Anmelden</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Zugang zum Mitarbeiterbereich</Text>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.inputBackground, 
              borderColor: theme.inputBorder,
              color: theme.text 
            }]}
            placeholder="E-Mail oder Benutzername"
            placeholderTextColor={theme.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.inputBackground, 
              borderColor: theme.inputBorder,
              color: theme.text 
            }]}
            placeholder="Passwort"
            placeholderTextColor={theme.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Wird angemeldet...' : 'Einloggen'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.helpText, { color: theme.textMuted }]}>
            Passwort vergessen?{'\n'}Bitte an die Personalabteilung wenden.
          </Text>

          {/* Dev Access */}
          <View style={[styles.devSection, { borderTopColor: theme.borderLight }]}>
            <Text style={[styles.devLabel, { color: theme.textMuted }]}>ENTWICKLER-ZUGANG</Text>
            <View style={styles.devButtons}>
              <TouchableOpacity
                style={[styles.devButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                onPress={async () => {
                  try {
                    await login('max@kifel.de', 'max123');
                    router.replace('/(employee)');
                  } catch {}
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.devButtonText, { color: theme.text }]}>Mitarbeiter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devButton, { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)' }]}
                onPress={async () => {
                  try {
                    await login('admin@kifel.de', 'admin123');
                    router.replace('/(admin)');
                  } catch {}
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.devButtonText, { color: '#a855f7' }]}>Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.base,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    height: 52,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    fontSize: 15,
  },
  loginButton: {
    height: 52,
    borderRadius: borderRadius.input,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  helpText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.lg,
  },
  devSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  devLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  devButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  devButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: borderRadius.card,
    borderWidth: 1,
  },
  devButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});