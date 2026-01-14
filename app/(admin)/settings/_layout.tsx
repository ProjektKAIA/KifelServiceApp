// app/(admin)/settings/_layout.tsx

import { Stack } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';

export default function SettingsLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    />
  );
}
