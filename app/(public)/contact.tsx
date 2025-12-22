// app/(public)/contact.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Phone, MapPin, Send, ChevronLeft } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { activeBrand } from '@/src/config';

export default function ContactScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Nachricht gesendet',
        'Vielen Dank für Ihre Anfrage. Wir melden uns zeitnah bei Ihnen.',
        [{ text: 'OK', onPress: () => setForm({ name: '', email: '', subject: '', message: '' }) }]
      );
    }, 1500);
  };

  const contactInfo = [
    { icon: Mail, label: 'E-Mail', value: activeBrand.contact.email },
    { icon: Phone, label: 'Telefon', value: activeBrand.contact.phone || 'Auf Anfrage' },
    { icon: MapPin, label: 'Adresse', value: activeBrand.contact.address },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ChevronLeft size={24} color={theme.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.headerSmall, { color: theme.textMuted }]}>
              Schreiben Sie uns
            </Text>
            <Text style={[styles.headerLarge, { color: theme.text }]}>
              Kontakt
            </Text>
          </View>

          <View style={styles.infoContainer}>
            {contactInfo.map((item, index) => (
              <View
                key={index}
                style={[styles.infoCard, {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                }]}
              >
                <item.icon size={16} color={theme.primary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {item.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            KONTAKTFORMULAR
          </Text>

          <TextInput
            style={[styles.input, {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.text,
            }]}
            placeholder="Name *"
            placeholderTextColor={theme.textMuted}
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
          />

          <TextInput
            style={[styles.input, {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.text,
            }]}
            placeholder="E-Mail *"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
          />

          <TextInput
            style={[styles.input, {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.text,
            }]}
            placeholder="Betreff"
            placeholderTextColor={theme.textMuted}
            value={form.subject}
            onChangeText={(text) => setForm({ ...form, subject: text })}
          />

          <TextInput
            style={[styles.input, styles.textArea, {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.text,
            }]}
            placeholder="Ihre Nachricht *"
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={form.message}
            onChangeText={(text) => setForm({ ...form, message: text })}
          />

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Send size={18} color="#fff" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Wird gesendet...' : 'Nachricht senden'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { padding: spacing.base, paddingBottom: 0 },
  keyboardView: { flex: 1 },
  content: { padding: spacing.base },
  header: { marginBottom: spacing.xl },
  headerSmall: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  headerLarge: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  infoContainer: { marginBottom: spacing.xl },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  infoContent: { marginLeft: spacing.md },
  infoLabel: { fontSize: 10, fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '500' },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.md },
  input: {
    padding: 14,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  textArea: { height: 120, paddingTop: 14 },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: 14,
    borderRadius: borderRadius.button,
    backgroundColor: '#3b82f6',
    marginTop: spacing.sm,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});