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
import { syncWidget } from "../lib/widget/syncWidget";

// 딥링크로 /lyrics/... 등에 바로 진입해도 뒤로가기 스택이 index부터 쌓이도록 한다.
export const unstable_settings = { initialRouteName: "index" };

SplashScreen.preventAutoHideAsync();
initSentry();

function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // P3-S1-T2: 앱이 뜰 때 오늘 곡을 위젯에 넘긴다. 자정 갱신은 백그라운드 fetch로
  // 별도 처리한다(P3-S4-T1) — 여기는 "앱을 열면 위젯도 최신이 된다"를 보장하는 경로다.
  useEffect(() => {
    void syncWidget();
  }, []);

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
            {/* expo-router 57부터 <Stack>에 자식을 선언하면 그것이 라우트 목록이 된다.
                profile 하나만 선언했더니 Android에서 그게 첫 화면이 되어 index가 아예
                렌더되지 않았다(P0-S7-T5). 전부 명시하고 index를 맨 앞에 둔다. */}
            <Stack.Screen name="index" />
            <Stack.Screen name="lyrics/[songId]" />
            <Stack.Screen name="profile" options={{ presentation: "modal" }} />
          </Stack>
          <StatusBar style="light" />
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
