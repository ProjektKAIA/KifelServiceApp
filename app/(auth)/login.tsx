// app/(auth)/login.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Users, Shield, Globe } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/hooks/useTheme';

// Social Media Links
const SOCIAL_LINKS = {
  website: 'https://kifel-service.com',
  instagram: 'https://www.instagram.com/kifel.service/',
  facebook: 'https://www.facebook.com/KifelService/',
};

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
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

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/kifel-service-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Header */}
        <Text style={[styles.title, { color: theme.text }]}>Mitarbeiter-Login</Text>
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
            style={[styles.loginButton, { backgroundColor: theme.primary }, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text style={[styles.loginButtonText, { color: theme.textInverse }]}>
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
                style={[styles.devButton, { backgroundColor: theme.pillSuccess, borderColor: theme.success }]}
                onPress={async () => {
                  const success = await login('max@kifel.de', 'max123');
                  if (success) {
                    router.replace('/(employee)');
                  }
                }}
                activeOpacity={0.7}
              >
                <Users size={20} color={theme.pillSuccessText} />
                <Text style={[styles.devButtonText, { color: theme.pillSuccessText }]}>Mitarbeiter</Text>
                <Text style={[styles.devButtonHint, { color: theme.pillSuccessText }]}>max@kifel.de</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devButton, { backgroundColor: theme.pillSecondary, borderColor: theme.secondary }]}
                onPress={async () => {
                  const success = await login('admin@kifel.de', 'admin123');
                  if (success) {
                    router.replace('/(admin)');
                  }
                }}
                activeOpacity={0.7}
              >
                <Shield size={20} color={theme.pillSecondaryText} />
                <Text style={[styles.devButtonText, { color: theme.pillSecondaryText }]}>Admin</Text>
                <Text style={[styles.devButtonHint, { color: theme.pillSecondaryText }]}>admin@kifel.de</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Media Links */}
          <View style={styles.socialSection}>
            <Text style={[styles.socialLabel, { color: theme.textMuted }]}>BESUCHEN SIE UNS</Text>
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                onPress={() => Linking.openURL(SOCIAL_LINKS.website)}
                activeOpacity={0.7}
              >
                <Globe size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                onPress={() => Linking.openURL(SOCIAL_LINKS.instagram)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/174/174855.png' }}
                  style={[styles.socialIcon, { tintColor: theme.textSecondary }]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                onPress={() => Linking.openURL(SOCIAL_LINKS.facebook)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' }}
                  style={[styles.socialIcon, { tintColor: theme.textSecondary }]}
                />
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 200,
    height: 65,
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
    padding: 16,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    gap: 6,
  },
  devButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  devButtonHint: {
    fontSize: 10,
    opacity: 0.8,
  },
  socialSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  socialLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
});