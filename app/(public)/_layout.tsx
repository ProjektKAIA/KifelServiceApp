// app/(public)/_layout.tsx

import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { colors } from '@/src/theme/colors';

export default function PublicLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="about" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="career" />
    </Stack>
  );
}