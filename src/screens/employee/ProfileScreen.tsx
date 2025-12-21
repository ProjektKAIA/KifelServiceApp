// src/screens/employee/ProfileScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useColorScheme,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Mail, 
  Phone, 
  Bell, 
  Moon, 
  Shield, 
  HelpCircle, 
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const { user, logout } = useAuthStore();

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(colorScheme === 'dark');

  const handleLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Abmelden', 
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const getInitials = () => {
    if (!user) return 'MM';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const menuSections = [
    {
      title: 'KONTO',
      items: [
        { 
          icon: Mail, 
          label: 'E-Mail', 
          value: user?.email || 'max@example.com',
          onPress: () => {},
        },
        { 
          icon: Phone, 
          label: 'Telefon', 
          value: user?.phone || 'Nicht hinterlegt',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'EINSTELLUNGEN',
      items: [
        { 
          icon: Bell, 
          label: 'Benachrichtigungen', 
          toggle: true,
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
        { 
          icon: Moon, 
          label: 'Dunkelmodus', 
          toggle: true,
          value: darkModeEnabled,
          onToggle: setDarkModeEnabled,
        },
      ],
    },
    {
      title: 'RECHTLICHES',
      items: [
        { 
          icon: Shield, 
          label: 'Datenschutz', 
          onPress: () => Alert.alert('Datenschutz', 'Datenschutzrichtlinien werden hier angezeigt.'),
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
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>
            Mein Konto
          </Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>
            Profil
          </Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        }]}>
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

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
              {section.title}
            </Text>
            <View style={[styles.menuCard, {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
            }]}>
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
                      value={item.value as boolean}
                      onValueChange={item.onToggle}
                      trackColor={{ false: theme.surface, true: '#3b82f6' }}
                      thumbColor="#fff"
                    />
                  ) : (
                    <View style={styles.menuItemRight}>
                      {item.value && (
                        <Text style={[styles.menuItemValue, { color: theme.textMuted }]}>
                          {item.value}
                        </Text>
                      )}
                      <ChevronRight size={16} color={theme.textMuted} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Abmelden</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={[styles.versionText, { color: theme.textMuted }]}>
          Version 1.0.0
        </Text>
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
  header: {
    marginBottom: spacing.xl,
  },
  headerSmall: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  headerLarge: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  profileCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarLargeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  menuCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuItemValue: {
    fontSize: 13,
    maxWidth: 150,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: 14,
    borderRadius: borderRadius.button,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: spacing.xl,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
  },
});