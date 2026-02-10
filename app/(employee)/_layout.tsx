// app/(employee)/_layout.tsx

import { Tabs } from 'expo-router';
import { Home, Calendar, Clock, MessageCircle, User, BarChart2 } from 'lucide-react-native';
import { useTheme, useFeatures, useTranslation } from '@/src/hooks';

export default function EmployeeLayout() {
  const { t } = useTranslation();
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
          paddingTop: 12,
          paddingBottom: 30,
          paddingHorizontal: 8,
          height: 92,
        },
        tabBarActiveTintColor: theme.primary,
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
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: t('tabs.plan'),
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
          href: scheduleEnabled ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="time"
        options={{
          title: t('tabs.time'),
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
        name="reports"
        options={{
          title: t('tabs.hours'),
          tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
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