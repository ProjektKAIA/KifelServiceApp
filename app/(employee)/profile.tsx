// app/(employee)/profile.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Mail, Phone, MapPin, Calendar, Clock, LogOut, ChevronRight, Sun, Moon, Smartphone } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { ThemePreference } from '@/src/store/themeStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, themePreference, setThemePreference, colorScheme } = useTheme();
  const { user, logout } = useAuthStore();

  const [showAppearanceModal, setShowAppearanceModal] = useState(false);

  const userName = `${user?.firstName || 'Max'} ${user?.lastName || 'Mustermann'}`;
  const userInitials = `${user?.firstName?.[0] || 'M'}${user?.lastName?.[0] || 'M'}`;

  const themeOptions: { value: ThemePreference; label: string; icon: any }[] = [
    { value: 'light', label: 'Hell', icon: Sun },
    { value: 'system', label: 'System', icon: Smartphone },
    { value: 'dark', label: 'Dunkel', icon: Moon },
  ];

  const handleLogout = () => {
    Alert.alert('Abmelden', 'Möchten Sie sich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Abmelden',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(public)');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
          <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>PROFIL</Text>
        </View>

        {/* Avatar & Name */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
          <Text style={[styles.userRole, { color: theme.textMuted }]}>Mitarbeiter</Text>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.infoRow}>
            <Mail size={18} color={theme.textMuted} />
            <Text style={[styles.infoText, { color: theme.text }]}>{user?.email || 'max.mustermann@kifel.de'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
          <View style={styles.infoRow}>
            <Phone size={18} color={theme.textMuted} />
            <Text style={[styles.infoText, { color: theme.text }]}>+49 170 1234567</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
          <View style={styles.infoRow}>
            <MapPin size={18} color={theme.textMuted} />
            <Text style={[styles.infoText, { color: theme.text }]}>Standort Forst</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Calendar size={20} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>seit 2022</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Dabei</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Clock size={20} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>1.248h</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Gearbeitet</Text>
          </View>
        </View>

        {/* Settings */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>EINSTELLUNGEN</Text>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => setShowAppearanceModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuButtonLeft}>
            {colorScheme === 'dark' ? (
              <Moon size={20} color={theme.textSecondary} />
            ) : (
              <Sun size={20} color={theme.textSecondary} />
            )}
            <Text style={[styles.menuButtonText, { color: theme.text }]}>Erscheinungsbild</Text>
          </View>
          <View style={styles.menuButtonRight}>
            <Text style={[styles.menuButtonValue, { color: theme.textMuted }]}>
              {themePreference === 'system' ? 'System' : themePreference === 'dark' ? 'Dunkel' : 'Hell'}
            </Text>
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => Alert.alert('Persönliche Daten', 'Diese Funktion wird in einer zukünftigen Version verfügbar sein.')}
          activeOpacity={0.7}
        >
          <View style={styles.menuButtonLeft}>
            <User size={20} color={theme.textSecondary} />
            <Text style={[styles.menuButtonText, { color: theme.text }]}>Persönliche Daten</Text>
          </View>
          <ChevronRight size={18} color={theme.textMuted} />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Abmelden</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Appearance Modal */}
      <Modal
        visible={showAppearanceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAppearanceModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAppearanceModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Erscheinungsbild</Text>
            
            <View style={styles.themeOptions}>
              {themeOptions.map((option) => {
                const isActive = themePreference === option.value;
                const Icon = option.icon;
                
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.themeOption,
                      { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                      isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => setThemePreference(option.value)}
                    activeOpacity={0.7}
                  >
                    <Icon size={24} color={isActive ? '#fff' : theme.textSecondary} />
                    <Text style={[styles.themeOptionText, { color: isActive ? '#fff' : theme.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
              onPress={() => setShowAppearanceModal(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.modalButtonText, { color: theme.text }]}>Fertig</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingTop: spacing.lg,
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
  },
  userRole: {
    fontSize: 14,
    marginTop: 4,
  },
  infoCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 14,
  },
  divider: {
    height: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    gap: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  menuButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  menuButtonValue: {
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginTop: spacing.lg,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    gap: 8,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});