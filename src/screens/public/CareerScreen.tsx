// src/screens/public/CareerScreen.tsx

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
import { Briefcase, Users, Heart, Send, ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { activeBrand } from '../../config';

export default function CareerScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const benefits = [
    { icon: Briefcase, title: 'Sichere Anstellung', description: 'Unbefristete Verträge' },
    { icon: Users, title: 'Tolles Team', description: 'Familiäres Arbeitsklima' },
    { icon: Heart, title: 'Work-Life-Balance', description: 'Flexible Arbeitszeiten' },
  ];

  const positions = [
    'Servicemitarbeiter/in',
    'Teamleiter/in',
    'Initiativbewerbung',
  ];

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.position) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    setIsSubmitting(true);
    
    // TODO: API-Aufruf implementieren
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Bewerbung eingegangen',
        'Vielen Dank für Ihre Bewerbung. Wir prüfen Ihre Unterlagen und melden uns bei Ihnen.',
        [{ text: 'OK', onPress: () => setForm({ name: '', email: '', phone: '', position: '', message: '' }) }]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerSmall, { color: theme.textMuted }]}>
              Werden Sie Teil unseres Teams
            </Text>
            <Text style={[styles.headerLarge, { color: theme.text }]}>
              Karriere
            </Text>
          </View>

          {/* Benefits */}
          <View style={[styles.benefitsCard, {
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder,
          }]}>
            <Text style={[styles.benefitsTitle, { color: theme.text }]}>
              Was wir bieten
            </Text>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <View style={[styles.benefitIcon, { backgroundColor: theme.surface }]}>
                  <benefit.icon size={16} color={theme.primary} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={[styles.benefitTitle, { color: theme.text }]}>
                    {benefit.title}
                  </Text>
                  <Text style={[styles.benefitDescription, { color: theme.textMuted }]}>
                    {benefit.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Application Form */}
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            JETZT BEWERBEN
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
            placeholder="Telefon"
            placeholderTextColor={theme.textMuted}
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
          />

          {/* Position Selection */}
          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
            Position *
          </Text>
          <View style={styles.positionContainer}>
            {positions.map((position, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.positionButton, {
                  backgroundColor: form.position === position ? theme.primary : theme.inputBackground,
                  borderColor: form.position === position ? theme.primary : theme.inputBorder,
                }]}
                onPress={() => setForm({ ...form, position })}
              >
                <Text style={[styles.positionText, {
                  color: form.position === position ? '#fff' : theme.textSecondary,
                }]}>
                  {position}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, styles.textArea, {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.text,
            }]}
            placeholder="Kurze Vorstellung / Nachricht"
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={4}
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
              {isSubmitting ? 'Wird gesendet...' : 'Bewerbung absenden'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
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
  benefitsCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  benefitDescription: {
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  input: {
    padding: 14,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  positionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  positionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.button,
    borderWidth: 1,
  },
  positionText: {
    fontSize: 13,
    fontWeight: '500',
  },
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});