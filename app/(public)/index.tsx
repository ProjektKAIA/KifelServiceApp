// app/(public)/index.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, Info, Mail, Users, Lock } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { activeBrand } from '@/src/config';

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const menuItems = [
    { icon: Info, label: 'Über uns', route: '/(public)/about' as const },
    { icon: Mail, label: 'Kontakt', route: '/(public)/contact' as const },
    { icon: Users, label: 'Karriere', route: '/(public)/career' as const },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo Header */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: theme.text }]}>
            {activeBrand.logo.text}
          </Text>
          <Text style={[styles.slogan, { color: theme.textMuted }]}>
            {activeBrand.slogan}
          </Text>
        </View>

        {/* Welcome Card */}
        <View style={[styles.card, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
            <Building2 size={28} color={theme.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Willkommen
          </Text>
          <Text style={[styles.cardDescription, { color: theme.textMuted }]}>
            Professionelle Dienstleistungen mit Qualität und Zuverlässigkeit.
          </Text>
        </View>

        {/* Menu Buttons */}
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuButton, { 
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }]}
            onPress={() => router.push(item.route)}
            activeOpacity={0.7}
          >
            <item.icon size={18} color={theme.textSecondary} />
            <Text style={[styles.menuButtonText, { color: theme.textSecondary }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Login Section */}
        <View style={[styles.loginSection, { borderTopColor: theme.borderLight }]}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Lock size={18} color="#fff" />
            <Text style={styles.loginButtonText}>Mitarbeiter-Login</Text>
          </TouchableOpacity>
          <Text style={[styles.loginHint, { color: theme.textMuted }]}>
            Nur für Mitarbeitende
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingTop: spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  slogan: {
    fontSize: 12,
  },
  card: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  cardDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: 14,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  menuButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: 14,
    borderRadius: borderRadius.button,
    backgroundColor: '#3b82f6',
    marginBottom: spacing.sm,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loginHint: {
    fontSize: 12,
    textAlign: 'center',
  },
});