// app/(public)/_layout.tsx

import { Stack } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';

export default function PublicLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="about" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="career" />
      <Stack.Screen name="invite" />
    </Stack>
  );
}