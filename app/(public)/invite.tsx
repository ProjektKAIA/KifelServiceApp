// app/(public)/invite.tsx - Einladung annehmen Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { invitesCollection } from '@/src/lib/firestore';
import { firebaseAuth } from '@/src/lib/firebase';
import { Invite } from '@/src/types';

type InviteStatus = 'loading' | 'valid' | 'expired' | 'used' | 'not_found' | 'error';

export default function InviteScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [status, setStatus] = useState<InviteStatus>('loading');
  const [invite, setInvite] = useState<Invite | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      loadInvite(token);
    } else {
      setStatus('not_found');
    }
  }, [token]);

  const loadInvite = async (inviteToken: string) => {
    try {
      const inviteData = await invitesCollection.getByToken(inviteToken);

      if (!inviteData) {
        setStatus('not_found');
        return;
      }

      if (inviteData.status === 'accepted') {
        setStatus('used');
        return;
      }

      if (inviteData.status === 'expired' || new Date(inviteData.expiresAt) < new Date()) {
        setStatus('expired');
        return;
      }

      setInvite(inviteData);
      setStatus('valid');
    } catch (error) {
      console.error('Error loading invite:', error);
      setStatus('error');
    }
  };

  const validatePassword = (): boolean => {
    if (password.length < 8) {
      Alert.alert(t('common.error'), t('invite.passwordMin'));
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('invite.passwordMismatch'));
      return false;
    }
    return true;
  };

  const handleAcceptInvite = async () => {
    if (!invite || !token) return;

    if (!validatePassword()) return;

    setIsSubmitting(true);
    try {
      // Create Firebase Auth user
      const userCredential = await firebaseAuth.signUp(invite.email, password);
      const uid = userCredential.user.uid;

      // Accept the invite and create user profile
      await invitesCollection.accept(token, uid);

      Alert.alert(
        'Willkommen!',
        `Hallo ${invite.firstName}, dein Konto wurde erfolgreich erstellt. Du kannst dich jetzt anmelden.`,
        [
          {
            text: t('invite.goToLogin'),
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      let message = t('invite.registrationFailed');

      if (error.code === 'auth/email-already-in-use') {
        message = 'Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Das Passwort ist zu schwach. Bitte wähle ein stärkeres Passwort.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Ungültige E-Mail-Adresse.';
      }

      Alert.alert(t('common.error'), message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>
          {t('invite.loading')}
        </Text>
      </SafeAreaView>
    );
  }

  // Error states
  if (status !== 'valid') {
    const errorContent = {
      not_found: {
        icon: XCircle,
        color: theme.danger,
        title: t('invite.notFoundTitle'),
        message: t('invite.notFoundDesc'),
      },
      expired: {
        icon: Clock,
        color: theme.warning,
        title: t('invite.expiredTitle'),
        message: t('invite.expiredDesc'),
      },
      used: {
        icon: CheckCircle,
        color: theme.success,
        title: t('invite.usedTitle'),
        message: t('invite.usedDesc'),
      },
      error: {
        icon: XCircle,
        color: theme.danger,
        title: t('common.error'),
        message: t('invite.registrationFailed'),
      },
    }[status];

    const Icon = errorContent.icon;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <View style={[styles.errorIcon, { backgroundColor: errorContent.color + '20' }]}>
            <Icon size={48} color={errorContent.color} />
          </View>
          <Text style={[styles.errorTitle, { color: theme.text }]}>{errorContent.title}</Text>
          <Text style={[styles.errorMessage, { color: theme.textMuted }]}>{errorContent.message}</Text>

          {status === 'used' && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={[styles.primaryButtonText, { color: theme.textInverse }]}>
                {t('invite.goToLogin')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.border }]}
            onPress={() => router.replace('/(public)')}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
              Zur Startseite
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Valid invite - show registration form
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(public)')}
          >
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>

          {/* Welcome */}
          <View style={styles.welcomeSection}>
            <View style={[styles.welcomeIcon, { backgroundColor: theme.primary + '20' }]}>
              <Shield size={32} color={theme.primary} />
            </View>
            <Text style={[styles.welcomeTitle, { color: theme.text }]}>
              {t('invite.title')}
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: theme.textMuted }]}>
              {t('invite.subtitle')}
            </Text>
          </View>

          {/* User Info Card */}
          <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>DEINE DATEN</Text>

            <View style={styles.infoRow}>
              <User size={18} color={theme.textMuted} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{t('invite.firstName')}</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {invite?.firstName} {invite?.lastName}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

            <View style={styles.infoRow}>
              <Mail size={18} color={theme.textMuted} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{t('invite.email')}</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{invite?.email}</Text>
              </View>
            </View>

            {invite?.role === 'admin' && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
                <View style={styles.infoRow}>
                  <Shield size={18} color={theme.secondary} />
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Rolle</Text>
                    <Text style={[styles.infoValue, { color: theme.secondary }]}>Administrator</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Password Form */}
          <View style={[styles.formCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PASSWORT ERSTELLEN</Text>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('invite.password')}</Text>
            <View style={styles.passwordInput}>
              <Lock size={18} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={password}
                onChangeText={setPassword}
                placeholder={t('invite.passwordReq')}
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.textMuted} />
                ) : (
                  <Eye size={20} color={theme.textMuted} />
                )}
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textMuted, marginTop: spacing.md }]}>
              {t('invite.confirmPassword')}
            </Text>
            <View style={styles.passwordInput}>
              <Lock size={18} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('invite.confirmPassword')}
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Info text */}
          <Text style={[styles.infoText, { color: theme.textMuted }]}>
            Mit der Registrierung akzeptierst du die Nutzungsbedingungen und Datenschutzrichtlinien.
          </Text>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.primary },
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleAcceptInvite}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.textInverse} />
            ) : (
              <Text style={[styles.submitButtonText, { color: theme.textInverse }]}>
                {t('invite.createAccount')}
              </Text>
            )}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
  },
  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.button,
    marginBottom: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Header
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  // Welcome section
  welcomeSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  // Info card
  infoCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  // Form card
  formCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  passwordInput: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: spacing.md,
    top: '50%',
    marginTop: -9,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    paddingLeft: 44,
    paddingVertical: spacing.md,
    fontSize: 15,
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -10,
    padding: 4,
  },
  // Info text
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  // Submit button
  submitButton: {
    paddingVertical: 16,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
