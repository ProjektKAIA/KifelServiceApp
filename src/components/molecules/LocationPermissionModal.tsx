// src/components/molecules/LocationPermissionModal.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { MapPin, Shield, X } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { spacing, borderRadius } from '@/src/theme/spacing';

interface LocationPermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
  onClose: () => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  visible,
  onAllow,
  onDeny,
  onClose,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const features = [
    {
      icon: MapPin,
      title: t('location.appUsageOnly'),
      description: t('location.appUsageDesc'),
    },
    {
      icon: Shield,
      title: t('location.gdprCompliant'),
      description: t('location.gdprDesc'),
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.container, { backgroundColor: theme.cardBackground }]} onPress={() => {}}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: theme.pillInfo }]}>
            <MapPin size={40} color={theme.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>
            {t('location.allowAccess')}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {t('location.needAccess')}
          </Text>

          {/* Features */}
          <View style={styles.features}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: theme.surface }]}>
                  <feature.icon size={20} color={theme.primary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.featureDescription, { color: theme.textMuted }]}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.allowButton, { backgroundColor: theme.primary }]}
              onPress={onAllow}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: theme.textInverse }]}>
                {t('location.allow')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.denyButton, { borderColor: theme.border }]}
              onPress={onDeny}
              activeOpacity={0.8}
            >
              <Text style={[styles.denyButtonText, { color: theme.textSecondary }]}>
                {t('location.notNow')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={[styles.footer, { color: theme.textMuted }]}>
            {t('location.changeInSettings')}
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: borderRadius.card + 4,
    padding: spacing.xl,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  features: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  buttons: {
    width: '100%',
    gap: spacing.sm,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: borderRadius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowButton: {},
  denyButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  denyButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 16,
  },
});
