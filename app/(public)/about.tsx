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
import { ArrowLeft, Building2, Users, Award, Target } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { activeBrand } from '@/src/config';

export default function AboutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const values = [
    { icon: Award, title: 'Qualität', description: 'Höchste Standards in allen Bereichen' },
    { icon: Users, title: 'Teamarbeit', description: 'Gemeinsam stark für unsere Kunden' },
    { icon: Target, title: 'Zuverlässigkeit', description: 'Pünktlich und professionell' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Über uns</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
            <Building2 size={32} color={theme.primary} />
          </View>
          <Text style={[styles.companyName, { color: theme.text }]}>{activeBrand.name}</Text>
          <Text style={[styles.slogan, { color: theme.textMuted }]}>{activeBrand.slogan}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>UNSERE GESCHICHTE</Text>
        <View style={[styles.textCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Seit über 15 Jahren steht {activeBrand.name} für professionelle Dienstleistungen 
            mit höchster Qualität. Unser erfahrenes Team arbeitet täglich daran, 
            die Erwartungen unserer Kunden zu übertreffen.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Mit modernster Technologie und einem starken Fokus auf Nachhaltigkeit 
            gestalten wir die Zukunft unserer Branche aktiv mit.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>UNSERE WERTE</Text>
        {values.map((value, index) => (
          <View
            key={index}
            style={[styles.valueCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          >
            <View style={[styles.valueIcon, { backgroundColor: `${theme.primary}15` }]}>
              <value.icon size={20} color={theme.primary} />
            </View>
            <View style={styles.valueContent}>
              <Text style={[styles.valueTitle, { color: theme.text }]}>{value.title}</Text>
              <Text style={[styles.valueDescription, { color: theme.textMuted }]}>{value.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  content: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  heroCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.xl },
  iconContainer: { width: 64, height: 64, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  companyName: { fontSize: 20, fontWeight: '700', marginBottom: spacing.xs },
  slogan: { fontSize: 13 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.md, marginTop: spacing.md },
  textCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, marginBottom: spacing.md },
  paragraph: { fontSize: 14, lineHeight: 22, marginBottom: spacing.md },
  valueCard: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, marginBottom: spacing.sm, gap: spacing.md },
  valueIcon: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  valueContent: { flex: 1 },
  valueTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  valueDescription: { fontSize: 13 },
});