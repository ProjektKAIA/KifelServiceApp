// app/(public)/career.tsx

import React from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Briefcase, Euro, Clock, ChevronRight } from 'lucide-react-native';

import { Typography, Button } from '@/src/components/atoms';
import { Card } from '@/src/components/molecules';
import { WelcomeCard, FeatureCard } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';

interface JobPosition {
  id: string;
  title: string;
  location: string;
  type: string;
  salary?: string;
}

const openPositions: JobPosition[] = [
  { id: '1', title: 'Servicemitarbeiter (m/w/d)', location: 'Berlin', type: 'Vollzeit', salary: '2.500 - 3.000€' },
  { id: '2', title: 'Teamleiter (m/w/d)', location: 'Berlin', type: 'Vollzeit', salary: '3.500 - 4.000€' },
  { id: '3', title: 'Aushilfe (m/w/d)', location: 'Berlin', type: 'Teilzeit' },
];

const benefits = [
  { icon: Euro, title: 'Faire Bezahlung', description: 'Übertarifliche Vergütung und Bonussystem' },
  { icon: Clock, title: 'Flexible Arbeitszeiten', description: 'Work-Life-Balance ist uns wichtig' },
  { icon: Briefcase, title: 'Weiterbildung', description: 'Regelmäßige Schulungen und Aufstiegschancen' },
];

export default function CareerScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const handleApply = (position: JobPosition) => {
    Alert.alert('Bewerbung', `Bewerbung für "${position.title}" wird in einer zukünftigen Version verfügbar sein.`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Nav */}
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Typography variant="label">Karriere</Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Intro */}
        <WelcomeCard
          icon={Briefcase}
          title="Wir suchen Verstärkung!"
          description="Starten Sie Ihre Karriere bei uns. Wir bieten spannende Aufgaben und ein tolles Team."
        />

        {/* Benefits */}
        <Typography variant="overline" color="muted" style={styles.sectionTitle}>
          IHRE VORTEILE
        </Typography>

        {benefits.map((benefit, index) => (
          <FeatureCard key={index} icon={benefit.icon} title={benefit.title} description={benefit.description} />
        ))}

        {/* Open Positions */}
        <Typography variant="overline" color="muted" style={styles.sectionTitle}>
          OFFENE STELLEN ({openPositions.length})
        </Typography>

        {openPositions.map((position) => (
          <Card key={position.id} onPress={() => handleApply(position)} style={styles.positionCard}>
            <Typography variant="label">{position.title}</Typography>
            <Typography variant="caption" color="muted" style={styles.positionMeta}>
              {position.location} · {position.type}
              {position.salary && ` · ${position.salary}`}
            </Typography>
            <Button
              title="Jetzt bewerben"
              icon={ChevronRight}
              iconPosition="right"
              variant="secondary"
              size="sm"
              onPress={() => handleApply(position)}
              style={styles.applyButton}
            />
          </Card>
        ))}
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
    paddingBottom: spacing['3xl'],
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  positionCard: {
    marginBottom: spacing.md,
  },
  positionMeta: {
    marginTop: 4,
    marginBottom: spacing.md,
  },
  applyButton: {
    alignSelf: 'flex-start',
  },
});