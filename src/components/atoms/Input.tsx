// src/components/atoms/Input.tsx

import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { borderRadius, spacing } from '@/src/constants/spacing';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  icon?: LucideIcon;
  error?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  icon: Icon,
  error = false,
  containerStyle,
  inputStyle,
  label,
  ...textInputProps
}) => {
  const { theme } = useTheme();

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.inputBackground,
            borderColor: error ? '#ef4444' : theme.inputBorder,
          },
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
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
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
