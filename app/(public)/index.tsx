// app/(public)/index.tsx

import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, Info, Mail, Users, Lock } from 'lucide-react-native';

import { Typography, Button } from '@/src/components/atoms';
import { MenuButton } from '@/src/components/molecules';
import { WelcomeCard } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';
import { activeBrand } from '@/src/config';

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const menuItems = [
    { icon: Info, label: 'Über uns', route: '/(public)/about' },
    { icon: Mail, label: 'Kontakt', route: '/(public)/contact' },
    { icon: Users, label: 'Karriere', route: '/(public)/career' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo Header */}
        <View style={styles.header}>
          <Typography variant="h1" style={styles.logo}>
            {activeBrand.logo.text}
          </Typography>
          <Typography variant="caption" color="muted">
            {activeBrand.slogan}
          </Typography>
        </View>

        {/* Welcome Card */}
        <WelcomeCard
          icon={Building2}
          title="Willkommen"
          description="Professionelle Dienstleistungen mit Qualität und Zuverlässigkeit."
        />

        {/* Menu Buttons */}
        {menuItems.map((item, index) => (
          <MenuButton
            key={index}
            icon={item.icon}
            label={item.label}
            onPress={() => router.push(item.route as any)}
            style={styles.menuButton}
          />
        ))}

        {/* Login Section */}
        <View style={[styles.loginSection, { borderTopColor: theme.borderLight }]}>
          <Button
            title="Mitarbeiter-Login"
            icon={Lock}
            variant="primary"
            onPress={() => router.push('/(auth)/login')}
            fullWidth
          />
          <Typography variant="caption" color="muted" style={styles.loginHint}>
            Nur für Mitarbeitende
          </Typography>
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
    marginBottom: spacing.xs,
  },
  menuButton: {
    marginBottom: spacing.sm,
  },
  loginSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
  },
  loginHint: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});