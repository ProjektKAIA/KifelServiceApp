// src/components/atoms/Avatar.tsx

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  backgroundColor?: string;
  style?: ViewStyle;
}

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#06b6d4',
];

const getAvatarColor = (name: string): string => {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  backgroundColor,
  style,
}) => {
  const getSizeStyles = (): { container: ViewStyle; fontSize: number } => {
    switch (size) {
      case 'sm':
        return { container: { width: 32, height: 32, borderRadius: 8 }, fontSize: 11 };
      case 'lg':
        return { container: { width: 56, height: 56, borderRadius: 16 }, fontSize: 18 };
      case 'xl':
        return { container: { width: 72, height: 72, borderRadius: 20 }, fontSize: 24 };
      default:
        return { container: { width: 44, height: 44, borderRadius: 12 }, fontSize: 14 };
    }
  };

  const sizeStyles = getSizeStyles();
  const bgColor = backgroundColor || getAvatarColor(name);

  return (
    <View
      style={[
        styles.container,
        sizeStyles.container,
        { backgroundColor: bgColor },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: sizeStyles.fontSize }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});