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
import { LocationPermissionModal } from '@/src/components/molecules/LocationPermissionModal';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, logout } = useAuthStore();

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
          'Standortberechtigung erforderlich',
          'Die Standortberechtigung wurde zuvor verweigert. Bitte aktivieren Sie sie in den Geräte-Einstellungen.',
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Einstellungen öffnen', onPress: () => Linking.openSettings() },
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
        'Berechtigung verweigert',
        'Ohne Standortberechtigung kann GPS-Tracking nicht aktiviert werden.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLocationDeny = () => {
    setShowLocationModal(false);
    setGpsTracking(false);
  };

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

  const getInitials = (): string => {
    if (!user) return 'AD';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const menuSections = [
    {
      title: 'APP-EINSTELLUNGEN',
      items: [
        { icon: Bell, label: 'Benachrichtigungen', toggle: true, value: notifications, onToggle: setNotifications },
        { icon: MapPin, label: 'GPS-Tracking aktiv', toggle: true, value: gpsTracking, onToggle: handleGpsToggle },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { icon: Clock, label: 'Arbeitszeit-Regeln', onPress: () => router.push('/(admin)/settings/workinghours') },
        { icon: Database, label: 'Daten exportieren', onPress: () => Alert.alert('Export', 'Daten werden exportiert...') },
        { icon: Shield, label: 'Datenschutz & Sicherheit', onPress: () => router.push('/(admin)/settings/privacy') },
      ],
    },
    {
      title: 'HILFE',
      items: [
        { icon: HelpCircle, label: 'Support kontaktieren', onPress: () => router.push('/(admin)/settings/support') },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Verwaltung</Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>Einstellungen</Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={[styles.avatar, { backgroundColor: theme.secondary }]}>
            <Text style={[styles.avatarText, { color: theme.textInverse }]}>{getInitials()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={[styles.profileRole, { color: theme.textMuted }]}>Administrator</Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </View>

        {/* Theme Selection */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ERSCHEINUNGSBILD</Text>
        <View style={[styles.themeCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.themeLabel, { color: theme.text }]}>Farbschema</Text>
          <ThemeToggle />
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
                  onPress={item.onPress}
                  disabled={item.toggle}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <item.icon size={20} color={theme.textSecondary} />
                    <Text style={[styles.menuItemLabel, { color: theme.text }]}>{item.label}</Text>
                  </View>
                  {item.toggle ? (
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
          <Text style={[styles.logoutText, { color: theme.danger }]}>Abmelden</Text>
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
  avatarText: { fontSize: 18, fontWeight: '700' },
  profileInfo: { flex: 1, marginLeft: spacing.md },
  profileName: { fontSize: 16, fontWeight: '600' },
  profileRole: { fontSize: 13, marginTop: 2 },
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
