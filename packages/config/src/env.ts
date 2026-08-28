// P0-S5-T1: 환경변수 스키마 검증. 필수 값이 없으면 `loadEnv()` 호출 시점에 던진다
// ("부팅 실패") — 앱이 잘못된/누락된 설정으로 조용히 떠 있는 것보다 즉시 죽는 게 낫다.
//
// 이 스키마는 `.env.example`과 반드시 짝을 맞춘다: 여기 필드를 추가/삭제하면
// `.env.example`도 같이 고쳐라 (반대도 마찬가지).
//
// Supabase dev/prod 키를 하나의 로컬 `.env`에 같이 두는 이 프로젝트의 관례에 맞춰
// dev/prod 필드를 전부 필수로 검증한다. Phase 1 외부 API 키(Apple/Spotify/YouTube/
// Genius/Anthropic)는 아직 발급 전이라 optional — 발급되면 하나씩 필수로 옮긴다.

import { z } from "zod";

export const envSchema = z.object({
  SUPABASE_DEV_PROJECT_REF: z.string().min(1),
  SUPABASE_DEV_URL: z.string().url(),
  SUPABASE_DEV_ANON_KEY: z.string().min(1),
  SUPABASE_DEV_SERVICE_ROLE_KEY: z.string().min(1),
  /** P0-S2에서 의도적으로 .env에 평문 저장 안 함 — /tmp에만 존재. 그래서 optional. */
  SUPABASE_DEV_DB_PASSWORD: z.string().min(1).optional(),

  SUPABASE_PROD_PROJECT_REF: z.string().min(1),
  SUPABASE_PROD_URL: z.string().url(),
  SUPABASE_PROD_ANON_KEY: z.string().min(1),
  SUPABASE_PROD_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_PROD_DB_PASSWORD: z.string().min(1).optional(),

  APPLE_MUSIC_KEY_ID: z.string().min(1).optional(),
  APPLE_MUSIC_TEAM_ID: z.string().min(1).optional(),
  SPOTIFY_CLIENT_ID: z.string().min(1).optional(),
  SPOTIFY_CLIENT_SECRET: z.string().min(1).optional(),
  YOUTUBE_API_KEY: z.string().min(1).optional(),
  GENIUS_ACCESS_TOKEN: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * `process.env`(또는 임의의 소스)를 검증한다. 누락/형식 오류가 있으면 사람이 바로
 * 읽을 수 있는 메시지로 던진다 — 서버/스크립트 부팅 진입점에서 호출해라.
 */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `환경변수 검증 실패, 다음을 확인해라 (.env.example 참고):\n${issues}`,
    );
  }
  return result.data;
}
