// app/(public)/about.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Sparkles, Users, Leaf, Globe, ImageIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { SocialMediaButtons } from '@/src/components/molecules';

const COMPANY = {
  website: 'https://kifel-service.com',
};

function GlassCard({
  children,
  isDark,
  style,
}: {
  children: React.ReactNode;
  isDark: boolean;
  style?: any;
}) {
  return (
    <View style={[styles.glassCardWrapper, style]}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.03)']
            : ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.55)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.glassCard,
          { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.85)' },
        ]}
      >
        <View
          style={[
            styles.glassCardHighlight,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)' },
          ]}
        />
        {children}
      </LinearGradient>
    </View>
  );
}

export default function AboutScreen() {
  const router = useRouter();
  const { theme, colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const isDark = colorScheme === 'dark';

  const features = [
    { icon: Shield, title: t('about.security'), desc: t('about.securityDesc'), color: '#6366f1' },
    { icon: Sparkles, title: t('about.cleaning'), desc: t('about.cleaningDesc'), color: '#f59e0b' },
    { icon: Users, title: t('about.ownTeam'), desc: t('about.ownTeamDesc'), color: '#3b82f6' },
    { icon: Leaf, title: t('about.eco'), desc: t('about.ecoDesc'), color: '#10b981' },
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
    <LinearGradient
      colors={isDark ? [theme.background, theme.background] : ['#f0f4ff', '#e8edf8', '#f5f5fa']}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/kifel-service-logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Text style={[styles.title, { color: isDark ? '#f0f0f0' : '#1a1a2e' }]}>{t('about.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{t('about.subtitle')}</Text>

        {/* Firmenbild Platzhalter */}
        <View style={[styles.imagePlaceholder, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        }]}>
          <ImageIcon size={40} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} />
          <Text style={[styles.imagePlaceholderText, { color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)' }]}>
            Firmenbild
          </Text>
        </View>

        {/* Intro Card */}
        <GlassCard isDark={isDark}>
          <View style={styles.introContent}>
            <Text style={[styles.introText, { color: isDark ? '#d0d0d0' : '#374151' }]}>
              {t('about.companyDesc')}
            </Text>
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
            <Text style={[styles.introText, { color: isDark ? '#d0d0d0' : '#374151' }]}>
              {t('about.environmentNote')}
            </Text>
          </View>
        </GlassCard>

        {/* Features */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('about.strengths')}</Text>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <GlassCard key={index} isDark={isDark} style={styles.featureCardWrapper}>
              <View style={styles.featureInner}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
                  <feature.icon size={22} color={feature.color} />
                </View>
                <Text style={[styles.featureTitle, { color: isDark ? '#f0f0f0' : '#1a1a2e' }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDesc, { color: theme.textMuted }]}>{feature.desc}</Text>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Services */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: spacing.lg }]}>
          {t('about.services')}
        </Text>

        <View style={styles.servicesRow}>
          {/* Reinigung */}
          <GlassCard isDark={isDark} style={styles.serviceCardWrapper}>
            <View style={styles.serviceInner}>
              <View style={styles.serviceHeader}>
                <View style={[styles.serviceIconBadge, { backgroundColor: '#f59e0b15' }]}>
                  <Sparkles size={16} color="#f59e0b" />
                </View>
                <Text style={[styles.serviceTitle, { color: isDark ? '#f0f0f0' : '#1a1a2e' }]}>
                  {t('about.cleaning')}
                </Text>
              </View>
              {services.reinigung.map((service, index) => (
                <View key={index} style={styles.serviceItemRow}>
                  <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={[styles.serviceItem, { color: isDark ? '#c0c0c0' : '#4b5563' }]}>
                    {service}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* Sicherheit */}
          <GlassCard isDark={isDark} style={styles.serviceCardWrapper}>
            <View style={styles.serviceInner}>
              <View style={styles.serviceHeader}>
                <View style={[styles.serviceIconBadge, { backgroundColor: '#6366f115' }]}>
                  <Shield size={16} color="#6366f1" />
                </View>
                <Text style={[styles.serviceTitle, { color: isDark ? '#f0f0f0' : '#1a1a2e' }]}>
                  {t('about.security')}
                </Text>
              </View>
              {services.sicherheit.map((service, index) => (
                <View key={index} style={styles.serviceItemRow}>
                  <View style={[styles.dot, { backgroundColor: '#6366f1' }]} />
                  <Text style={[styles.serviceItem, { color: isDark ? '#c0c0c0' : '#4b5563' }]}>
                    {service}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        {/* Website Button */}
        <TouchableOpacity
          onPress={() => Linking.openURL(COMPANY.website)}
          activeOpacity={0.8}
          style={styles.websiteWrapper}
        >
          <LinearGradient
            colors={isDark ? ['#3b6fd4', '#2851a3'] : ['#4a90e2', '#3572c6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.websiteButton}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <Globe size={18} color="#fff" />
            <Text style={styles.websiteButtonText}>{t('about.website')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Social Media */}
        <View style={styles.socialSection}>
          <SocialMediaButtons size="medium" glassEffect={true} />
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  headerLogo: {
    height: 55,
    width: 240,
  },
  content: {
    padding: spacing.base,
    paddingTop: 0,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  // Image Placeholder
  imagePlaceholder: {
    height: 200,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Glass Card
  glassCardWrapper: {
    borderRadius: 20,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  glassCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  glassCardHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    borderRadius: 1,
  },
  // Intro
  introContent: {
    padding: 20,
  },
  introText: {
    fontSize: 15,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  // Section Label
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  // Features Grid (2x2)
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCardWrapper: {
    width: '47%',
    flexGrow: 1,
    marginBottom: 0,
  },
  featureInner: {
    padding: 16,
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  // Services
  servicesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceCardWrapper: {
    flex: 1,
    marginBottom: 0,
  },
  serviceInner: {
    padding: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  serviceIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  serviceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  serviceItem: {
    fontSize: 13,
    flex: 1,
  },
  // Website Button
  websiteWrapper: {
    borderRadius: 20,
    marginTop: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
    overflow: 'hidden',
  },
  websiteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  socialSection: {
    marginTop: spacing.lg,
  },
});
