// app/(public)/index.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Info, Mail, Users, Lock } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { SocialMediaButtons } from '@/src/components/molecules';

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top - 20 }]}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/kifel-service-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.slogan, { color: theme.textMuted }]}>{t('public.slogan')}</Text>
        </View>

        {/* Menu Buttons */}
        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(public)/about')}
          activeOpacity={0.7}
        >
          <Info size={22} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>{t('public.about')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(public)/contact')}
          activeOpacity={0.7}
        >
          <Mail size={22} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>{t('public.contact')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(public)/career')}
          activeOpacity={0.7}
        >
          <Users size={22} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>{t('public.career')}</Text>
        </TouchableOpacity>

        {/* Social Media Links */}
        <View style={styles.socialSection}>
          <SocialMediaButtons size="medium" glassEffect={true} />
        </View>

        {/* Login Button */}
        <View style={styles.loginSection}>
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Lock size={22} color={theme.textInverse} />
            <Text style={[styles.loginButtonText, { color: theme.textInverse }]}>{t('public.employeeLogin')}</Text>
          </TouchableOpacity>
          <Text style={[styles.loginHint, { color: theme.textMuted }]}>{t('public.employeesOnly')}</Text>
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
    padding: spacing.lg,
    paddingTop: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  logo: {
    width: 300,
    height: 100,
  },
  slogan: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: spacing.md,
    letterSpacing: 0.5,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.6)',
    borderLeftColor: 'rgba(255,255,255,0.4)',
    borderRightColor: 'rgba(0,0,0,0.1)',
    borderBottomColor: 'rgba(0,0,0,0.15)',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  menuButtonText: {
    fontSize: 17,
    fontWeight: '500',
  },
  loginSection: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
  divider: {
    height: 1,
    marginBottom: spacing.xl,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 22,
    borderRadius: 20,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.4)',
    borderLeftColor: 'rgba(255,255,255,0.3)',
    borderRightColor: 'rgba(0,0,0,0.2)',
    borderBottomColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  loginHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  socialSection: {
    marginTop: spacing.xl,
  },
});
