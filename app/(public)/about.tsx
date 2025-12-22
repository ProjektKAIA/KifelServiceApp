// app/(public)/about.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Clock, Users, Award } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';

const features = [
  { icon: Shield, title: 'Qualität', desc: 'Höchste Standards in allem was wir tun' },
  { icon: Clock, title: 'Zuverlässigkeit', desc: 'Pünktlich und verlässlich seit 2010' },
  { icon: Users, title: 'Team', desc: 'Über 50 erfahrene Mitarbeiter' },
  { icon: Award, title: 'Erfahrung', desc: 'Mehr als 1.000 zufriedene Kunden' },
];

export default function AboutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.badge, { backgroundColor: theme.pillSuccess }]}>
          <Text style={[styles.badgeText, { color: theme.pillSuccessText }]}>ÖFFENTLICH</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Über uns</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Lernen Sie Kifel Service kennen
        </Text>

        {/* Intro Card */}
        <View style={[styles.introCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.introText, { color: theme.textSecondary }]}>
            Kifel Service ist Ihr verlässlicher Partner für professionelle Dienstleistungen in der Region. 
            Seit über 10 Jahren stehen wir für Qualität, Zuverlässigkeit und Kundenzufriedenheit.
          </Text>
        </View>

        {/* Features */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>UNSERE STÄRKEN</Text>
        
        {features.map((feature, index) => (
          <View
            key={index}
            style={[styles.featureCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          >
            <View style={[styles.featureIcon, { backgroundColor: theme.surface }]}>
              <feature.icon size={22} color={theme.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
              <Text style={[styles.featureDesc, { color: theme.textMuted }]}>{feature.desc}</Text>
            </View>
          </View>
        ))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    padding: spacing.base,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: spacing.lg,
  },
  introCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
  },
});