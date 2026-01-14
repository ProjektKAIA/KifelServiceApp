// app/(admin)/_layout.tsx

import { Tabs } from 'expo-router';
import { BarChart3, Users, Calendar, MessageCircle, Settings, Clock } from 'lucide-react-native';
import { useTheme, useFeatures } from '@/src/hooks';

export default function AdminLayout() {
  const { theme } = useTheme();
  const { adminDashboardEnabled, scheduleEnabled, chatEnabled } = useFeatures();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.navBackground,
          borderTopColor: theme.navBorder,
          borderTopWidth: 1,
          paddingTop: 12,
          paddingBottom: 30,
          paddingHorizontal: 8,
          height: 92,
        },
        tabBarActiveTintColor: theme.secondary,
        tabBarInactiveTintColor: theme.navInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 6,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
          href: adminDashboardEnabled ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Team',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedules"
        options={{
          title: 'Pläne',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
          href: scheduleEnabled ? undefined : null,
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
        name="reports"
        options={{
          title: 'Stunden',
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}