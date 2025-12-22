// src/components/atoms/Button.tsx

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { borderRadius, spacing } from '@/src/constants/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const getVariantStyles = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case 'secondary':
        return {
          bg: theme.surface,
          text: theme.textSecondary,
          border: theme.border,
        };
      case 'danger':
        return {
          bg: '#ef4444',
          text: '#ffffff',
        };
      case 'ghost':
        return {
          bg: 'transparent',
          text: theme.textSecondary,
          border: theme.border,
        };
      default:
        return {
          bg: theme.primary,
          text: '#ffffff',
        };
    }
  };

  const getSizeStyles = (): { padding: number; fontSize: number; iconSize: number } => {
    switch (size) {
      case 'sm':
        return { padding: 10, fontSize: 13, iconSize: 14 };
      case 'lg':
        return { padding: 18, fontSize: 16, iconSize: 20 };
      default:
        return { padding: 14, fontSize: 14, iconSize: 16 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || loading;

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={variantStyles.text} />;
    }

    const iconElement = Icon ? (
      <Icon size={sizeStyles.iconSize} color={variantStyles.text} />
    ) : null;

    return (
      <View style={styles.content}>
        {iconPosition === 'left' && iconElement}
        <Text
          style={[
            styles.text,
            { color: variantStyles.text, fontSize: sizeStyles.fontSize },
            textStyle,
          ]}
        >
          {title}
        </Text>
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.bg,
          paddingVertical: sizeStyles.padding,
          borderColor: variantStyles.border || 'transparent',
          borderWidth: variantStyles.border ? 1 : 0,
          opacity: isDisabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    fontWeight: '600',
  },
});