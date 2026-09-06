// P2-S7-T3: 크래시/에러 리포팅. DSN이 아직 없으면(사람이 Sentry 계정·프로젝트를 만들기
// 전) 조용히 건너뛴다 — 앱이 이것 때문에 죽거나 개발 중 에러를 내면 안 된다.
import * as Sentry from "@sentry/react-native";

import { clientEnv } from "./env";

export function initSentry(): void {
  if (!clientEnv.EXPO_PUBLIC_SENTRY_DSN) {
    console.log("[sentry] EXPO_PUBLIC_SENTRY_DSN이 없어서 초기화를 건너뜀");
    return;
  }

  Sentry.init({
    dsn: clientEnv.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    enableAutoSessionTracking: true,
    debug: __DEV__,
  });
}

export { Sentry };
