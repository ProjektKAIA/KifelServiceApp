// app/(public)/index.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Info, Mail, Users, Lock, Monitor } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: theme.pillSuccess }]}>
          <Text style={[styles.badgeText, { color: theme.pillSuccessText }]}>ÖFFENTLICH</Text>
        </View>

        {/* Header */}
        <Text style={[styles.title, { color: theme.text }]}>KIFEL SERVICE</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Ihr Partner für Qualität</Text>

        {/* Welcome Card */}
        <View style={[styles.welcomeCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={[styles.iconBox, { backgroundColor: theme.surface }]}>
            <Monitor size={32} color={theme.primary} />
          </View>
          <Text style={[styles.welcomeTitle, { color: theme.text }]}>Willkommen</Text>
          <Text style={[styles.welcomeText, { color: theme.textMuted }]}>
            Professionelle Dienstleistungen mit{'\n'}Qualität und Zuverlässigkeit.
          </Text>
        </View>

        {/* Menu Buttons */}
        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(public)/about')}
          activeOpacity={0.7}
        >
          <Info size={18} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>Über uns</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(public)/contact')}
          activeOpacity={0.7}
        >
          <Mail size={18} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>Kontakt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(public)/career')}
          activeOpacity={0.7}
        >
          <Users size={18} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>Karriere</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <View style={styles.loginSection}>
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Lock size={18} color="#fff" />
            <Text style={styles.loginButtonText}>Mitarbeiter-Login</Text>
          </TouchableOpacity>
          <Text style={[styles.loginHint, { color: theme.textMuted }]}>Nur für Mitarbeitende</Text>
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
    paddingTop: spacing.xl,
  },
  badge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: spacing.lg,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  welcomeCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  menuButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  loginSection: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  divider: {
    height: 1,
    marginBottom: spacing.lg,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    borderRadius: borderRadius.card,
    backgroundColor: '#3b82f6',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loginHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});