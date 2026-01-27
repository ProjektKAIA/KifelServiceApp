// app/(admin)/settings/index.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import {
  Bell,
  Shield,
  MapPin,
  Clock,
  Database,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { ThemeToggle } from '@/src/components/molecules/ThemeToggle';
import { LanguageSelector } from '@/src/components/molecules/LanguageSelector';
import { LocationPermissionModal } from '@/src/components/molecules/LocationPermissionModal';
import { useTranslation } from '@/src/hooks/useTranslation';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState(true);
  const [gpsTracking, setGpsTracking] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  // Check current location permission status on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermissionStatus(status);
      setGpsTracking(status === 'granted');
    } catch (error) {
      console.log('Error checking location permission:', error);
    }
  };

  const handleGpsToggle = async (value: boolean) => {
    if (value) {
      // User wants to enable GPS
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === 'granted') {
        // Already have permission
        setGpsTracking(true);
      } else if (status === 'undetermined') {
        // Show our custom modal first
        setShowLocationModal(true);
      } else {
        // Permission was denied before - show alert to go to settings
        Alert.alert(
          t('settings.locationRequired'),
          t('settings.locationDenied'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('settings.openSettings'), onPress: () => Linking.openSettings() },
          ]
        );
      }
    } else {
      // User wants to disable GPS
      setGpsTracking(false);
    }
  };

  const handleLocationAllow = async () => {
    setShowLocationModal(false);

    // Request the actual permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermissionStatus(status);

    if (status === 'granted') {
      setGpsTracking(true);
    } else {
      Alert.alert(
        t('settings.permissionDenied'),
        t('settings.noGpsWithoutPermission'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const handleLocationDeny = () => {
    setShowLocationModal(false);
    setGpsTracking(false);
  };

  const handleLogout = () => {
    Alert.alert(t('settings.logout'), t('settings.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  const getInitials = (): string => {
    if (!user) return 'AD';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const menuSections = [
    {
      title: t('settings.appSettings'),
      items: [
        { icon: Bell, label: t('settings.notifications'), toggle: true, value: notifications, onToggle: setNotifications },
        { icon: MapPin, label: t('settings.gpsTracking'), toggle: true, value: gpsTracking, onToggle: handleGpsToggle },
      ],
    },
    {
      title: t('settings.system'),
      items: [
        { icon: Clock, label: t('settings.workingHours'), onPress: () => router.push('/(admin)/settings/workinghours') },
        { icon: Database, label: t('settings.exportData'), onPress: () => router.push('/(admin)/settings/export') },
        { icon: Shield, label: t('settings.privacySecurity'), onPress: () => router.push('/(admin)/settings/privacy') },
      ],
    },
    {
      title: t('settings.help'),
      items: [
        { icon: HelpCircle, label: t('settings.contactSupport'), onPress: () => router.push('/(admin)/settings/support') },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>{t('settings.admin')}</Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>{t('settings.title')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(admin)/settings/profile')}
          activeOpacity={0.7}
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.avatarText, { color: theme.textInverse }]}>{getInitials()}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={[styles.profileRole, { color: theme.textMuted }]}>{t('settings.administrator')}</Text>
            <Text style={[styles.profileHint, { color: theme.primary }]}>{t('settings.editProfile')}</Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </TouchableOpacity>

        {/* Theme Selection */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t('settings.appearance')}</Text>
        <View style={[styles.themeCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.themeLabel, { color: theme.text }]}>{t('settings.colorScheme')}</Text>
          <ThemeToggle />
        </View>

        {/* Language Selection */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t('settings.language')}</Text>
        <View style={[styles.themeCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.themeLabel, { color: theme.text }]}>{t('settings.languageLabel')}</Text>
          <LanguageSelector />
        </View>

        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{section.title}</Text>
            <View style={[styles.menuCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
                  ]}
                  onPress={'onPress' in item ? item.onPress : undefined}
                  disabled={'toggle' in item && item.toggle}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <item.icon size={20} color={theme.textSecondary} />
                    <Text style={[styles.menuItemLabel, { color: theme.text }]}>{item.label}</Text>
                  </View>
                  {'toggle' in item && item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: theme.surface, true: theme.secondary }}
                      thumbColor={theme.textInverse}
                    />
                  ) : (
                    <ChevronRight size={18} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color={theme.danger} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>{t('settings.logout')}</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: theme.textMuted }]}>Version 1.0.0 (Admin)</Text>
      </ScrollView>

      {/* Location Permission Modal */}
      <LocationPermissionModal
        visible={showLocationModal}
        onAllow={handleLocationAllow}
        onDeny={handleLocationDeny}
        onClose={() => setShowLocationModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing['3xl'] },
  header: { marginBottom: spacing.xl },
  headerSmall: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  headerLarge: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  profileCard: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, marginBottom: spacing.xl },
  avatar: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 50, height: 50, borderRadius: 14 },
  avatarText: { fontSize: 18, fontWeight: '700' },
  profileInfo: { flex: 1, marginLeft: spacing.md },
  profileName: { fontSize: 16, fontWeight: '600' },
  profileRole: { fontSize: 13, marginTop: 2 },
  profileHint: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
  themeCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, marginBottom: spacing.md },
  themeLabel: { fontSize: 15, fontWeight: '500', marginBottom: spacing.md },
  menuCard: { borderRadius: borderRadius.card, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuItemLabel: { fontSize: 15 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: 16, marginTop: spacing.xl },
  logoutText: { fontSize: 15, fontWeight: '600' },
  versionText: { textAlign: 'center', fontSize: 12, marginTop: spacing.lg },
});
