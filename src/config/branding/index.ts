// src/config/branding/index.ts

import { kifelBrand } from './kifel';

export interface BrandConfig {
  id: string;
  name: string;
  slogan: string;

  logo: {
    text: string;
    icon?: any;
  };

  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };

  contact: {
    email: string;
    phone: string;
    website: string;
    address: string;
  };

  legal: {
    companyName: string;
    privacyUrl: string;
    termsUrl: string;
    imprintUrl: string;
  };

  social: {
    facebook: string;
    instagram: string;
    linkedin: string;
  };

  appStore: {
    ios: string;
    android: string;
  };
}

// Aktive Marke exportieren
export const activeBrand: BrandConfig = kifelBrand;

export { kifelBrand };