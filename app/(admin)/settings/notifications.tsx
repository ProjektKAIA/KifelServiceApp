// app/(admin)/settings/notifications.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Bell,
  BellOff,
  MessageCircle,
  Calendar,
  Clock,
  Moon,
  Plane,
  Users,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTranslation } from '@/src/hooks/useTranslation';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';
import Toast from 'react-native-toast-message';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const {
    isEnabled,
    isFeatureAvailable,
    permissionStatus,
    preferences,
    isLoading,
    isSaving,
    enableNotifications,
    setPreference,
    toggleQuietHours,
  } = usePushNotifications();

  const [isEnabling, setIsEnabling] = useState(false);

  // Handle enabling notifications
  const handleEnableNotifications = async () => {
    if (isEnabling) return;

    setIsEnabling(true);
    try {
      const success = await enableNotifications();

      if (success) {
        Toast.show({
          type: 'success',
          text1: t('notifications.enabled'),
          text2: t('notifications.enabledDesc'),
        });
      } else if (permissionStatus === 'denied') {
        Alert.alert(
          t('notifications.permissionDenied'),
          t('notifications.openSettingsDesc'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('settings.openSettings'),
              onPress: () => {
                // Platform-specific settings opening would go here
              },
            },
          ]
        );
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('notifications.enableError'),
      });
    } finally {
      setIsEnabling(false);
    }
  };

  // Handle toggling master switch
  const handleToggleMaster = async (value: boolean) => {
    if (!preferences) return;

    try {
      await setPreference('enabled', value);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('notifications.saveError'),
      });
    }
  };

  // Handle toggling category
  const handleToggleCategory = async (
    key: 'vacationRequests' | 'vacationUpdates' | 'chatMessages' | 'chatMentions' | 'shiftChanges',
    value: boolean
  ) => {
    if (!preferences) return;

    try {
      await setPreference(key, value);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('notifications.saveError'),
      });
    }
  };

  // Handle quiet hours toggle
  const handleToggleQuietHours = async (value: boolean) => {
    try {
      await toggleQuietHours(value);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('notifications.saveError'),
      });
    }
  };

  // Show feature not available message
  if (!isFeatureAvailable) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t('notifications.title')}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <BellOff size={48} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {t('notifications.featureDisabled')}
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>
            {t('notifications.featureDisabledDesc')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show enable button if not enabled
  if (!isEnabled && permissionStatus !== 'granted') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t('notifications.title')}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.enableContainer}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
            <Bell size={48} color={theme.primary} />
          </View>
          <Text style={[styles.enableTitle, { color: theme.text }]}>
            {t('notifications.enableTitle')}
          </Text>
          <Text style={[styles.enableDesc, { color: theme.textMuted }]}>
            {t('notifications.enableDesc')}
          </Text>
          <TouchableOpacity
            style={[styles.enableButton, { backgroundColor: theme.primary }]}
            onPress={handleEnableNotifications}
            disabled={isEnabling || isLoading}
          >
            <Bell size={20} color={theme.textInverse} />
            <Text style={[styles.enableButtonText, { color: theme.textInverse }]}>
              {isEnabling ? t('common.loading') : t('notifications.enableButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('notifications.title')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Master Switch */}
        <View style={[styles.masterCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.masterContent}>
            <View style={[styles.masterIcon, { backgroundColor: preferences?.enabled ? theme.primary + '20' : theme.surface }]}>
              {preferences?.enabled ? (
                <Bell size={24} color={theme.primary} />
              ) : (
                <BellOff size={24} color={theme.textMuted} />
              )}
            </View>
            <View style={styles.masterText}>
              <Text style={[styles.masterTitle, { color: theme.text }]}>
                {t('notifications.masterSwitch')}
              </Text>
              <Text style={[styles.masterDesc, { color: theme.textMuted }]}>
                {preferences?.enabled
                  ? t('notifications.masterEnabled')
                  : t('notifications.masterDisabled')}
              </Text>
            </View>
          </View>
          <Switch
            value={preferences?.enabled ?? false}
            onValueChange={handleToggleMaster}
            trackColor={{ false: theme.surface, true: theme.primary }}
            thumbColor={theme.textInverse}
            disabled={isSaving}
          />
        </View>

        {/* Categories */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
          {t('notifications.categories')}
        </Text>

        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          {/* Vacation Requests */}
          <View style={[styles.item, { borderBottomColor: theme.borderLight }]}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: theme.warning + '20' }]}>
                <Plane size={18} color={theme.warning} />
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>
                  {t('notifications.vacationRequests')}
                </Text>
                <Text style={[styles.itemDesc, { color: theme.textMuted }]}>
                  {t('notifications.vacationRequestsDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences?.vacationRequests ?? true}
              onValueChange={(v) => handleToggleCategory('vacationRequests', v)}
              trackColor={{ false: theme.surface, true: theme.primary }}
              thumbColor={theme.textInverse}
              disabled={!preferences?.enabled || isSaving}
            />
          </View>

          {/* Vacation Updates */}
          <View style={[styles.item, { borderBottomColor: theme.borderLight }]}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: theme.success + '20' }]}>
                <Calendar size={18} color={theme.success} />
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>
                  {t('notifications.vacationUpdates')}
                </Text>
                <Text style={[styles.itemDesc, { color: theme.textMuted }]}>
                  {t('notifications.vacationUpdatesDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences?.vacationUpdates ?? true}
              onValueChange={(v) => handleToggleCategory('vacationUpdates', v)}
              trackColor={{ false: theme.surface, true: theme.primary }}
              thumbColor={theme.textInverse}
              disabled={!preferences?.enabled || isSaving}
            />
          </View>

          {/* Chat Messages */}
          <View style={[styles.item, { borderBottomColor: theme.borderLight }]}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: theme.primary + '20' }]}>
                <MessageCircle size={18} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>
                  {t('notifications.chatMessages')}
                </Text>
                <Text style={[styles.itemDesc, { color: theme.textMuted }]}>
                  {t('notifications.chatMessagesDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences?.chatMessages ?? true}
              onValueChange={(v) => handleToggleCategory('chatMessages', v)}
              trackColor={{ false: theme.surface, true: theme.primary }}
              thumbColor={theme.textInverse}
              disabled={!preferences?.enabled || isSaving}
            />
          </View>

          {/* Chat Mentions */}
          <View style={[styles.item, { borderBottomColor: theme.borderLight }]}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: theme.secondary + '20' }]}>
                <Users size={18} color={theme.secondary} />
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>
                  {t('notifications.chatMentions')}
                </Text>
                <Text style={[styles.itemDesc, { color: theme.textMuted }]}>
                  {t('notifications.chatMentionsDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences?.chatMentions ?? true}
              onValueChange={(v) => handleToggleCategory('chatMentions', v)}
              trackColor={{ false: theme.surface, true: theme.primary }}
              thumbColor={theme.textInverse}
              disabled={!preferences?.enabled || isSaving}
            />
          </View>

          {/* Shift Changes */}
          <View style={styles.itemLast}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: theme.danger + '20' }]}>
                <Clock size={18} color={theme.danger} />
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>
                  {t('notifications.shiftChanges')}
                </Text>
                <Text style={[styles.itemDesc, { color: theme.textMuted }]}>
                  {t('notifications.shiftChangesDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences?.shiftChanges ?? true}
              onValueChange={(v) => handleToggleCategory('shiftChanges', v)}
              trackColor={{ false: theme.surface, true: theme.primary }}
              thumbColor={theme.textInverse}
              disabled={!preferences?.enabled || isSaving}
            />
          </View>
        </View>

        {/* Quiet Hours */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
          {t('notifications.quietHours')}
        </Text>

        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.itemLast}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: theme.textMuted + '20' }]}>
                <Moon size={18} color={theme.textMuted} />
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>
                  {t('notifications.quietHoursSwitch')}
                </Text>
                <Text style={[styles.itemDesc, { color: theme.textMuted }]}>
                  {preferences?.quietHoursEnabled
                    ? `${preferences.quietHoursStart} - ${preferences.quietHoursEnd}`
                    : t('notifications.quietHoursDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences?.quietHoursEnabled ?? false}
              onValueChange={handleToggleQuietHours}
              trackColor={{ false: theme.surface, true: theme.primary }}
              thumbColor={theme.textInverse}
              disabled={!preferences?.enabled || isSaving}
            />
          </View>
        </View>

        {/* Info Note */}
        <Text style={[styles.note, { color: theme.textMuted }]}>
          {t('notifications.deviceNote')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  masterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  masterIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  masterText: {
    flex: 1,
  },
  masterTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  masterDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  itemLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  enableContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  enableDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.button,
    marginTop: spacing.xl,
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
