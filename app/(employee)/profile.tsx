// app/(employee)/profile.tsx

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Mail, Phone, MapPin, Bell, Shield, HelpCircle, LogOut } from 'lucide-react-native';

import { Typography, Button } from '@/src/components/atoms';
import { ScreenHeader, ProfileCard, MenuSection } from '@/src/components/organisms';
import { ThemeToggle } from '@/src/components/molecules/ThemeToggle';
import { Card } from '@/src/components/molecules/Card';

import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/store/authStore';
import { spacing } from '@/src/constants/spacing';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState(true);

  const fullName = `${user?.firstName || 'Max'} ${user?.lastName || 'Mustermann'}`;
  const role = user?.role === 'admin' ? 'Administrator' : 'Mitarbeiter';

  const personalItems = [
    { icon: User, label: 'Name', value: fullName },
    { icon: Mail, label: 'E-Mail', value: user?.email || 'max@example.com' },
    { icon: Phone, label: 'Telefon', value: '+49 123 456789' },
    { icon: MapPin, label: 'Standort', value: 'Berlin' },
  ];

  const settingsItems = [
    { icon: Bell, label: 'Benachrichtigungen', value: notifications, isToggle: true, onToggle: setNotifications },
  ];

  const supportItems = [
    { icon: Shield, label: 'Datenschutz', onPress: () => {} },
    { icon: HelpCircle, label: 'Hilfe & Support', onPress: () => {} },
  ];

  const handleLogout = () => {
    Alert.alert('Abmelden', 'Möchten Sie sich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Abmelden',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader overline="EINSTELLUNGEN" title="Mein Profil" />

        <ProfileCard name={fullName} role={role} email={user?.email} />

        <MenuSection title="PERSÖNLICHE DATEN" items={personalItems} />
        <MenuSection title="BENACHRICHTIGUNGEN" items={settingsItems} />

        {/* Theme Selection */}
        <View style={styles.themeSection}>
          <Typography variant="overline" color="muted" style={styles.themeTitle}>
            ERSCHEINUNGSBILD
          </Typography>
          <Card>
            <Typography variant="body" style={styles.themeLabel}>Farbschema</Typography>
            <View style={styles.themeToggleWrapper}>
              <ThemeToggle />
            </View>
          </Card>
        </View>

        <MenuSection title="SUPPORT" items={supportItems} />

        <Button
          title="Abmelden"
          icon={LogOut}
          variant="danger"
          onPress={handleLogout}
          fullWidth
          style={styles.logoutButton}
        />

        <Typography variant="caption" color="muted" style={styles.version}>
          Version 1.0.0
        </Typography>
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
    paddingBottom: spacing['3xl'],
  },
  themeSection: {
    marginBottom: spacing.lg,
  },
  themeTitle: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  themeLabel: {
    marginBottom: spacing.md,
  },
  themeToggleWrapper: {
    marginTop: spacing.xs,
  },
  logoutButton: {
    marginTop: spacing.lg,
  },
  version: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});