// app/(auth)/login.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Eye, EyeOff, Check, Phone } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { firebaseAuth, isFirebaseConfigured } from '@/src/lib/firebase';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { SocialMediaButtons } from '@/src/components/molecules';
import { validateLoginInput } from '@/src/utils/validation';
import { checkLoginAllowed, recordFailedLogin, recordSuccessfulLogin } from '@/src/utils/rateLimiter';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuthStore();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  const handlePasswordReset = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      Alert.alert(t('common.error'), t('auth.resetEnterEmail'));
      return;
    }
    if (!isFirebaseConfigured()) {
      Alert.alert(t('common.error'), t('auth.resetUnavailable'));
      return;
    }
    try {
      await firebaseAuth.resetPassword(trimmedEmail);
      Alert.alert(t('auth.resetSuccess'), t('auth.resetSuccessMessage'));
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        Alert.alert(
          t('auth.resetNotFound'),
          t('auth.resetContactSupport'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('auth.callSupport'), onPress: () => Linking.openURL('tel:+4921312945497') },
          ]
        );
      } else {
        Alert.alert(t('common.error'), t('auth.resetError'));
      }
    }
  };

  const handleLogin = async () => {
    // Input Validation
    const validation = validateLoginInput(email, password);
    if (!validation.isValid) {
      Alert.alert(t('common.error'), validation.error || t('auth.invalidInput'));
      return;
    }

    // Rate Limiting Check
    const rateLimit = await checkLoginAllowed(validation.email);
    if (!rateLimit.allowed) {
      Alert.alert(t('auth.locked'), rateLimit.message || t('auth.tooManyAttempts'));
      return;
    }

    // Login Versuch
    const success = await login(validation.email, validation.password);

    if (success) {
      await recordSuccessfulLogin(validation.email);
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === 'admin') {
        router.replace('/(admin)');
      } else {
        router.replace('/(employee)');
      }
    } else {
      const result = await recordFailedLogin(validation.email);

      if (result.message) {
        Alert.alert(t('common.error'), `${t('auth.invalidCredentials')}\n${result.message}`);
      } else {
        Alert.alert(t('common.error'), t('auth.invalidCredentials'));
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Header with Close Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
            <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>{t('auth.login')}</Text>
          </View>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/kifel-service-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Header */}
        <Text style={[styles.title, { color: theme.text }]}>{t('auth.employeeLogin')}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{t('auth.accessArea')}</Text>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.inputBackground, 
              borderColor: theme.inputBorder,
              color: theme.text 
            }]}
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor={theme.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={[styles.passwordContainer, {
            backgroundColor: theme.inputBackground,
            borderColor: theme.inputBorder
          }]}>
            <TextInput
              style={[styles.passwordInput, { color: theme.text }]}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor={theme.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOff size={20} color={theme.textMuted} />
              ) : (
                <Eye size={20} color={theme.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          {/* Stay Logged In */}
          <TouchableOpacity
            style={styles.stayLoggedInRow}
            onPress={() => setStayLoggedIn(!stayLoggedIn)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              {
                borderColor: stayLoggedIn ? theme.primary : theme.inputBorder,
                backgroundColor: stayLoggedIn ? theme.primary : 'transparent'
              }
            ]}>
              {stayLoggedIn && <Check size={14} color={theme.textInverse} />}
            </View>
            <Text style={[styles.stayLoggedInText, { color: theme.text }]}>
              {t('auth.stayLoggedIn')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.primary }, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text style={[styles.loginButtonText, { color: theme.textInverse }]}>
              {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
            </Text>
          </TouchableOpacity>

          <View style={styles.helpSection}>
            <TouchableOpacity
              onPress={handlePasswordReset}
              activeOpacity={0.7}
            >
              <Text style={[styles.resetLink, { color: theme.primary }]}>
                {t('auth.forgotPasswordReset')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.supportButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => Linking.openURL('tel:+4921312945497')}
              activeOpacity={0.7}
            >
              <Phone size={16} color={theme.textMuted} />
              <Text style={[styles.supportButtonText, { color: theme.text }]}>{t('auth.callSupport')}</Text>
            </TouchableOpacity>
          </View>

          {/* Social Media Links */}
          <View style={styles.socialSection}>
            <SocialMediaButtons size="small" labelText={t('auth.visitUs')} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.base,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  closeButton: {
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 200,
    height: 65,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    height: 52,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    fontSize: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: borderRadius.input,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: spacing.base,
    fontSize: 15,
  },
  passwordToggle: {
    paddingHorizontal: spacing.base,
    height: '100%',
    justifyContent: 'center',
  },
  stayLoggedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stayLoggedInText: {
    marginLeft: spacing.sm,
    fontSize: 14,
  },
  loginButton: {
    height: 52,
    borderRadius: borderRadius.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  resetLink: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  socialSection: {
    marginTop: spacing.lg,
  },
});