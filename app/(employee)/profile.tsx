// app/(employee)/profile.tsx

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Mail, Phone, MapPin, Bell, Moon, Shield, HelpCircle, LogOut } from 'lucide-react-native';

import { Typography, Button } from '@/src/components/atoms';
import { ScreenHeader, ProfileCard, MenuSection } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/store/authStore';
import { spacing } from '@/src/constants/spacing';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, toggleTheme, isDark } = useTheme();
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
    { icon: Moon, label: 'Dark Mode', value: isDark, isToggle: true, onToggle: toggleTheme },
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
        <MenuSection title="EINSTELLUNGEN" items={settingsItems} />
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
  logoutButton: {
    marginTop: spacing.lg,
  },
  version: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});