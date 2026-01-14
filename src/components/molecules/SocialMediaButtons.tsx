// src/components/molecules/SocialMediaButtons.tsx

import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Linking, Text } from 'react-native';
import { Globe } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';

// Zentrale Social Media Konfiguration
export const SOCIAL_MEDIA = {
  website: {
    url: 'https://kifel-service.com',
    label: 'Website',
  },
  instagram: {
    url: 'https://www.instagram.com/kifel.service/',
    label: 'Instagram',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/132px-Instagram_logo_2016.svg.png',
  },
  facebook: {
    url: 'https://www.facebook.com/KifelService/',
    label: 'Facebook',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/600px-Facebook_Logo_%282019%29.png',
  },
};

interface SocialMediaButtonsProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  labelText?: string;
  glassEffect?: boolean;
}

export function SocialMediaButtons({
  size = 'medium',
  showLabel = true,
  labelText = 'FOLGEN SIE UNS',
  glassEffect = false,
}: SocialMediaButtonsProps) {
  const { theme } = useTheme();

  const dimensions = {
    small: { button: 48, logo: 40, icon: 20 },
    medium: { button: 64, logo: 56, icon: 28 },
    large: { button: 72, logo: 64, icon: 32 },
  };

  const dim = dimensions[size];
  const borderRadius = size === 'small' ? 12 : size === 'medium' ? 18 : 20;

  const glassStyle = glassEffect ? {
    borderWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.6)',
    borderLeftColor: 'rgba(255,255,255,0.4)',
    borderRightColor: 'rgba(0,0,0,0.1)',
    borderBottomColor: 'rgba(0,0,0,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  } : {
    borderWidth: 1,
    borderColor: theme.cardBorder,
  };

  const buttonBaseStyle = {
    width: dim.button,
    height: dim.button,
    borderRadius,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.cardBackground,
    ...glassStyle,
  };

  const logoButtonStyle = {
    width: dim.button,
    height: dim.button,
    borderRadius,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    ...(glassEffect ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,
    } : {}),
  };

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={[styles.label, { color: theme.textMuted }]}>{labelText}</Text>
      )}
      <View style={styles.buttons}>
        {/* Website */}
        <TouchableOpacity
          style={buttonBaseStyle}
          onPress={() => Linking.openURL(SOCIAL_MEDIA.website.url)}
          activeOpacity={0.7}
        >
          <Globe size={dim.icon} color={theme.primary} />
        </TouchableOpacity>

        {/* Instagram */}
        <TouchableOpacity
          style={logoButtonStyle}
          onPress={() => Linking.openURL(SOCIAL_MEDIA.instagram.url)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: SOCIAL_MEDIA.instagram.logo }}
            style={{ width: dim.logo, height: dim.logo }}
          />
        </TouchableOpacity>

        {/* Facebook */}
        <TouchableOpacity
          style={logoButtonStyle}
          onPress={() => Linking.openURL(SOCIAL_MEDIA.facebook.url)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: SOCIAL_MEDIA.facebook.logo }}
            style={{ width: dim.logo, height: dim.logo }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});

export default SocialMediaButtons;
