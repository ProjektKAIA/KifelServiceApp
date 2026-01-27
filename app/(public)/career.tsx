// app/(public)/career.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Briefcase, MapPin, Clock, ChevronRight, Heart, TrendingUp, Users } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';

const jobs = [
  { id: '1', title: 'Servicetechniker (m/w/d)', location: 'Forst', typeKey: 'career.fullTime' as const },
  { id: '2', title: 'Reinigungskraft (m/w/d)', location: 'Cottbus', typeKey: 'career.partTime' as const },
  { id: '3', title: 'Teamleiter (m/w/d)', location: 'Forst', typeKey: 'career.fullTime' as const },
];

export default function CareerScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const benefits = [
    { icon: Heart, title: t('career.workLife'), desc: t('career.workLifeDesc') },
    { icon: TrendingUp, title: t('career.development'), desc: t('career.developmentDesc') },
    { icon: Users, title: t('career.teamSpirit'), desc: t('career.teamSpiritDesc') },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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
        <Text style={[styles.title, { color: theme.text }]}>{t('career.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {t('career.subtitle')}
        </Text>

        {/* Benefits */}
        <View style={styles.benefitsRow}>
          {benefits.map((benefit, index) => (
            <View
              key={index}
              style={[styles.benefitCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            >
              <View style={[styles.benefitIcon, { backgroundColor: theme.surface }]}>
                <benefit.icon size={20} color={theme.primary} />
              </View>
              <Text style={[styles.benefitTitle, { color: theme.text }]}>{benefit.title}</Text>
              <Text style={[styles.benefitDesc, { color: theme.textMuted }]}>{benefit.desc}</Text>
            </View>
          ))}
        </View>

        {/* Jobs */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('career.openPositions')}</Text>

        {jobs.map((job) => (
          <TouchableOpacity
            key={job.id}
            style={[styles.jobCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            activeOpacity={0.7}
          >
            <View style={styles.jobContent}>
              <View style={[styles.jobIcon, { backgroundColor: theme.surface }]}>
                <Briefcase size={20} color={theme.primary} />
              </View>
              <View style={styles.jobInfo}>
                <Text style={[styles.jobTitle, { color: theme.text }]}>{job.title}</Text>
                <View style={styles.jobMeta}>
                  <View style={styles.jobMetaItem}>
                    <MapPin size={12} color={theme.textMuted} />
                    <Text style={[styles.jobMetaText, { color: theme.textMuted }]}>{job.location}</Text>
                  </View>
                  <View style={styles.jobMetaItem}>
                    <Clock size={12} color={theme.textMuted} />
                    <Text style={[styles.jobMetaText, { color: theme.textMuted }]}>{t(job.typeKey)}</Text>
                  </View>
                </View>
              </View>
            </View>
            <ChevronRight size={20} color={theme.textMuted} />
          </TouchableOpacity>
        ))}

        {/* CTA */}
        <View style={[styles.ctaCard, { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(99,102,241,0.2)' }]}>
          <Text style={[styles.ctaTitle, { color: theme.text }]}>{t('career.initiative')}</Text>
          <Text style={[styles.ctaText, { color: theme.textMuted }]}>
            {t('career.noMatch')}
          </Text>
          <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
            <Text style={styles.ctaButtonText}>{t('career.applyNow')}</Text>
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
  benefitsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  benefitCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.card,
    borderWidth: 1,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  benefitTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 10,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  jobContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  jobIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobMetaText: {
    fontSize: 12,
  },
  ctaCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.button,
    backgroundColor: '#3b82f6',
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
