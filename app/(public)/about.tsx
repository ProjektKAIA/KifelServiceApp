// app/(public)/about.tsx

import React from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building2, Shield, Clock, Users, Award } from 'lucide-react-native';

import { Typography } from '@/src/components/atoms';
import { Card } from '@/src/components/molecules';
import { ScreenHeader, FeatureCard, WelcomeCard } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';
import { activeBrand } from '@/src/config';

export default function AboutScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const features = [
    { icon: Shield, title: 'Zuverlässigkeit', description: 'Pünktlich und professionell bei jedem Einsatz.' },
    { icon: Clock, title: 'Flexibilität', description: 'Individuelle Lösungen für Ihre Anforderungen.' },
    { icon: Users, title: 'Erfahrenes Team', description: 'Qualifizierte Mitarbeiter mit langjähriger Erfahrung.' },
    { icon: Award, title: 'Qualität', description: 'Höchste Standards in allen Bereichen.' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Nav */}
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Typography variant="label">Über uns</Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* About Card */}
        <WelcomeCard
          icon={Building2}
          title={activeBrand.name}
          description="Ihr zuverlässiger Partner für professionelle Dienstleistungen. Wir setzen auf Qualität, Pünktlichkeit und Kundenzufriedenheit."
        />

        {/* Features */}
        <Typography variant="overline" color="muted" style={styles.sectionTitle}>
          WAS UNS AUSZEICHNET
        </Typography>

        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}

        {/* Contact Info */}
        <Card style={styles.infoCard}>
          <Typography variant="label">Standort</Typography>
          <Typography variant="bodySmall" color="muted" style={styles.infoText}>
            {activeBrand.contact.address}
          </Typography>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.base,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  infoCard: {
    marginTop: spacing.md,
  },
  infoText: {
    marginTop: 4,
  },
});