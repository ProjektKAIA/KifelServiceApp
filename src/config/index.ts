// src/config/index.ts

import { activeBrand, BrandConfig } from './branding';
import { features, FeatureFlags, isFeatureEnabled } from './features';

export interface AppConfig {
  env: 'development' | 'staging' | 'production';
  version: string;
  buildNumber: string;

  api: {
    baseUrl: string;
    timeout: number;
  };

  supabase: {
    url: string;
    anonKey: string;
  };
}

const ENV = __DEV__ ? 'development' : 'production';

const config: AppConfig = {
  env: ENV,
  version: '1.0.0',
  buildNumber: '1',

  api: {
    baseUrl: ENV === 'development'
      ? 'https://dev-api.kifel-service.de'
      : 'https://api.kifel-service.de',
    timeout: 30000,
  },

  // TODO: Replace with real Supabase credentials before production deployment
  supabase: {
    url: ENV === 'development'
      ? 'https://xxx-dev.supabase.co'
      : 'https://xxx-prod.supabase.co',
    anonKey: ENV === 'development'
      ? 'dev-anon-key'
      : 'prod-anon-key',
  },
};

export {
  config,
  activeBrand,
  features,
  isFeatureEnabled,
};

export type { BrandConfig, FeatureFlags };