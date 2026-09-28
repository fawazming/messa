import { Tabs } from 'expo-router/js-tabs';
import { Database, FileText, History, Home } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, palette } from '@/constants/theme';

export default function TabsLayout() {
  // Devices with a 3-button system navbar report a bottom inset; gesture-nav devices
  // usually report a smaller one. Grow the tab bar so labels/actions are never clipped.
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.indigo,
        tabBarInactiveTintColor: palette.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          paddingTop: 6,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.caption,
          fontWeight: '600',
        },
        tabBarIconStyle: { marginTop: 2 },
        sceneStyle: { backgroundColor: palette.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="data"
        options={{
          title: 'Data',
          tabBarIcon: ({ color, size }) => <Database size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: 'Templates',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <History size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
