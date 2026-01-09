// app/(employee)/_layout.tsx

import { Tabs } from 'expo-router';
import { Home, Calendar, Clock, MessageCircle, User } from 'lucide-react-native';
import { useTheme, useFeatures } from '@/src/hooks';

export default function EmployeeLayout() {
  const { theme } = useTheme();
  const { scheduleEnabled, timeTrackingEnabled, chatEnabled } = useFeatures();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.navBackground,
          borderTopColor: theme.navBorder,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 24,
          height: 80,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.navInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
          href: scheduleEnabled ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="time"
        options={{
          title: 'Zeit',
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
          href: timeTrackingEnabled ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          href: chatEnabled ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vacation"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="timetracking"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}