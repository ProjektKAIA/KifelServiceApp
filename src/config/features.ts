// src/config/features.ts

export interface FeatureFlags {
  // Mitarbeiter Features
  timeTracking: boolean;
  gpsTracking: boolean;
  gpsInterval: number; // Minuten
  schedule: boolean;
  vacation: boolean;
  sickLeave: boolean;
  chat: boolean;

  // Admin Features
  adminDashboard: boolean;

  // Standort-Validierung
  locationValidation: boolean;
  locationValidationRadius: number; // Default-Radius in Metern

  // Allgemein
  pushNotifications: boolean;
  offlineMode: boolean;
}

export const features: FeatureFlags = {
  // Mitarbeiter Features
  timeTracking: true,
  gpsTracking: true,
  gpsInterval: 5,
  schedule: true,
  vacation: true,
  sickLeave: true,
  chat: true,

  // Admin Features
  adminDashboard: true,

  // Standort-Validierung
  locationValidation: true,
  locationValidationRadius: 200, // 200m default

  // Allgemein
  pushNotifications: true,
  offlineMode: true,
};

export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return features[feature] === true;
};