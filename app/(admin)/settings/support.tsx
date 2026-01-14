// app/(admin)/settings/support.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, Mail, Phone, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';

const SUPPORT_EMAIL = 'info@kaiashapes.de';
const SUPPORT_PHONE = '0176 66816778';

export default function SupportScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuthStore();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Fehler', 'Bitte Betreff und Nachricht ausfüllen.');
      return;
    }

    setIsSending(true);

    // Build email body with user info
    const emailBody = `
${message}

---
Gesendet von: ${user?.firstName} ${user?.lastName}
Email: ${user?.email}
Rolle: ${user?.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
App Version: 1.0.0
    `.trim();

    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        // Clear form after opening mail app
        setSubject('');
        setMessage('');
        Alert.alert('Email-App geöffnet', 'Bitte senden Sie die Email über Ihre Mail-App.');
      } else {
        Alert.alert(
          'Keine Email-App',
          `Bitte senden Sie Ihre Anfrage direkt an:\n${SUPPORT_EMAIL}`,
          [
            { text: 'Email kopieren', onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`) },
            { text: 'OK' },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Fehler', 'Email konnte nicht geöffnet werden.');
    } finally {
      setIsSending(false);
    }
  };

  const quickActions = [
    {
      icon: Mail,
      label: 'Email senden',
      subtitle: SUPPORT_EMAIL,
      onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`),
    },
    {
      icon: Phone,
      label: 'Anrufen',
      subtitle: SUPPORT_PHONE,
      onPress: () => Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Hilfe</Text>
              <Text style={[styles.headerLarge, { color: theme.text }]}>Support kontaktieren</Text>
            </View>
          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: theme.pillInfo, borderColor: theme.primary }]}>
            <MessageCircle size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Wir helfen Ihnen gerne! Beschreiben Sie Ihr Anliegen und wir melden uns schnellstmöglich.
            </Text>
          </View>

          {/* Quick Actions */}
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>SCHNELLKONTAKT</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickAction, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <action.icon size={24} color={theme.primary} />
                <Text style={[styles.quickActionLabel, { color: theme.text }]}>{action.label}</Text>
                <Text style={[styles.quickActionSubtitle, { color: theme.textMuted }]}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Contact Form */}
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>NACHRICHT SENDEN</Text>

          <View style={[styles.formCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Betreff</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="z.B. Frage zur Zeiterfassung"
              placeholderTextColor={theme.textMuted}
              value={subject}
              onChangeText={setSubject}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted, marginTop: spacing.md }]}>Ihre Nachricht</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
              ]}
              placeholder="Beschreiben Sie Ihr Anliegen..."
              placeholderTextColor={theme.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: theme.primary },
                (!subject.trim() || !message.trim() || isSending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendEmail}
              disabled={!subject.trim() || !message.trim() || isSending}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={theme.textInverse} />
              ) : (
                <>
                  <Send size={18} color={theme.textInverse} />
                  <Text style={[styles.sendButtonText, { color: theme.textInverse }]}>Nachricht senden</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            Ihre Anfrage wird an {SUPPORT_EMAIL} gesendet.{'\n'}
            Wir antworten in der Regel innerhalb von 24 Stunden.
          </Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerSmall: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerLarge: {
    fontSize: 24,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    gap: spacing.xs,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  quickActionSubtitle: {
    fontSize: 11,
  },
  formCard: {
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  textArea: {
    height: 120,
    paddingTop: spacing.md,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.input,
    marginTop: spacing.lg,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
