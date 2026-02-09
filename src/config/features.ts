// src/config/features.ts

export interface FeatureFlags {
  // Öffentlicher Bereich
  publicAbout: boolean;
  publicContact: boolean;
  publicCareer: boolean;

  // Mitarbeiter Features
  timeTracking: boolean;
  gpsTracking: boolean;
  gpsInterval: number; // Minuten
  schedule: boolean;
  vacation: boolean;
  sickLeave: boolean;
  chat: boolean;
  chatImages: boolean;
  chatDocuments: boolean;

  // Admin Features
  adminDashboard: boolean;
  adminReports: boolean;
  adminChatModeration: boolean;

  // Standort-Validierung
  locationValidation: boolean;
  locationValidationRadius: number; // Default-Radius in Metern

  // Allgemein
  darkMode: boolean;
  pushNotifications: boolean;
  offlineMode: boolean;
}

export const features: FeatureFlags = {
  // Öffentlicher Bereich
  publicAbout: true,
  publicContact: true,
  publicCareer: true,

  // Mitarbeiter Features
  timeTracking: true,
  gpsTracking: true,
  gpsInterval: 5,
  schedule: true,
  vacation: true,
  sickLeave: true,
  chat: true,
  chatImages: true,
  chatDocuments: false,

  // Admin Features
  adminDashboard: true,
  adminReports: true,
  adminChatModeration: true,

  // Standort-Validierung
  locationValidation: true,
  locationValidationRadius: 200, // 200m default

  // Allgemein
  darkMode: true,
  pushNotifications: true,
  offlineMode: true,
};

export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return features[feature] === true;
};