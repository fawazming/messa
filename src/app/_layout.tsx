import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { AuthGate } from '@/components/AuthGate';
import { SplashView } from '@/components/SplashView';
import { palette } from '@/constants/theme';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCloudStore } from '@/store/cloudStore';
import { useDataStore } from '@/store/dataStore';
import { useTemplatesStore } from '@/store/templatesStore';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const hydrated = useAppStore((state) => state.hydrated);
  const authReady = useAuthStore((state) => state.ready);
  const token = useAuthStore((state) => state.token);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        await useAppStore.getState().hydrate();
        await useTemplatesStore.getState().load();
        await useDataStore.getState().hydrateFromCache();
        await useAppStore.getState().refreshPermission();
        await useAuthStore.getState().hydrate();
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

  useEffect(() => {
    if (token) {
      useCloudStore.getState().hydrate();
    } else {
      useCloudStore.getState().reset();
    }
  }, [token]);

  if (!ready || !hydrated || !authReady) {
    return <SplashView />;
  }

  if (!token) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthGate />
      </>
    );
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
        <Stack.Screen name="tables" />
        <Stack.Screen name="recipient-editor" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="template-editor" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="campaign" />
      </Stack>
    </>
  );
}
