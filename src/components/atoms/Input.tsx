// src/components/atoms/Input.tsx

import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { borderRadius, spacing } from '@/src/constants/spacing';

interface InputProps extends Omit<TextInputProps, 'style'> {
  icon?: LucideIcon;
  error?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  icon: Icon,
  error = false,
  containerStyle,
  inputStyle,
  ...textInputProps
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.inputBackground,
          borderColor: error ? '#ef4444' : theme.inputBorder,
        },
        containerStyle,
      ]}
    >
      {Icon && (
        <Icon size={18} color={theme.textMuted} style={styles.icon} />
      )}
      <TextInput
        style={[
          styles.input,
          { color: theme.text },
          Icon && styles.inputWithIcon,
          inputStyle,
        ]}
        placeholderTextColor={theme.textMuted}
        {...textInputProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.input,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: spacing.md,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
});