// app/(public)/contact.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Phone, MapPin, Send, Clock } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';

// Contact Data
const CONTACT = {
  phone: '+49 2131 2945497',
  email: 'info@kifel-service.de',
  address: 'Justus-Liebig-Straße 3, 41564 Kaarst',
  hours: {
    weekdays: 'Mo – Do: 08:00 – 17:00 Uhr',
    friday: 'Fr: 08:00 – 15:00 Uhr',
  },
};

export default function ContactScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert(t('common.error'), t('contact.fillAll'));
      return;
    }
    Alert.alert(t('contact.sent'), t('contact.thankYou'));
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top - 20 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.badge, { backgroundColor: theme.pillSuccess }]}>
          <Text style={[styles.badgeText, { color: theme.pillSuccessText }]}>{t('public.badge')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{t('contact.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {t('contact.subtitle')}
        </Text>

        {/* Contact Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => Linking.openURL(`mailto:${CONTACT.email}`)}
            activeOpacity={0.7}
          >
            <Mail size={18} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>{CONTACT.email}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => Linking.openURL(`tel:${CONTACT.phone.replace(/\s/g, '')}`)}
            activeOpacity={0.7}
          >
            <Phone size={18} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>{CONTACT.phone}</Text>
          </TouchableOpacity>
          <View style={styles.infoRow}>
            <MapPin size={18} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>{CONTACT.address}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
            <Clock size={18} color={theme.primary} />
            <View>
              <Text style={[styles.infoText, { color: theme.text }]}>{CONTACT.hours.weekdays}</Text>
              <Text style={[styles.infoText, { color: theme.text }]}>{CONTACT.hours.friday}</Text>
            </View>
          </View>
        </View>

        {/* Contact Form */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('contact.sendMessage')}</Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
          placeholder={t('contact.namePlaceholder')}
          placeholderTextColor={theme.textMuted}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
          placeholder={t('contact.emailPlaceholder')}
          placeholderTextColor={theme.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
          placeholder={t('contact.messagePlaceholder')}
          placeholderTextColor={theme.textMuted}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }]}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Send size={18} color={theme.textInverse} />
          <Text style={[styles.submitButtonText, { color: theme.textInverse }]}>{t('contact.sendButton')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    marginTop: spacing.sm,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
