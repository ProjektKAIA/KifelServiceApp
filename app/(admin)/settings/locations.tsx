// app/(admin)/settings/locations.tsx - Einsatzorte verwalten

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ExpoLocation from 'expo-location';
import {
  ArrowLeft,
  Plus,
  MapPin,
  Trash2,
  Edit3,
  Navigation,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { locationsCollection } from '@/src/lib/firestore';
import { useLocationStore } from '@/src/store/locationStore';
import { Location as AppLocation } from '@/src/types';
import { features } from '@/src/config/features';

export default function LocationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { locations, fetchLocations, isLoading: storeLoading } = useLocationStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<AppLocation | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState(String(features.locationValidationRadius));
  const [isGettingGps, setIsGettingGps] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await fetchLocations();
    setIsLoading(false);
  }, [fetchLocations]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setName('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setRadius(String(features.locationValidationRadius));
    setEditingLocation(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (loc: AppLocation) => {
    setEditingLocation(loc);
    setName(loc.name);
    setAddress(loc.address);
    setLatitude(String(loc.latitude));
    setLongitude(String(loc.longitude));
    setRadius(String(loc.radius ?? features.locationValidationRadius));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleGetCurrentPosition = async () => {
    setIsGettingGps(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('settings.locationDenied'));
        return;
      }

      const loc = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
      });
      setLatitude(String(loc.coords.latitude));
      setLongitude(String(loc.coords.longitude));

      // Try reverse geocoding for address
      try {
        const [geo] = await ExpoLocation.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geo) {
          const parts = [geo.street, geo.streetNumber, geo.postalCode, geo.city].filter(Boolean);
          if (parts.length > 0 && !address) {
            setAddress(parts.join(' '));
          }
        }
      } catch {
        // Geocoding failed silently - coordinates are still set
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('settingsLocations.gpsError'));
    } finally {
      setIsGettingGps(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('settingsLocations.nameRequired'));
      return;
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert(t('common.error'), t('settingsLocations.coordsRequired'));
      return;
    }

    const radiusNum = parseInt(radius, 10);

    try {
      const locationData = {
        name: name.trim(),
        address: address.trim(),
        latitude: lat,
        longitude: lon,
        radius: isNaN(radiusNum) ? features.locationValidationRadius : radiusNum,
      };

      if (editingLocation) {
        await locationsCollection.update(editingLocation.id, locationData);
        Alert.alert(t('common.success'), t('settingsLocations.updated'));
      } else {
        await locationsCollection.create(locationData);
        Alert.alert(t('common.success'), t('settingsLocations.created'));
      }

      closeForm();
      loadData();
    } catch (error) {
      Alert.alert(t('common.error'), t('settingsLocations.saveError'));
    }
  };

  const handleDelete = (loc: AppLocation) => {
    Alert.alert(
      t('settingsLocations.deleteTitle'),
      t('settingsLocations.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await locationsCollection.delete(loc.id);
              loadData();
            } catch (error) {
              Alert.alert(t('common.error'), t('settingsLocations.deleteError'));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.headerSmall, { color: theme.textMuted }]}>{t('settings.system')}</Text>
            <Text style={[styles.headerLarge, { color: theme.text }]}>{t('settings.locations')}</Text>
          </View>
          {!showForm && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={openAddForm}
            >
              <Plus size={20} color={theme.textInverse} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('settingsLocations.subtitle')}
        </Text>

        {/* Form */}
        {showForm && (
          <View style={[styles.formCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: theme.text }]}>
                {editingLocation ? t('settingsLocations.edit') : t('settingsLocations.add')}
              </Text>
              <TouchableOpacity onPress={closeForm}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsLocations.name')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={name}
              onChangeText={setName}
              placeholder={t('settingsLocations.namePlaceholder')}
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsLocations.address')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={address}
              onChangeText={setAddress}
              placeholder={t('settingsLocations.addressPlaceholder')}
              placeholderTextColor={theme.textMuted}
            />

            <View style={styles.coordsRow}>
              <View style={styles.coordInput}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsLocations.latitude')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="51.1234"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.coordInput}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsLocations.longitude')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="6.5678"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.gpsButton, { backgroundColor: theme.pillInfo, borderColor: theme.primary }]}
              onPress={handleGetCurrentPosition}
              disabled={isGettingGps}
            >
              {isGettingGps ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Navigation size={16} color={theme.primary} />
              )}
              <Text style={[styles.gpsButtonText, { color: theme.primary }]}>
                {t('settingsLocations.useCurrentGps')}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{t('settingsLocations.radius')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={radius}
              onChangeText={setRadius}
              placeholder="200"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
            />
            <Text style={[styles.inputHint, { color: theme.textMuted }]}>
              {t('settingsLocations.radiusHint')}
            </Text>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
            >
              <Text style={[styles.saveButtonText, { color: theme.textInverse }]}>
                {editingLocation ? t('common.save') : t('settingsLocations.add')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}

        {/* Locations List */}
        {!isLoading && locations.length === 0 && !showForm && (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <MapPin size={40} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {t('settingsLocations.noLocations')}
            </Text>
            <Text style={[styles.emptyHint, { color: theme.textMuted }]}>
              {t('settingsLocations.noLocationsHint')}
            </Text>
          </View>
        )}

        {!isLoading && locations.map((loc) => (
          <View
            key={loc.id}
            style={[styles.locationCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          >
            <View style={styles.locationHeader}>
              <View style={[styles.locationIcon, { backgroundColor: theme.pillInfo }]}>
                <MapPin size={18} color={theme.primary} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationName, { color: theme.text }]}>{loc.name}</Text>
                {loc.address ? (
                  <Text style={[styles.locationAddress, { color: theme.textMuted }]} numberOfLines={1}>
                    {loc.address}
                  </Text>
                ) : null}
                <Text style={[styles.locationCoords, { color: theme.textMuted }]}>
                  {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)} · {loc.radius ?? features.locationValidationRadius}m
                </Text>
              </View>
              <View style={styles.locationActions}>
                <TouchableOpacity onPress={() => openEditForm(loc)} style={styles.actionBtn}>
                  <Edit3 size={16} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(loc)} style={styles.actionBtn}>
                  <Trash2 size={16} color={theme.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  // Form
  formCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 15,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
  },
  coordsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  coordInput: {
    flex: 1,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  gpsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Loading
  loadingContainer: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  // Empty
  emptyCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing['3xl'],
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  // Location cards
  locationCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  locationCoords: {
    fontSize: 11,
    marginTop: 2,
  },
  locationActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
