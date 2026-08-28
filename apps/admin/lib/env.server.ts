// P1-S1-T1/T4: 서버 전용 env. `import "server-only"`가 있어서 클라이언트 컴포넌트가
// 이 파일을 (직접이든 간접이든) import하면 빌드 자체가 실패한다 — service-role 키·관리자
// allowlist가 브라우저 번들에 들어가는 걸 컴파일 타임에 막는 장치.

import "server-only";
import { z } from "zod";

import { clientEnv } from "./env";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  /** 콤마로 구분한 운영자 이메일 목록. ADR-0001: DB role 대신 이 allowlist로 검증한다. */
  ADMIN_EMAILS: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
});

function loadServerEnv() {
  const result = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  });
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`admin 서버 환경변수 검증 실패 (.env.example 참고):\n${issues}`);
  }
  return { ...clientEnv, ...result.data };
}

export const serverEnv = loadServerEnv();
