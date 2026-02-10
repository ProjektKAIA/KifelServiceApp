// app/(admin)/settings/profile.tsx - Admin & Firmen-Profil

import React, { useState, useEffect } from 'react';
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
import {
  ArrowLeft,
  Camera,
  Building2,
  User,
  Save,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { usersCollection, companyCollection } from '@/src/lib/firestore';
import { Company } from '@/src/types';

let ImagePicker: typeof import('expo-image-picker') | null = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {
  console.warn('[Profile] expo-image-picker not available (Expo Go?)');
}

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'company'>('personal');

  // Personal data
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState(user?.street || '');
  const [zipCode, setZipCode] = useState(user?.zipCode || '');
  const [city, setCity] = useState(user?.city || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  // Company data
  const [company, setCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyStreet, setCompanyStreet] = useState('');
  const [companyZipCode, setCompanyZipCode] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyTaxId, setCompanyTaxId] = useState('');

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    setIsLoading(true);
    try {
      const companyData = await companyCollection.get();
      if (companyData) {
        setCompany(companyData);
        setCompanyName(companyData.name || '');
        setCompanyLogo(companyData.logo || '');
        setCompanyStreet(companyData.street || '');
        setCompanyZipCode(companyData.zipCode || '');
        setCompanyCity(companyData.city || '');
        setCompanyPhone(companyData.phone || '');
        setCompanyEmail(companyData.email || '');
        setCompanyWebsite(companyData.website || '');
        setCompanyTaxId(companyData.taxId || '');
      }
    } catch (error) {
      console.log('Error loading company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async (type: 'avatar' | 'logo') => {
    if (!ImagePicker) {
      Alert.alert(t('settingsProfile.imageNotAvailable'), t('settingsProfile.imageNotAvailableMessage'));
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('settingsProfile.permissionRequired'), t('settingsProfile.photoPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (type === 'avatar') {
        setAvatar(base64Image);
      } else {
        setCompanyLogo(base64Image);
      }
    }
  };

  const savePersonalData = async () => {
    if (!user) return;

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t('common.error'), t('settingsProfile.nameRequired'));
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
        avatar: avatar,
      });

      Alert.alert(t('common.success'), t('settingsProfile.personalDataSaved'));
    } catch (error) {
      Alert.alert(t('common.error'), t('settingsProfile.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const saveCompanyData = async () => {
    if (!companyName.trim()) {
      Alert.alert(t('common.error'), t('settingsProfile.companyNameRequired'));
      return;
    }

    setIsSaving(true);
    try {
      await companyCollection.save({
        name: companyName.trim(),
        logo: companyLogo,
        street: companyStreet.trim(),
        zipCode: companyZipCode.trim(),
        city: companyCity.trim(),
        phone: companyPhone.trim(),
        email: companyEmail.trim(),
        website: companyWebsite.trim(),
        taxId: companyTaxId.trim(),
      });

      Alert.alert(t('common.success'), t('settingsProfile.companyDataSaved'));
      loadCompanyData();
    } catch (error) {
      Alert.alert(t('common.error'), t('settingsProfile.companySaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (first: string, last: string): string => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'AD';
  };

  const renderPersonalTab = () => (
    <View style={styles.tabContent}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={[styles.avatarContainer, { backgroundColor: theme.secondary }]}
          onPress={() => pickImage('avatar')}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarText, { color: theme.textInverse }]}>
              {getInitials(firstName, lastName)}
            </Text>
          )}
          <View style={[styles.cameraButton, { backgroundColor: theme.primary }]}>
            <Camera size={16} color={theme.textInverse} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.avatarHint, { color: theme.textMuted }]}>
          {t('settingsProfile.tapToChange')}
        </Text>
      </View>

      {/* Form */}
      <View style={[styles.formCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <View style={styles.formRow}>
          <View style={styles.formHalf}>
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsProfile.firstName')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('settingsProfile.firstName')}
              placeholderTextColor={theme.textMuted}
            />
          </View>
          <View style={styles.formHalf}>
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsProfile.lastName')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('settingsProfile.lastName')}
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>

        <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsProfile.email')}</Text>
        <View style={[styles.inputDisabled, { backgroundColor: theme.surface, borderColor: theme.inputBorder }]}>
          <Mail size={18} color={theme.textMuted} />
          <Text style={[styles.inputDisabledText, { color: theme.textMuted }]}>{email}</Text>
        </View>
        <Text style={[styles.inputHint, { color: theme.textMuted }]}>{t('settingsProfile.emailReadonly')}</Text>

        <Text style={[styles.inputLabel, { color: theme.textMuted, marginTop: spacing.md }]}>{t('settingsProfile.phone')}</Text>
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

        <Text style={[styles.sectionDivider, { color: theme.textMuted }]}>{t('settingsProfile.addressSection')}</Text>

        <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsProfile.streetAndNumber')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
          value={street}
          onChangeText={setStreet}
          placeholder="Musterstraße 1"
          placeholderTextColor={theme.textMuted}
        />

        <View style={styles.formRow}>
          <View style={[styles.formHalf, { flex: 0.35 }]}>
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsProfile.zipCode')}</Text>
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
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsProfile.city')}</Text>
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

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.primary }]}
        onPress={savePersonalData}
        disabled={isSaving}
        activeOpacity={0.8}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={theme.textInverse} />
        ) : (
          <>
            <Save size={20} color={theme.textInverse} />
            <Text style={[styles.saveButtonText, { color: theme.textInverse }]}>{t('settingsProfile.save')}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderCompanyTab = () => (
    <View style={styles.tabContent}>
      {/* Logo */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={[styles.logoContainer, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => pickImage('logo')}
        >
          {companyLogo ? (
            <Image source={{ uri: companyLogo }} style={styles.logoImage} />
          ) : (
            <Building2 size={40} color={theme.textMuted} />
          )}
          <View style={[styles.cameraButton, { backgroundColor: theme.primary }]}>
            <Camera size={16} color={theme.textInverse} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.avatarHint, { color: theme.textMuted }]}>
          {t('settingsProfile.uploadLogo')}
        </Text>
      </View>

      {/* Form */}
      <View style={[styles.formCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsProfile.companyName')} *</Text>
        <View style={styles.inputWithIcon}>
          <Building2 size={18} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.inputIconField, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Kifel Service GmbH"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <Text style={[styles.sectionDivider, { color: theme.textMuted }]}>{t('settingsProfile.contactSection')}</Text>

        <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsProfile.phone')}</Text>
        <View style={styles.inputWithIcon}>
          <Phone size={18} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.inputIconField, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
            value={companyPhone}
            onChangeText={setCompanyPhone}
            placeholder="+49 123 456789"
            placeholderTextColor={theme.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsProfile.email')}</Text>
        <View style={styles.inputWithIcon}>
          <Mail size={18} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.inputIconField, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
            value={companyEmail}
            onChangeText={setCompanyEmail}
            placeholder="info@firma.de"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Website</Text>
        <View style={styles.inputWithIcon}>
          <Globe size={18} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.inputIconField, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
            value={companyWebsite}
            onChangeText={setCompanyWebsite}
            placeholder="www.firma.de"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
          />
        </View>

        <Text style={[styles.sectionDivider, { color: theme.textMuted }]}>{t('settingsProfile.addressSection')}</Text>

        <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsProfile.companyAddress')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
          value={companyStreet}
          onChangeText={setCompanyStreet}
          placeholder="Musterstraße 1"
          placeholderTextColor={theme.textMuted}
        />

        <View style={styles.formRow}>
          <View style={[styles.formHalf, { flex: 0.35 }]}>
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsProfile.zipCode')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
              value={companyZipCode}
              onChangeText={setCompanyZipCode}
              placeholder="12345"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
          <View style={[styles.formHalf, { flex: 0.65 }]}>
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsProfile.city')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
              value={companyCity}
              onChangeText={setCompanyCity}
              placeholder="Musterstadt"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>

        <Text style={[styles.sectionDivider, { color: theme.textMuted }]}>{t('settingsProfile.legalSection')}</Text>

        <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsProfile.taxId')}</Text>
        <View style={styles.inputWithIcon}>
          <FileText size={18} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.inputIconField, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
            value={companyTaxId}
            onChangeText={setCompanyTaxId}
            placeholder="DE123456789"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.primary }]}
        onPress={saveCompanyData}
        disabled={isSaving}
        activeOpacity={0.8}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={theme.textInverse} />
        ) : (
          <>
            <Save size={20} color={theme.textInverse} />
            <Text style={[styles.saveButtonText, { color: theme.textInverse }]}>{t('settingsProfile.save')}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top - 20 }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top - 20 }]}>
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
              <Text style={[styles.headerSmall, { color: theme.textMuted }]}>{t('settingsProfile.overline')}</Text>
              <Text style={[styles.headerLarge, { color: theme.text }]}>{t('settingsProfile.title')}</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={[styles.tabBar, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'personal' && { backgroundColor: theme.primary },
              ]}
              onPress={() => setActiveTab('personal')}
            >
              <User size={18} color={activeTab === 'personal' ? theme.textInverse : theme.textSecondary} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'personal' ? theme.textInverse : theme.textSecondary },
                ]}
              >
                {t('settingsProfile.personalData')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'company' && { backgroundColor: theme.primary },
              ]}
              onPress={() => setActiveTab('company')}
            >
              <Building2 size={18} color={activeTab === 'company' ? theme.textInverse : theme.textSecondary} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'company' ? theme.textInverse : theme.textSecondary },
                ]}
              >
                {t('settingsProfile.companyData')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'personal' ? renderPersonalTab() : renderCompanyTab()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  tabBar: {
    flexDirection: 'row',
    borderRadius: borderRadius.input,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.input - 2,
    gap: spacing.xs,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {},
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
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.card,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.card - 2,
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
    marginBottom: spacing.lg,
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
  sectionDivider: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
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
