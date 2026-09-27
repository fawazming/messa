import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { SplashView } from '@/components/SplashView';
import { palette } from '@/constants/theme';
import { useAppStore } from '@/store/appStore';
import { useDataStore } from '@/store/dataStore';
import { useTemplatesStore } from '@/store/templatesStore';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const hydrated = useAppStore((state) => state.hydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        await useAppStore.getState().hydrate();
        await useTemplatesStore.getState().load();
        await useDataStore.getState().hydrateFromCache();
        await useAppStore.getState().refreshPermission();
      } finally {
        if (mounted) setReady(true);
        await SplashScreen.hideAsync().catch(() => undefined);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready || !hydrated) {
    return <SplashView />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="template-editor" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="campaign" />
      </Stack>
    </>
  );
}
