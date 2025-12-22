// src/components/atoms/IconBox.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

type IconBoxSize = 'sm' | 'md' | 'lg' | 'xl';

interface IconBoxProps {
  icon: LucideIcon;
  size?: IconBoxSize;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const IconBox: React.FC<IconBoxProps> = ({
  icon: Icon,
  size = 'md',
  color,
  backgroundColor,
  style,
}) => {
  const { theme } = useTheme();

  const getSizeStyles = (): { box: number; icon: number; radius: number } => {
    switch (size) {
      case 'sm':
        return { box: 36, icon: 16, radius: 10 };
      case 'lg':
        return { box: 56, icon: 24, radius: 16 };
      case 'xl':
        return { box: 72, icon: 32, radius: 20 };
      default:
        return { box: 44, icon: 20, radius: 12 };
    }
  };

  const sizeStyles = getSizeStyles();
  const iconColor = color || theme.primary;
  const bgColor = backgroundColor || theme.surface;

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeStyles.box,
          height: sizeStyles.box,
          borderRadius: sizeStyles.radius,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      <Icon size={sizeStyles.icon} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});