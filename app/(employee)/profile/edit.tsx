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
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { usersCollection } from '@/src/lib/firestore';

export default function EditProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
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
      Alert.alert('Berechtigung erforderlich', 'Bitte erlauben Sie den Zugriff auf Ihre Fotos.');
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
      Alert.alert('Berechtigung erforderlich', 'Bitte erlauben Sie den Kamerazugriff.');
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
      'Profilfoto ändern',
      'Woher möchten Sie das Bild auswählen?',
      [
        { text: 'Kamera', onPress: takePhoto },
        { text: 'Galerie', onPress: pickImage },
        avatar ? { text: 'Foto entfernen', style: 'destructive', onPress: () => setAvatar('') } : null,
        { text: 'Abbrechen', style: 'cancel' },
      ].filter(Boolean) as any
    );
  };

  const handleSave = async () => {
    if (!user) return;

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Fehler', 'Vor- und Nachname sind erforderlich.');
      return;
    }

    setIsSaving(true);
    try {
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

      Alert.alert('Gespeichert', 'Ihre Daten wurden erfolgreich aktualisiert.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Fehler', 'Daten konnten nicht gespeichert werden.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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
              <Text style={[styles.headerLarge, { color: theme.text }]}>Daten bearbeiten</Text>
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
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PERSÖNLICHE DATEN</Text>

            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Vorname *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Vorname"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={styles.formHalf}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Nachname *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Nachname"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>E-Mail</Text>
            <View style={[styles.inputDisabled, { backgroundColor: theme.surface, borderColor: theme.inputBorder }]}>
              <Mail size={18} color={theme.textMuted} />
              <Text style={[styles.inputDisabledText, { color: theme.textMuted }]}>{user?.email}</Text>
            </View>
            <Text style={[styles.inputHint, { color: theme.textMuted }]}>E-Mail kann nicht geändert werden</Text>

            <Text style={[styles.inputLabel, { color: theme.textMuted, marginTop: spacing.md }]}>Telefon</Text>
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

            <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: spacing.xl }]}>ADRESSE</Text>

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
                <Text style={[styles.saveButtonText, { color: theme.textInverse }]}>Änderungen speichern</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingTop: spacing.md,
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
