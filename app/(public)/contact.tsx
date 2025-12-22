// app/(public)/contact.tsx

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
import { ArrowLeft, Mail, Phone, MapPin, Send } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { activeBrand } from '@/src/config';

export default function ContactScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactInfo = [
    { icon: Mail, label: 'E-Mail', value: activeBrand.contact.email },
    { icon: Phone, label: 'Telefon', value: activeBrand.contact.phone },
    { icon: MapPin, label: 'Adresse', value: activeBrand.contact.address },
  ];

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus.');
      return;
    }

    setIsSubmitting(true);
    // TODO: API-Call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);

    Alert.alert('Gesendet', 'Vielen Dank für Ihre Nachricht. Wir melden uns schnellstmöglich.');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Kontakt</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>KONTAKTDATEN</Text>
          <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            {contactInfo.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.infoRow,
                  index < contactInfo.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
                ]}
              >
                <item.icon size={18} color={theme.primary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{item.label}</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>NACHRICHT SENDEN</Text>
          <View style={[styles.formCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
                placeholder="Ihr Name"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>E-Mail</Text>
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
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nachricht</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={form.message}
                onChangeText={(text) => setForm({ ...form, message: text })}
                placeholder="Ihre Nachricht..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Send size={18} color="#fff" />
              <Text style={styles.submitButtonText}>{isSubmitting ? 'Wird gesendet...' : 'Absenden'}</Text>
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
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.md, marginTop: spacing.md },
  infoCard: { borderRadius: borderRadius.card, borderWidth: 1, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, gap: spacing.md },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '500' },
  formCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: spacing.sm },
  input: { borderRadius: borderRadius.button, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: 15 },
  textArea: { height: 120, paddingTop: 14 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#3b82f6', padding: 16, borderRadius: borderRadius.button, marginTop: spacing.sm },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});