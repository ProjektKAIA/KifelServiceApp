// app/(public)/index.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Info, Mail, Users, Lock, Globe } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';

// Social Media Links
const SOCIAL_LINKS = {
  website: 'https://kifel-service.com',
  instagram: 'https://www.instagram.com/kifel.service/',
  facebook: 'https://www.facebook.com/KifelService/',
};

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/kifel-service-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.slogan, { color: theme.textMuted }]}>Aus reinem Herzen</Text>
        </View>

        {/* Menu Buttons */}
        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(public)/about')}
          activeOpacity={0.7}
        >
          <Info size={22} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>Über uns</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(public)/contact')}
          activeOpacity={0.7}
        >
          <Mail size={22} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>Kontakt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(public)/career')}
          activeOpacity={0.7}
        >
          <Users size={22} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>Karriere</Text>
        </TouchableOpacity>

        {/* Social Media Links */}
        <View style={styles.socialSection}>
          <Text style={[styles.socialLabel, { color: theme.textMuted }]}>FOLGEN SIE UNS</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
              onPress={() => Linking.openURL(SOCIAL_LINKS.website)}
              activeOpacity={0.7}
            >
              <Globe size={26} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
              onPress={() => Linking.openURL(SOCIAL_LINKS.instagram)}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/174/174855.png' }}
                style={[styles.socialIcon, { tintColor: theme.textSecondary }]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
              onPress={() => Linking.openURL(SOCIAL_LINKS.facebook)}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' }}
                style={[styles.socialIcon, { tintColor: theme.textSecondary }]}
              />
            </TouchableOpacity>
          </View>
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
            <Text style={[styles.loginButtonText, { color: theme.textInverse }]}>Mitarbeiter-Login</Text>
          </TouchableOpacity>
          <Text style={[styles.loginHint, { color: theme.textMuted }]}>Nur für Mitarbeitende</Text>
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
    padding: spacing.lg,
    paddingTop: spacing.xl,
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
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.md,
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
    borderRadius: borderRadius.card,
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
    alignItems: 'center',
  },
  socialLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    width: 26,
    height: 26,
  },
});