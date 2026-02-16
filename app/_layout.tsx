// app/_layout.tsx

import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import 'react-native-reanimated';

import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { toastConfig } from '@/src/components/atoms/ToastConfig';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { OfflineIndicator } from '@/src/components/atoms/OfflineIndicator';
import { initNetworkListener, cleanupNetworkListener, setSyncCallback } from '@/src/services/networkService';
import { loadQueue, processSyncQueue } from '@/src/services/offlineQueueService';
import { isFeatureEnabled } from '@/src/config/features';
import { useNotificationStore } from '@/src/store/notificationStore';
import { pushNotificationService } from '@/src/services/pushNotificationService';

export default function RootLayout() {
  const { isDark, theme } = useTheme();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  // Offline-Services initialisieren
  useEffect(() => {
    if (isFeatureEnabled('offlineMode')) {
      // Network-Listener starten
      initNetworkListener();

      // Offline-Queue laden
      loadQueue();

      // Callback setzen fuer automatische Sync bei Netzwerkwiederkehr
      setSyncCallback(() => {
        processSyncQueue();
      });

      return () => {
        cleanupNetworkListener();
      };
    }
  }, []);

  // Push-Notification-Service initialisieren
  useEffect(() => {
    if (isFeatureEnabled('pushNotifications') && isAuthenticated && user?.id) {
      const initializeNotifications = async () => {
        await useNotificationStore.getState().initialize(user.id);
      };

      initializeNotifications();

      return () => {
        pushNotificationService.cleanup();
      };
    }
  }, [isAuthenticated, user?.id]);

  // Navigation basierend auf Auth-Status
  useEffect(() => {
    // Warte bis Navigation bereit ist
    if (!navigationState?.key) return;
    if (isLoading) return;

    const currentSegment = segments[0];
    const inEmployeeGroup = currentSegment === '(employee)';
    const inAdminGroup = currentSegment === '(admin)';

    if (isAuthenticated && user) {
      // Eingeloggt - zur richtigen Gruppe navigieren
      const shouldBeInAdmin = user.role === 'admin';
      const shouldBeInEmployee = user.role === 'employee';

      // Wenn in falscher Gruppe oder noch in public/auth
      if (shouldBeInAdmin && !inAdminGroup) {
        router.replace('/(admin)');
      } else if (shouldBeInEmployee && !inEmployeeGroup) {
        router.replace('/(employee)');
      }
    } else {
      // Nicht eingeloggt - zum öffentlichen Bereich
      if (inEmployeeGroup || inAdminGroup) {
        router.replace('/(public)');
      }
    }
  }, [isAuthenticated, user, segments, isLoading, navigationState?.key]);

  return (
    <ErrorBoundary showDetails={__DEV__}>
      <SafeAreaProvider style={{ backgroundColor: theme.background }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
          <Stack.Screen name="(public)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(employee)" />
          <Stack.Screen name="(admin)" />
        </Stack>
        {/* Offline-Indikator als Overlay ueber dem Content */}
        {isFeatureEnabled('offlineMode') && <OfflineIndicatorWrapper />}
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Toast config={toastConfig} position="top" topOffset={50} />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

/**
 * Wrapper-Komponente fuer OfflineIndicator als Overlay (nimmt keinen Platz im Layout ein)
 */
function OfflineIndicatorWrapper() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ position: 'absolute', top: insets.top, left: 0, right: 0, zIndex: 100 }}>
      <OfflineIndicator />
    </View>
  );
}
