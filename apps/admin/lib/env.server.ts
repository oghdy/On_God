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

  // --- P1-S2/S3: 콘텐츠 파이프라인 외부 API 키. 전부 optional — 아직 없는 키(Apple
  // Music/Spotify)의 provider는 파이프라인이 그냥 건너뛴다(부분 성공 처리, P1-S2-T6). ---
  YOUTUBE_API_KEY: z.string().min(1).optional(),
  GENIUS_ACCESS_TOKEN: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  APPLE_MUSIC_TEAM_ID: z.string().min(1).optional(),
  APPLE_MUSIC_KEY_ID: z.string().min(1).optional(),
  /** .p8 파일 내용 원문(PEM). .env.local엔 개행을 `\n` 리터럴로 이스케이프해서 한 줄로 저장한다. */
  APPLE_MUSIC_PRIVATE_KEY: z.string().min(1).optional(),
  SPOTIFY_CLIENT_ID: z.string().min(1).optional(),
  SPOTIFY_CLIENT_SECRET: z.string().min(1).optional(),
});

function loadServerEnv() {
  const result = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    GENIUS_ACCESS_TOKEN: process.env.GENIUS_ACCESS_TOKEN,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    APPLE_MUSIC_TEAM_ID: process.env.APPLE_MUSIC_TEAM_ID,
    APPLE_MUSIC_KEY_ID: process.env.APPLE_MUSIC_KEY_ID,
    APPLE_MUSIC_PRIVATE_KEY: process.env.APPLE_MUSIC_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
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
