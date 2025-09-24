import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AnimatedTabIcon } from '@/components/navigation/AnimatedTabIcon';
import { Colors } from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopColor: Colors[colorScheme ?? 'light'].border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: Strings.tabs.home,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="play.circle.fill"
              color={color}
              size={28}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="polls"
        options={{
          title: Strings.tabs.polls,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: Strings.tabs.news,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="newspaper.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sponsors"
        options={{
          title: Strings.tabs.sponsors,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="megaphone.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: Strings.tabs.settings,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
