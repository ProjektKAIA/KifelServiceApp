// src/config/branding/kifel.ts

import { BrandConfig } from './index';

export const kifelBrand: BrandConfig = {
  id: 'kifel',
  name: 'Kifel Service',
  slogan: 'Ihr Partner für Qualität',

  logo: {
    text: 'KIFEL SERVICE',
    // icon: require('../../assets/logo-kifel.png'),
  },

  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#6366f1',
  },

  contact: {
    email: 'info@kifel-service.de',
    phone: '',
    website: 'https://kifel-service.de',
    address: 'Forst, Deutschland',
  },

  legal: {
    companyName: 'Kifel Service',
    privacyUrl: '',
    termsUrl: '',
    imprintUrl: '',
  },

  social: {
    facebook: '',
    instagram: '',
    linkedin: '',
  },

  appStore: {
    ios: '',
    android: '',
  },
};