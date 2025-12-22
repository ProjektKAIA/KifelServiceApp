// app/(admin)/settings.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Bell,
  Shield,
  MapPin,
  Clock,
  Database,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
} from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const { user, logout } = useAuthStore();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [gpsTracking, setGpsTracking] = useState(true);

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
        { icon: Moon, label: 'Dunkler Modus', toggle: true, value: darkMode, onToggle: setDarkMode },
        { icon: MapPin, label: 'GPS-Tracking aktiv', toggle: true, value: gpsTracking, onToggle: setGpsTracking },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { icon: Clock, label: 'Arbeitszeit-Regeln', onPress: () => Alert.alert('Info', 'Arbeitszeit-Konfiguration') },
        { icon: Database, label: 'Daten exportieren', onPress: () => Alert.alert('Export', 'Daten werden exportiert...') },
        { icon: Shield, label: 'Datenschutz & Sicherheit', onPress: () => Alert.alert('Datenschutz', 'DSGVO-Einstellungen') },
      ],
    },
    {
      title: 'HILFE',
      items: [
        { icon: HelpCircle, label: 'Support kontaktieren', onPress: () => Alert.alert('Support', 'support@kaiashapes.de') },
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
          <View style={[styles.avatar, { backgroundColor: '#8b5cf6' }]}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={[styles.profileRole, { color: theme.textMuted }]}>Administrator</Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
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
                      trackColor={{ false: theme.surface, true: '#8b5cf6' }}
                      thumbColor="#fff"
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
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Abmelden</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: theme.textMuted }]}>Version 1.0.0 (Admin)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  header: { marginBottom: spacing.xl },
  headerSmall: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  headerLarge: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  profileCard: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, marginBottom: spacing.xl },
  avatar: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  profileInfo: { flex: 1, marginLeft: spacing.md },
  profileName: { fontSize: 16, fontWeight: '600' },
  profileRole: { fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
  menuCard: { borderRadius: borderRadius.card, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuItemLabel: { fontSize: 15 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: 16, marginTop: spacing.xl },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  versionText: { textAlign: 'center', fontSize: 12, marginTop: spacing.lg },
});