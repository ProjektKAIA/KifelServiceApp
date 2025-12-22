// app/_layout.tsx

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/hooks/useTheme';

export default function RootLayout() {
  const { isDark } = useTheme();
  const { user, isAuthenticated, isLoading, loadStoredAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Auth beim Start laden
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Navigation basierend auf Auth-Status
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inEmployeeGroup = segments[0] === '(employee)';
    const inAdminGroup = segments[0] === '(admin)';

    if (isAuthenticated && user) {
      // Eingeloggt - zur richtigen Gruppe navigieren
      if (inAuthGroup || segments[0] === '(public)') {
        if (user.role === 'admin') {
          router.replace('/(admin)');
        } else {
          router.replace('/(employee)');
        }
      }
    } else {
      // Nicht eingeloggt - zum öffentlichen Bereich
      if (inEmployeeGroup || inAdminGroup) {
        router.replace('/(public)');
      }
    }
  }, [isAuthenticated, user, segments, isLoading]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(employee)" />
        <Stack.Screen name="(admin)" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}