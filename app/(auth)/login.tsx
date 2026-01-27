// app/(auth)/login.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Users, Shield, Eye, EyeOff, Check, Phone } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { firebaseAuth } from '@/src/lib/firebase';
import { usersCollection } from '@/src/lib/firestore';
import { SocialMediaButtons } from '@/src/components/molecules';
import { validateLoginInput } from '@/src/utils/validation';
import { checkLoginAllowed, recordFailedLogin, recordSuccessfulLogin } from '@/src/utils/rateLimiter';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { login, isLoading } = useAuthStore();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

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
      router.replace('/(employee)');
    } else {
      const result = await recordFailedLogin(validation.email);

      if (result.message) {
        Alert.alert(t('common.error'), `${t('auth.invalidCredentials')}\n${result.message}`);
      } else {
        Alert.alert(t('common.error'), t('auth.invalidCredentials'));
      }
    }
  };

  // DEV ONLY: Auto-create user if not exists and login
  const devQuickLogin = async (
    devEmail: string,
    devPassword: string,
    firstName: string,
    lastName: string,
    role: 'employee' | 'admin'
  ) => {
    try {
      // First try normal login
      let success = await login(devEmail, devPassword);

      if (!success) {
        // User doesn't exist - create in Firebase Auth
        console.log('🔧 DEV: Creating user', devEmail);
        try {
          const userCredential = await firebaseAuth.signUp(devEmail, devPassword);
          const uid = userCredential.user.uid;

          // Create user profile in Firestore
          await usersCollection.create(uid, {
            email: devEmail,
            firstName,
            lastName,
            role,
          });

          console.log('🔧 DEV: User created, logging in...');
          // Now login
          success = await login(devEmail, devPassword);
        } catch (signupError: any) {
          // User might exist but with wrong password
          console.log('🔧 DEV: Signup failed:', signupError.code);
          Alert.alert('Dev Login Fehler', signupError.message || 'User konnte nicht angelegt werden');
          return;
        }
      }

      if (success) {
        router.replace(role === 'admin' ? '/(admin)' : '/(employee)');
      }
    } catch (error: any) {
      console.error('Dev login error:', error);
      Alert.alert('Fehler', error.message || 'Login fehlgeschlagen');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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
            <Text style={[styles.helpText, { color: theme.textMuted }]}>
              {t('auth.forgotPassword')}
            </Text>
            <TouchableOpacity
              style={[styles.supportButton, { backgroundColor: theme.primary }]}
              onPress={() => Linking.openURL('tel:+4921312945497')}
              activeOpacity={0.7}
            >
              <Phone size={16} color={theme.textInverse} />
              <Text style={[styles.supportButtonText, { color: theme.textInverse }]}>{t('auth.callSupport')}</Text>
            </TouchableOpacity>
          </View>

          {/* Dev Access */}
          <View style={[styles.devSection, { borderTopColor: theme.borderLight }]}>
            <Text style={[styles.devLabel, { color: theme.textMuted }]}>{t('auth.devAccess')}</Text>
            <View style={styles.devButtons}>
              <TouchableOpacity
                style={[styles.devButton, { backgroundColor: theme.pillSuccess, borderColor: theme.success }]}
                onPress={() => devQuickLogin('max@kifel.de', 'max123', 'Max', 'Mustermann', 'employee')}
                activeOpacity={0.7}
              >
                <Users size={20} color={theme.pillSuccessText} />
                <Text style={[styles.devButtonText, { color: theme.pillSuccessText }]}>{t('auth.devEmployee')}</Text>
                <Text style={[styles.devButtonHint, { color: theme.pillSuccessText }]}>max@kifel.de</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devButton, { backgroundColor: theme.pillSecondary, borderColor: theme.secondary }]}
                onPress={() => devQuickLogin('admin@kifel.de', 'admin123', 'Demo', 'Admin', 'admin')}
                activeOpacity={0.7}
              >
                <Shield size={20} color={theme.pillSecondaryText} />
                <Text style={[styles.devButtonText, { color: theme.pillSecondaryText }]}>{t('auth.devAdmin')}</Text>
                <Text style={[styles.devButtonHint, { color: theme.pillSecondaryText }]}>admin@kifel.de</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Media Links */}
          <View style={styles.socialSection}>
            <SocialMediaButtons size="small" labelText={t('auth.visitUs')} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.base,
    paddingTop: spacing.md,
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
  helpText: {
    fontSize: 13,
    textAlign: 'center',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  devSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  devLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  devButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  devButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    gap: 6,
  },
  devButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  devButtonHint: {
    fontSize: 10,
    opacity: 0.8,
  },
  socialSection: {
    marginTop: spacing.lg,
  },
});