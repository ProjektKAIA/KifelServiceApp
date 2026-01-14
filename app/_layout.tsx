// app/_layout.tsx

import { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import 'react-native-reanimated';

import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { toastConfig } from '@/src/components/atoms/ToastConfig';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';

export default function RootLayout() {
  const { isDark } = useTheme();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  // Navigation basierend auf Auth-Status
  useEffect(() => {
    // Warte bis Navigation bereit ist
    if (!navigationState?.key) return;
    if (isLoading) return;

    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === '(auth)';
    const inPublicGroup = currentSegment === '(public)';
    const inEmployeeGroup = currentSegment === '(employee)';
    const inAdminGroup = currentSegment === '(admin)';

    console.log('🧭 Navigation check:', {
      isAuthenticated,
      role: user?.role,
      currentSegment,
      isLoading
    });

    if (isAuthenticated && user) {
      // Eingeloggt - zur richtigen Gruppe navigieren
      const shouldBeInAdmin = user.role === 'admin';
      const shouldBeInEmployee = user.role === 'employee';

      // Wenn in falscher Gruppe oder noch in public/auth
      if (shouldBeInAdmin && !inAdminGroup) {
        console.log('🧭 Navigating to admin');
        router.replace('/(admin)');
      } else if (shouldBeInEmployee && !inEmployeeGroup) {
        console.log('🧭 Navigating to employee');
        router.replace('/(employee)');
      }
    } else {
      // Nicht eingeloggt - zum öffentlichen Bereich
      if (inEmployeeGroup || inAdminGroup) {
        console.log('🧭 Navigating to public (not authenticated)');
        router.replace('/(public)');
      }
    }
  }, [isAuthenticated, user, segments, isLoading, navigationState?.key]);

  return (
    <ErrorBoundary showDetails={__DEV__}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(public)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(employee)" />
          <Stack.Screen name="(admin)" />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Toast config={toastConfig} position="top" topOffset={50} />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
