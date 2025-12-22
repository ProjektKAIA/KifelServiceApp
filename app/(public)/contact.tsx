// app/(public)/contact.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Phone, MapPin, Send } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';

export default function ContactScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus.');
      return;
    }
    Alert.alert('Gesendet', 'Vielen Dank für Ihre Nachricht. Wir melden uns in Kürze.');
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.badge, { backgroundColor: theme.pillSuccess }]}>
          <Text style={[styles.badgeText, { color: theme.pillSuccessText }]}>ÖFFENTLICH</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Kontakt</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Wir freuen uns auf Ihre Nachricht
        </Text>

        {/* Contact Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.infoRow}>
            <Mail size={18} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>info@kifel-service.de</Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={18} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>+49 3562 123456</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={18} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>Hauptstraße 15, 03149 Forst</Text>
          </View>
        </View>

        {/* Contact Form */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>NACHRICHT SENDEN</Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
          placeholder="Ihr Name"
          placeholderTextColor={theme.textMuted}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
          placeholder="Ihre E-Mail"
          placeholderTextColor={theme.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
          placeholder="Ihre Nachricht"
          placeholderTextColor={theme.textMuted}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
          <Send size={18} color="#fff" />
          <Text style={styles.submitButtonText}>Nachricht senden</Text>
        </TouchableOpacity>
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
  infoCard: {
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  input: {
    height: 52,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  textArea: {
    height: 120,
    paddingTop: spacing.md,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: borderRadius.input,
    backgroundColor: '#3b82f6',
    marginTop: spacing.sm,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});