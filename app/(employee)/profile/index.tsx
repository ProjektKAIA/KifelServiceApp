// app/(employee)/profile/index.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Mail, Phone, MapPin, Calendar, Clock, LogOut, ChevronRight, Sun, Moon, Smartphone, Camera, Bell, Trash2 } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { ThemePreference } from '@/src/store/themeStore';
import { deletionRequestsCollection, adminNotificationsCollection } from '@/src/lib/firestore';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, themePreference, setThemePreference, colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [hasPendingDeletion, setHasPendingDeletion] = useState(false);

  const userName = `${user?.firstName || 'Max'} ${user?.lastName || 'Mustermann'}`;
  const userInitials = `${user?.firstName?.[0] || 'M'}${user?.lastName?.[0] || 'M'}`;

  // Check if there's a pending deletion request
  useEffect(() => {
    if (user?.id) {
      deletionRequestsCollection.getForUser(user.id).then((request) => {
        setHasPendingDeletion(!!request);
      });
    }
  }, [user?.id]);

  const handleRequestDeletion = () => {
    if (!user) return;

    Alert.alert(
      t('deletion.requestTitle'),
      t('deletion.requestConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              const fullName = `${user.firstName} ${user.lastName}`;
              const request = await deletionRequestsCollection.create({
                userId: user.id,
                userName: fullName,
              });

              await adminNotificationsCollection.create({
                type: 'deletion_request',
                userId: user.id,
                userName: fullName,
                title: t('deletion.notificationTitle'),
                message: t('deletion.notificationMessage').replace('{name}', fullName),
                entityId: request.id,
              });

              setHasPendingDeletion(true);
              Alert.alert(t('common.success'), t('deletion.requestSent'));
            } catch (error) {
              Alert.alert(t('common.error'), t('deletion.requestFailed'));
            }
          },
        },
      ]
    );
  };

  const themeOptions: { value: ThemePreference; label: string; icon: any }[] = [
    { value: 'light', label: t('empProfile.themeLight'), icon: Sun },
    { value: 'system', label: t('empProfile.themeSystem'), icon: Smartphone },
    { value: 'dark', label: t('empProfile.themeDark'), icon: Moon },
  ];

  const handleLogout = () => {
    Alert.alert(t('empProfile.logout'), t('empProfile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('empProfile.logout'),
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(public)');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
          <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>{t('empProfile.badge')}</Text>
        </View>

        {/* Avatar & Name */}
        <TouchableOpacity
          style={styles.profileHeader}
          onPress={() => router.push('/(employee)/profile/edit')}
          activeOpacity={0.8}
        >
          <View style={[styles.avatarContainer]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Text style={[styles.avatarText, { color: theme.textInverse }]}>{userInitials}</Text>
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: theme.secondary }]}>
              <Camera size={12} color={theme.textInverse} />
            </View>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
          <Text style={[styles.userRole, { color: theme.textMuted }]}>{t('empProfile.roleEmployee')}</Text>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.infoRow}>
            <Mail size={18} color={theme.textMuted} />
            <Text style={[styles.infoText, { color: theme.text }]}>{user?.email || '-'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
          <View style={styles.infoRow}>
            <Phone size={18} color={theme.textMuted} />
            <Text style={[styles.infoText, { color: theme.text }]}>{user?.phone || t('empProfile.notProvided')}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
          <View style={styles.infoRow}>
            <MapPin size={18} color={theme.textMuted} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              {user?.city ? `${user.zipCode || ''} ${user.city}`.trim() : t('empProfile.notProvided')}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Calendar size={20} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {user?.startDate
                ? `${t('empProfile.since')} ${new Date(user.startDate).getFullYear()}`
                : `${t('empProfile.since')} ${new Date(user?.createdAt || Date.now()).getFullYear()}`}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>{t('empProfile.since')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Clock size={20} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {user?.vacationDaysTotal != null ? `${user.vacationDaysTotal - (user.vacationDaysUsed || 0)}d` : '-'}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>{t('empDashboard.vacationDays')}</Text>
          </View>
        </View>

        {/* Settings */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('empProfile.settings')}</Text>

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
            <Text style={[styles.menuButtonText, { color: theme.text }]}>{t('empProfile.appearance')}</Text>
          </View>
          <View style={styles.menuButtonRight}>
            <Text style={[styles.menuButtonValue, { color: theme.textMuted }]}>
              {themePreference === 'system' ? t('empProfile.themeSystem') : themePreference === 'dark' ? t('empProfile.themeDark') : t('empProfile.themeLight')}
            </Text>
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(employee)/profile/edit')}
          activeOpacity={0.7}
        >
          <View style={styles.menuButtonLeft}>
            <User size={20} color={theme.textSecondary} />
            <Text style={[styles.menuButtonText, { color: theme.text }]}>{t('empProfile.editPersonalData')}</Text>
          </View>
          <ChevronRight size={18} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(employee)/profile/notifications' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.menuButtonLeft}>
            <Bell size={20} color={theme.textSecondary} />
            <Text style={[styles.menuButtonText, { color: theme.text }]}>{t('empProfile.notifications')}</Text>
          </View>
          <ChevronRight size={18} color={theme.textMuted} />
        </TouchableOpacity>

        {/* Deletion Request */}
        {hasPendingDeletion ? (
          <View style={[styles.deletionPendingBanner, { backgroundColor: theme.warning + '15', borderColor: theme.warning + '40' }]}>
            <Trash2 size={18} color={theme.warning} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.menuButtonText, { color: theme.warning }]}>{t('deletion.requestPending')}</Text>
              <Text style={[{ fontSize: 12, color: theme.textMuted, marginTop: 2 }]}>{t('deletion.requestPendingDesc')}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            onPress={handleRequestDeletion}
            activeOpacity={0.7}
          >
            <View style={styles.menuButtonLeft}>
              <Trash2 size={20} color={theme.danger} />
              <Text style={[styles.menuButtonText, { color: theme.danger }]}>{t('deletion.requestButton')}</Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.pillDanger, borderColor: theme.danger }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={theme.danger} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>{t('empProfile.logout')}</Text>
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
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('empProfile.appearance')}</Text>
            
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
                    <Icon size={24} color={isActive ? theme.textInverse : theme.textSecondary} />
                    <Text style={[styles.themeOptionText, { color: isActive ? theme.textInverse : theme.text }]}>
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
              <Text style={[styles.modalButtonText, { color: theme.text }]}>{t('empProfile.done')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingTop: 0,
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
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
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
  deletionPendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
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