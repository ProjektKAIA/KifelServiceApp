// src/components/molecules/LanguageSelector.tsx

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { LANGUAGES } from '@/src/i18n';
import { spacing, borderRadius } from '@/src/theme/spacing';

export const LanguageSelector: React.FC = () => {
  const { theme } = useTheme();
  const { language, setLanguage } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {LANGUAGES.map((lang) => {
        const isActive = language === lang.code;

        return (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.option,
              isActive && { backgroundColor: theme.primary },
            ]}
            onPress={() => setLanguage(lang.code)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? '#fff' : theme.textSecondary },
              ]}
            >
              {lang.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
