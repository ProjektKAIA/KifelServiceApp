// app/(employee)/profile/edit.tsx - Mitarbeiter Profil bearbeiten

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera,
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { usersCollection, adminNotificationsCollection } from '@/src/lib/firestore';

export default function EditProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();

  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState(user?.street || '');
  const [zipCode, setZipCode] = useState(user?.zipCode || '');
  const [city, setCity] = useState(user?.city || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const getInitials = (): string => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'MA';
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('empProfileEdit.permissionRequired'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setAvatar(base64Image);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('empProfileEdit.cameraPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setAvatar(base64Image);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      t('empProfileEdit.changePhoto'),
      '',
      [
        { text: t('empProfileEdit.takePhoto'), onPress: takePhoto },
        { text: t('empProfileEdit.selectPhoto'), onPress: pickImage },
        avatar ? { text: t('empProfileEdit.removePhoto'), style: 'destructive', onPress: () => setAvatar('') } : null,
        { text: t('common.cancel'), style: 'cancel' },
      ].filter(Boolean) as any
    );
  };

  const handleSave = async () => {
    if (!user) return;

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t('common.error'), t('empProfileEdit.nameRequired'));
      return;
    }

    setIsSaving(true);
    try {
      // Track changes for admin notification
      const changes: Record<string, { old: string; new: string }> = {};

      if (firstName.trim() !== (user.firstName || '')) {
        changes['Vorname'] = { old: user.firstName || '-', new: firstName.trim() };
      }
      if (lastName.trim() !== (user.lastName || '')) {
        changes['Nachname'] = { old: user.lastName || '-', new: lastName.trim() };
      }
      if (phone.trim() !== (user.phone || '')) {
        changes['Telefon'] = { old: user.phone || '-', new: phone.trim() || '-' };
      }
      if (street.trim() !== (user.street || '')) {
        changes['Straße'] = { old: user.street || '-', new: street.trim() || '-' };
      }
      if (zipCode.trim() !== (user.zipCode || '')) {
        changes['PLZ'] = { old: user.zipCode || '-', new: zipCode.trim() || '-' };
      }
      if (city.trim() !== (user.city || '')) {
        changes['Stadt'] = { old: user.city || '-', new: city.trim() || '-' };
      }
      if (birthDate.trim() !== (user.birthDate || '')) {
        changes['Geburtsdatum'] = { old: user.birthDate || '-', new: birthDate.trim() || '-' };
      }
      if (avatar !== (user.avatar || '')) {
        changes['Profilfoto'] = { old: user.avatar ? 'vorhanden' : '-', new: avatar ? 'geändert' : 'entfernt' };
      }

      await usersCollection.update(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        zipCode: zipCode.trim(),
        city: city.trim(),
        birthDate: birthDate.trim(),
        avatar: avatar,
      });

      // Send admin notification if there are changes
      if (Object.keys(changes).length > 0) {
        const changedFields = Object.keys(changes).join(', ');
        await adminNotificationsCollection.create({
          type: 'profile_change',
          userId: user.id,
          userName: `${firstName.trim()} ${lastName.trim()}`,
          title: 'Profil geändert',
          message: `${firstName.trim()} ${lastName.trim()} hat folgende Daten geändert: ${changedFields}`,
          changes,
        });
      }

      // Update local state
      setUser({
        ...user,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        zipCode: zipCode.trim(),
        city: city.trim(),
        birthDate: birthDate.trim(),
        avatar: avatar,
      });

      Alert.alert(t('empProfileEdit.saved'), t('empProfileEdit.savedMessage'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(t('common.error'), t('empProfileEdit.errorSaving'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Profil</Text>
              <Text style={[styles.headerLarge, { color: theme.text }]}>{t('empProfileEdit.title')}</Text>
            </View>
          </View>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={[styles.avatarContainer, { backgroundColor: theme.primary }]}
              onPress={showImageOptions}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: theme.textInverse }]}>
                  {getInitials()}
                </Text>
              )}
              <View style={[styles.cameraButton, { backgroundColor: theme.secondary }]}>
                <Camera size={16} color={theme.textInverse} />
              </View>
            </TouchableOpacity>
            <Text style={[styles.avatarHint, { color: theme.textMuted }]}>
              Tippen zum Ändern
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.formCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('empProfileEdit.personalData')}</Text>

            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('empProfileEdit.firstName')} *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Vorname"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={styles.formHalf}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('empProfileEdit.lastName')} *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Nachname"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('empProfileEdit.email')}</Text>
            <View style={[styles.inputDisabled, { backgroundColor: theme.surface, borderColor: theme.inputBorder }]}>
              <Mail size={18} color={theme.textMuted} />
              <Text style={[styles.inputDisabledText, { color: theme.textMuted }]}>{user?.email}</Text>
            </View>
            <Text style={[styles.inputHint, { color: theme.textMuted }]}>E-Mail kann nicht geändert werden</Text>

            <Text style={[styles.inputLabel, { color: theme.textMuted, marginTop: spacing.md }]}>{t('empProfileEdit.phone')}</Text>
            <View style={styles.inputWithIcon}>
              <Phone size={18} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputIconField, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+49 123 456789"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Geburtsdatum</Text>
            <View style={styles.inputWithIcon}>
              <Calendar size={18} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputIconField, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="TT.MM.JJJJ"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: spacing.xl }]}>{t('empProfileEdit.address')}</Text>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Straße & Hausnummer</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={18} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputIconField, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={street}
                onChangeText={setStreet}
                placeholder="Musterstraße 1"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formHalf, { flex: 0.35 }]}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>PLZ</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                  value={zipCode}
                  onChangeText={setZipCode}
                  placeholder="12345"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
              <View style={[styles.formHalf, { flex: 0.65 }]}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Stadt</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Musterstadt"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>
          </View>

          {/* Info */}
          <Text style={[styles.infoText, { color: theme.textMuted }]}>
            Bei Änderung von Bankdaten oder Steuerklasse wenden Sie sich bitte an Ihren Arbeitgeber.
          </Text>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.textInverse} />
            ) : (
              <>
                <Save size={20} color={theme.textInverse} />
                <Text style={[styles.saveButtonText, { color: theme.textInverse }]}>{t('empProfileEdit.save')}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerSmall: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerLarge: {
    fontSize: 22,
    fontWeight: '700',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: 12,
    marginTop: spacing.sm,
  },
  formCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formHalf: {
    flex: 0.5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  inputDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  inputDisabledText: {
    fontSize: 15,
  },
  inputHint: {
    fontSize: 11,
    marginTop: 4,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
  },
  inputIconField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    paddingLeft: 44,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: borderRadius.input,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
