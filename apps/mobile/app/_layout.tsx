import "../lib/perf/timing";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAppFonts } from "../lib/fonts";
import { theme } from "../lib/theme";
import { asyncStoragePersister } from "../lib/query/persister";
import { queryClient } from "../lib/query/client";
import { AuthProvider } from "../lib/auth/AuthProvider";
import { Sentry, initSentry } from "../lib/sentry";

SplashScreen.preventAutoHideAsync();
initSentry();

function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister, maxAge: 24 * 60 * 60 * 1000 }}
      >
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.background },
            }}
          >
            <Stack.Screen name="profile" options={{ presentation: "modal" }} />
          </Stack>
          <StatusBar style="light" />
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
