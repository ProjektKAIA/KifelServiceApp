// app/(employee)/profile.tsx

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
  Moon,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const { user, logout } = useAuthStore();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');

  const getInitials = (): string => {
    if (!user) return 'MA';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const handleLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const menuSections = [
    {
      title: 'EINSTELLUNGEN',
      items: [
        {
          icon: Bell,
          label: 'Benachrichtigungen',
          toggle: true,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          icon: Moon,
          label: 'Dunkler Modus',
          toggle: true,
          value: darkMode,
          onToggle: setDarkMode,
        },
      ],
    },
    {
      title: 'WEITERE',
      items: [
        {
          icon: Shield,
          label: 'Datenschutz',
          onPress: () => Alert.alert('Datenschutz', 'Datenschutzrichtlinien anzeigen'),
        },
        {
          icon: HelpCircle,
          label: 'Hilfe & Support',
          onPress: () => Alert.alert('Support', 'Bei Fragen wenden Sie sich an die Personalabteilung.'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Mein Konto</Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>Profil</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{getInitials()}</Text>
          </View>
          <Text style={[styles.profileName, { color: theme.text }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={[styles.profileRole, { color: theme.textMuted }]}>
            {user?.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
          </Text>
        </View>

        {/* Contact Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>KONTAKTDATEN</Text>
          
          <View style={styles.infoRow}>
            <Mail size={18} color={theme.textSecondary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              {user?.email || 'max.mustermann@kifel-service.de'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Phone size={18} color={theme.textSecondary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              +49 123 456789
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <MapPin size={18} color={theme.textSecondary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Standort Forst
            </Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
              {section.title}
            </Text>
            <View style={[styles.menuCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex < section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.borderLight,
                    },
                  ]}
                  onPress={item.onPress}
                  disabled={item.toggle}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <item.icon size={20} color={theme.textSecondary} />
                    <Text style={[styles.menuItemLabel, { color: theme.text }]}>
                      {item.label}
                    </Text>
                  </View>
                  {item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: theme.border, true: theme.primary }}
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

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }]}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#f87171" />
          <Text style={styles.logoutText}>Abmelden</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={[styles.version, { color: theme.textMuted }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing['2xl'] },
  header: { marginBottom: spacing.lg },
  headerSmall: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  headerLarge: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  profileCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarLargeText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  profileRole: { fontSize: 14 },
  infoCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.md, marginLeft: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  infoText: { fontSize: 14 },
  menuCard: { borderRadius: borderRadius.card, borderWidth: 1, marginBottom: spacing.lg, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuItemLabel: { fontSize: 15 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: 16, borderRadius: borderRadius.button, borderWidth: 1 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#f87171' },
  version: { fontSize: 12, textAlign: 'center', marginTop: spacing.xl },
});