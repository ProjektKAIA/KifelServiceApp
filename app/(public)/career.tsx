// app/(public)/career.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Briefcase, CheckCircle, Upload, Send } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { activeBrand } from '@/src/config';

export default function CareerScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const benefits = [
    'Unbefristete Arbeitsverträge',
    'Faire Bezahlung & Zulagen',
    'Modernes Arbeitsumfeld',
    'Weiterbildungsmöglichkeiten',
    'Teamevents & Benefits',
  ];

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    setIsSubmitting(true);
    // TODO: API-Call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);

    Alert.alert('Bewerbung gesendet', 'Vielen Dank für Ihr Interesse. Wir melden uns in Kürze bei Ihnen.');
    setForm({ firstName: '', lastName: '', email: '', phone: '', message: '' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Karriere</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.heroCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Briefcase size={28} color="#8b5cf6" />
            </View>
            <Text style={[styles.heroTitle, { color: theme.text }]}>Werde Teil unseres Teams</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textMuted }]}>
              Wir suchen engagierte Mitarbeiter, die mit uns wachsen möchten.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>DAS BIETEN WIR</Text>
          <View style={[styles.benefitsCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <CheckCircle size={16} color="#22c55e" />
                <Text style={[styles.benefitText, { color: theme.textSecondary }]}>{benefit}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>JETZT BEWERBEN</Text>
          <View style={[styles.formCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Vorname *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                  value={form.firstName}
                  onChangeText={(text) => setForm({ ...form, firstName: text })}
                  placeholder="Max"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nachname *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                  value={form.lastName}
                  onChangeText={(text) => setForm({ ...form, lastName: text })}
                  placeholder="Mustermann"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>E-Mail *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                placeholder="ihre@email.de"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Telefon</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={form.phone}
                onChangeText={(text) => setForm({ ...form, phone: text })}
                placeholder="+49 123 456789"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nachricht</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={form.message}
                onChangeText={(text) => setForm({ ...form, message: text })}
                placeholder="Erzählen Sie uns etwas über sich..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.7}
            >
              <Upload size={18} color={theme.textSecondary} />
              <Text style={[styles.uploadButtonText, { color: theme.textSecondary }]}>Lebenslauf hochladen (optional)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Send size={18} color="#fff" />
              <Text style={styles.submitButtonText}>{isSubmitting ? 'Wird gesendet...' : 'Bewerbung absenden'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  iconContainer: { width: 56, height: 56, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  heroTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.xs, textAlign: 'center' },
  heroSubtitle: { fontSize: 13, textAlign: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.md, marginTop: spacing.md },
  benefitsCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8 },
  benefitText: { fontSize: 14 },
  formCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base },
  row: { flexDirection: 'row', gap: spacing.md },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: spacing.sm },
  input: { borderRadius: borderRadius.button, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: 15 },
  textArea: { height: 100, paddingTop: 14 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: 14, borderRadius: borderRadius.button, borderWidth: 1, borderStyle: 'dashed', marginBottom: spacing.md },
  uploadButtonText: { fontSize: 14, fontWeight: '500' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#8b5cf6', padding: 16, borderRadius: borderRadius.button },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});