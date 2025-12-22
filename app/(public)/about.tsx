// app/(public)/about.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, Target, Award, Users, ChevronLeft } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { activeBrand } from '@/src/config';

export default function AboutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const features = [
    {
      icon: Target,
      title: 'Unsere Mission',
      description: 'Höchste Qualität und Zuverlässigkeit in allen Dienstleistungen.',
    },
    {
      icon: Award,
      title: 'Erfahrung',
      description: 'Jahrelange Expertise und professionelle Umsetzung.',
    },
    {
      icon: Users,
      title: 'Team',
      description: 'Engagierte Mitarbeiter für Ihren Erfolg.',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <ChevronLeft size={24} color={theme.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>
            Über uns
          </Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>
            {activeBrand.name}
          </Text>
        </View>

        {/* Main Card */}
        <View style={[styles.card, {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
            <Building2 size={32} color={theme.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Wer wir sind
          </Text>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>
            {activeBrand.name} steht für professionelle Dienstleistungen 
            mit höchsten Qualitätsstandards. Wir sind Ihr zuverlässiger 
            Partner für alle Anforderungen.
          </Text>
        </View>

        {/* Features */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
          WAS UNS AUSZEICHNET
        </Text>

        {features.map((feature, index) => (
          <View
            key={index}
            style={[styles.featureCard, {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
            }]}
          >
            <View style={[styles.featureIcon, { backgroundColor: theme.surface }]}>
              <feature.icon size={20} color={theme.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: theme.textMuted }]}>
                {feature.description}
              </Text>
            </View>
          </View>
        ))}

        {/* Contact Info */}
        <View style={[styles.infoCard, {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>
            Standort
          </Text>
          <Text style={[styles.infoText, { color: theme.textMuted }]}>
            {activeBrand.contact.address}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: spacing.base,
    paddingBottom: 0,
  },
  content: {
    padding: spacing.base,
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
  card: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  cardText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  infoCard: {
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
  },
});