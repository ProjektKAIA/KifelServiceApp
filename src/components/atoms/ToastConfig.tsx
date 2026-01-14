/**
 * Benutzerdefinierte Toast-Konfiguration
 *
 * Definiert das Aussehen der Toast-Nachrichten passend zum App-Theme.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BaseToast, ErrorToast, ToastConfig as ToastConfigType } from 'react-native-toast-message';
import { Check, X, Info, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface CustomToastProps {
  text1?: string;
  text2?: string;
  onPress?: () => void;
  hide?: () => void;
}

const SuccessToast: React.FC<CustomToastProps> = ({ text1, text2, onPress, hide }) => {
  const { theme: colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderLeftColor: colors.success,
          shadowColor: colors.text,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
        <Check size={20} color={colors.success} />
      </View>
      <View style={styles.textContainer}>
        {text1 && <Text style={[styles.title, { color: colors.text }]}>{text1}</Text>}
        {text2 && <Text style={[styles.message, { color: colors.textSecondary }]}>{text2}</Text>}
      </View>
      <TouchableOpacity onPress={hide} style={styles.closeButton}>
        <X size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const ErrorToastCustom: React.FC<CustomToastProps> = ({ text1, text2, onPress, hide }) => {
  const { theme: colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderLeftColor: colors.danger,
          shadowColor: colors.text,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.danger + '20' }]}>
        <X size={20} color={colors.danger} />
      </View>
      <View style={styles.textContainer}>
        {text1 && <Text style={[styles.title, { color: colors.text }]}>{text1}</Text>}
        {text2 && <Text style={[styles.message, { color: colors.textSecondary }]}>{text2}</Text>}
      </View>
      <TouchableOpacity onPress={hide} style={styles.closeButton}>
        <X size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const InfoToast: React.FC<CustomToastProps> = ({ text1, text2, onPress, hide }) => {
  const { theme: colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderLeftColor: colors.primary,
          shadowColor: colors.text,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Info size={20} color={colors.primary} />
      </View>
      <View style={styles.textContainer}>
        {text1 && <Text style={[styles.title, { color: colors.text }]}>{text1}</Text>}
        {text2 && <Text style={[styles.message, { color: colors.textSecondary }]}>{text2}</Text>}
      </View>
      <TouchableOpacity onPress={hide} style={styles.closeButton}>
        <X size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export const toastConfig: ToastConfigType = {
  success: (props) => (
    <SuccessToast
      text1={props.text1}
      text2={props.text2}
      onPress={props.onPress}
      hide={props.hide}
    />
  ),
  error: (props) => (
    <ErrorToastCustom
      text1={props.text1}
      text2={props.text2}
      onPress={props.onPress}
      hide={props.hide}
    />
  ),
  info: (props) => (
    <InfoToast
      text1={props.text1}
      text2={props.text2}
      onPress={props.onPress}
      hide={props.hide}
    />
  ),
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});

export default toastConfig;
