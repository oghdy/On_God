// P2-S1-T2: 클라이언트 번들(Expo)에 노출되는 env. `EXPO_PUBLIC_` 접두사가 붙은 값만
// 여기서 다룬다 — service_role 키 등 서버 전용 값은 모바일 앱에 절대 두지 않는다
// (apps/admin/lib/env.ts + env.server.ts 분리와 같은 이유).

import { z } from "zod";

const clientEnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

function loadClientEnv() {
  const result = clientEnvSchema.safeParse({
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`mobile 클라이언트 환경변수 검증 실패 (.env.example 참고):\n${issues}`);
  }
  return result.data;
}

export const clientEnv = loadClientEnv();
