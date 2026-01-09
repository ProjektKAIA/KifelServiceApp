// app/(public)/about.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Sparkles, Users, Leaf, Globe, Building, Lock, Truck } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';

// Company Data
const COMPANY = {
  website: 'https://kifel-service.com',
  description: 'Kifel Service ist Ihr Partner für professionelle Reinigungsdienstleistungen und Sicherheitsdienst in Kaarst und Umgebung.',
  environmentNote: 'Wir setzen auf gründliche Reinigungsmethoden, die Ihre Räumlichkeiten strahlen lassen, ohne dabei die Umwelt zu belasten.',
};

const features = [
  { icon: Shield, title: 'Sicherheit', desc: 'Objektschutz, Revierschutz, Bewachung & Pfortendienst' },
  { icon: Sparkles, title: 'Reinigung', desc: 'Gebäude-, Büro- & Gewerbereinigung' },
  { icon: Users, title: 'Eigenes Team', desc: 'Festangestellte Mitarbeiter, keine Subunternehmer' },
  { icon: Leaf, title: 'Umweltbewusst', desc: 'Umweltfreundliche Reinigungsmethoden' },
];

const services = {
  reinigung: [
    'Gebäudereinigung',
    'Büroreinigung',
    'Gewerbeimmobilien',
    'Hausmeisterservice',
    'Gartenpflege',
  ],
  sicherheit: [
    'Objektschutz',
    'Revierschutzfahrten',
    'Bewachung',
    'Pfortendienst',
  ],
};

export default function AboutScreen() {
  const router = useRouter();
  const { theme } = useTheme();

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
            {COMPANY.description}
          </Text>
          <Text style={[styles.introText, { color: theme.textSecondary, marginTop: spacing.sm }]}>
            {COMPANY.environmentNote}
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

        {/* Services */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: spacing.lg }]}>UNSERE DIENSTLEISTUNGEN</Text>

        <View style={[styles.servicesRow, { gap: spacing.sm }]}>
          {/* Reinigung */}
          <View style={[styles.serviceCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={[styles.serviceHeader, { borderBottomColor: theme.borderLight }]}>
              <Sparkles size={18} color={theme.primary} />
              <Text style={[styles.serviceTitle, { color: theme.text }]}>Reinigung</Text>
            </View>
            {services.reinigung.map((service, index) => (
              <Text key={index} style={[styles.serviceItem, { color: theme.textSecondary }]}>
                • {service}
              </Text>
            ))}
          </View>

          {/* Sicherheit */}
          <View style={[styles.serviceCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={[styles.serviceHeader, { borderBottomColor: theme.borderLight }]}>
              <Shield size={18} color={theme.primary} />
              <Text style={[styles.serviceTitle, { color: theme.text }]}>Sicherheit</Text>
            </View>
            {services.sicherheit.map((service, index) => (
              <Text key={index} style={[styles.serviceItem, { color: theme.textSecondary }]}>
                • {service}
              </Text>
            ))}
          </View>
        </View>

        {/* Website Link */}
        <TouchableOpacity
          style={[styles.websiteButton, { backgroundColor: theme.primary }]}
          onPress={() => Linking.openURL(COMPANY.website)}
          activeOpacity={0.8}
        >
          <Globe size={18} color={theme.textInverse} />
          <Text style={[styles.websiteButtonText, { color: theme.textInverse }]}>Zur Website</Text>
        </TouchableOpacity>
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
  servicesRow: {
    flexDirection: 'row',
  },
  serviceCard: {
    flex: 1,
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  serviceItem: {
    fontSize: 12,
    lineHeight: 20,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: borderRadius.card,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  websiteButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});