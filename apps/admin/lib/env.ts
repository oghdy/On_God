// P1-S1-T1: 클라이언트 번들에 들어가도 안전한 env만 여기 둔다 (NEXT_PUBLIC_* — Next.js
// 규칙상 이 접두사가 붙은 것만 브라우저에 노출된다). service-role 키나 관리자 이메일
// allowlist처럼 서버 전용인 값은 `env.server.ts`에 따로 둔다 — 실수로 여기 섞이면
// 브라우저 번들에 그대로 들어간다.

import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

function loadClientEnv() {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`admin 클라이언트 환경변수 검증 실패 (.env.example 참고):\n${issues}`);
  }
  return result.data;
}

export const clientEnv = loadClientEnv();
