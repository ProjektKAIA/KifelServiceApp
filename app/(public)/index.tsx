// app/(public)/index.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Info, Mail, Users, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { SocialMediaButtons } from '@/src/components/molecules';

function GlassButton({
  onPress,
  icon: Icon,
  label,
  isDark,
}: {
  onPress: () => void;
  icon: typeof Info;
  label: string;
  isDark: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.glassButtonWrapper}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']
            : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.6)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.glassButton,
          {
            borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
          },
        ]}
      >
        {/* Inner highlight line at top */}
        <View
          style={[
            styles.glassInnerHighlight,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)',
            },
          ]}
        />
        <View style={styles.glassContent}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.08)',
              },
            ]}
          >
            <Icon size={20} color={isDark ? '#7cb3ff' : '#3b82f6'} />
          </View>
          <Text
            style={[
              styles.glassButtonText,
              { color: isDark ? '#f0f0f0' : '#1a1a2e' },
            ]}
          >
            {label}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme, colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const isDark = colorScheme === 'dark';

  return (
    <LinearGradient
      colors={
        isDark
          ? [theme.background, theme.background]
          : ['#f0f4ff', '#e8edf8', '#f5f5fa']
      }
      style={[styles.container, { paddingTop: insets.top - 20 }]}
    >
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

        {/* Liquid Glass Buttons */}
        <View style={styles.buttonsContainer}>
          <GlassButton
            onPress={() => router.push('/(public)/about')}
            icon={Info}
            label={t('public.about')}
            isDark={isDark}
          />
          <GlassButton
            onPress={() => router.push('/(public)/contact')}
            icon={Mail}
            label={t('public.contact')}
            isDark={isDark}
          />
          <GlassButton
            onPress={() => router.push('/(public)/career')}
            icon={Users}
            label={t('public.career')}
            isDark={isDark}
          />
        </View>

        {/* Social Media Links */}
        <View style={styles.socialSection}>
          <SocialMediaButtons size="medium" glassEffect={true} />
        </View>

        {/* Login Button */}
        <View style={styles.loginSection}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
            style={styles.loginButtonWrapper}
          >
            <LinearGradient
              colors={isDark ? ['#3b6fd4', '#2851a3'] : ['#4a90e2', '#3572c6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginButton}
            >
              {/* Shine overlay */}
              <LinearGradient
                colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.loginShine}
              />
              <View style={styles.loginContent}>
                <Lock size={20} color="#fff" />
                <Text style={styles.loginButtonText}>{t('public.employeeLogin')}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={[styles.loginHint, { color: theme.textMuted }]}>{t('public.employeesOnly')}</Text>
        </View>
      </View>
    </LinearGradient>
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
  // Glass Buttons
  buttonsContainer: {
    gap: 12,
  },
  glassButtonWrapper: {
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  glassButton: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  glassInnerHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    borderRadius: 1,
  },
  glassContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    letterSpacing: 1.5,
  },
  // Login
  loginSection: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
  loginButtonWrapper: {
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  loginButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  loginShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loginContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
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
