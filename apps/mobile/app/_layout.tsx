import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient } from "../lib/query/client";
import { asyncStoragePersister } from "../lib/query/persister";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister, maxAge: 24 * 60 * 60 * 1000 }}
      >
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
