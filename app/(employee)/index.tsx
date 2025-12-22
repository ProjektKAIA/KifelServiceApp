// app/(employee)/index.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Calendar, Sun, MessageCircle } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { useTimeStore } from '@/src/store/timeStore';
import { useTheme } from '@/src/hooks/useTheme';

export default function DashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { isTracking } = useTimeStore();

  const greeting = getGreeting();
  const userName = user?.firstName || 'Max Mustermann';

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
          <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>DASHBOARD</Text>
        </View>

        {/* Header */}
        <Text style={[styles.greeting, { color: theme.textMuted }]}>{greeting}</Text>
        <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>

        {/* Shift Card */}
        <View style={[styles.shiftCard, { 
          backgroundColor: isTracking ? 'rgba(34,197,94,0.1)' : theme.cardBackground, 
          borderColor: isTracking ? 'rgba(34,197,94,0.2)' : theme.cardBorder 
        }]}>
          <View style={styles.shiftHeader}>
            <View>
              <Text style={[styles.shiftLabel, { color: theme.textMuted }]}>Aktuelle Schicht</Text>
              <Text style={[styles.shiftTime, { color: theme.text }]}>08:00 – 16:00</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: isTracking ? theme.pillSuccess : theme.pillWarning }]}>
              <View style={[styles.statusDot, { backgroundColor: isTracking ? theme.pillSuccessText : theme.pillWarningText }]} />
              <Text style={[styles.statusText, { color: isTracking ? theme.pillSuccessText : theme.pillWarningText }]}>
                {isTracking ? 'Aktiv' : 'Geplant'}
              </Text>
            </View>
          </View>
          <View style={styles.locationRow}>
            <MapPin size={14} color={theme.textMuted} />
            <Text style={[styles.locationText, { color: theme.textMuted }]}>Standort Forst</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>142</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Stunden / Monat</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>18</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Resturlaub</Text>
          </View>
        </View>

        {/* Quick Access */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>SCHNELLZUGRIFF</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
            onPress={() => router.push('/(employee)/time')}
            activeOpacity={0.8}
          >
            <Clock size={18} color="#fff" />
            <Text style={styles.actionButtonTextWhite}>Zeit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, borderWidth: 1 }]}
            onPress={() => router.push('/(employee)/schedule')}
            activeOpacity={0.7}
          >
            <Calendar size={18} color={theme.textSecondary} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, borderWidth: 1 }]}
            onPress={() => router.push('/(employee)/vacation')}
            activeOpacity={0.7}
          >
            <Sun size={18} color={theme.textSecondary} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Urlaub</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, borderWidth: 1 }]}
            onPress={() => router.push('/(employee)/chat')}
            activeOpacity={0.7}
          >
            <MessageCircle size={18} color={theme.textSecondary} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Chat</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: spacing.lg,
  },
  badge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 13,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  shiftCard: {
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  shiftLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 20,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: borderRadius.card,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonTextWhite: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});