// app/(public)/about.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Sparkles, Users, Leaf, Globe, Building, Lock, Truck } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';

// Company Data
const COMPANY = {
  website: 'https://kifel-service.com',
};

export default function AboutScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const features = [
    { icon: Shield, title: t('about.security'), desc: t('about.securityDesc') },
    { icon: Sparkles, title: t('about.cleaning'), desc: t('about.cleaningDesc') },
    { icon: Users, title: t('about.ownTeam'), desc: t('about.ownTeamDesc') },
    { icon: Leaf, title: t('about.eco'), desc: t('about.ecoDesc') },
  ];

  const services = {
    reinigung: [
      t('about.buildingCleaning'),
      t('about.officeCleaning'),
      t('about.commercial'),
      t('about.janitor'),
      t('about.garden'),
    ],
    sicherheit: [
      t('about.objectProtection'),
      t('about.patrol'),
      t('about.guarding'),
      t('about.gate'),
    ],
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top - 20 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.badge, { backgroundColor: theme.pillSuccess }]}>
          <Text style={[styles.badgeText, { color: theme.pillSuccessText }]}>{t('public.badge')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{t('about.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {t('about.subtitle')}
        </Text>

        {/* Intro Card */}
        <View style={[styles.introCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.introText, { color: theme.textSecondary }]}>
            {t('about.companyDesc')}
          </Text>
          <Text style={[styles.introText, { color: theme.textSecondary, marginTop: spacing.sm }]}>
            {t('about.environmentNote')}
          </Text>
        </View>

        {/* Features */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('about.strengths')}</Text>

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
        <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: spacing.lg }]}>{t('about.services')}</Text>

        <View style={[styles.servicesRow, { gap: spacing.sm }]}>
          {/* Reinigung */}
          <View style={[styles.serviceCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={[styles.serviceHeader, { borderBottomColor: theme.borderLight }]}>
              <Sparkles size={18} color={theme.primary} />
              <Text style={[styles.serviceTitle, { color: theme.text }]}>{t('about.cleaning')}</Text>
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
              <Text style={[styles.serviceTitle, { color: theme.text }]}>{t('about.security')}</Text>
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
          <Text style={[styles.websiteButtonText, { color: theme.textInverse }]}>{t('about.website')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
