import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';

import { useI18n } from '@/lib/i18n';
import { C } from '@/lib/theme';

export default function TabLayout() {
  const { t } = useI18n();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.tab,
        tabBarInactiveTintColor: '#8a8a8a',
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
        tabBarStyle: { backgroundColor: C.white },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('tab_home'), tabBarIcon: ({ color }) => <MaterialIcons name="home" size={26} color={color} /> }}
      />
      <Tabs.Screen
        name="planning"
        options={{ title: t('tab_planning'), tabBarIcon: ({ color }) => <MaterialIcons name="event" size={26} color={color} /> }}
      />
      <Tabs.Screen
        name="pieces"
        options={{ title: t('tab_pieces'), tabBarIcon: ({ color }) => <MaterialIcons name="inventory-2" size={26} color={color} /> }}
      />
    </Tabs>
  );
}
