// app/(auth)/_layout.tsx

import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { colors } from '@/src/theme/colors';

export default function AuthLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}