import { describe, expect, it } from "vitest";

import { loadEnv } from "./env";

const validEnv = {
  SUPABASE_DEV_PROJECT_REF: "abcdefgh",
  SUPABASE_DEV_URL: "https://abcdefgh.supabase.co",
  SUPABASE_DEV_ANON_KEY: "dev-anon-key",
  SUPABASE_DEV_SERVICE_ROLE_KEY: "dev-service-role-key",

  SUPABASE_PROD_PROJECT_REF: "ijklmnop",
  SUPABASE_PROD_URL: "https://ijklmnop.supabase.co",
  SUPABASE_PROD_ANON_KEY: "prod-anon-key",
  SUPABASE_PROD_SERVICE_ROLE_KEY: "prod-service-role-key",
};

describe("loadEnv", () => {
  it("필수 값이 다 있으면 파싱된 env를 반환한다", () => {
    const env = loadEnv(validEnv);
    expect(env.SUPABASE_DEV_PROJECT_REF).toBe("abcdefgh");
    expect(env.SUPABASE_PROD_URL).toBe("https://ijklmnop.supabase.co");
  });

  it("Phase 1 외부 API 키는 없어도 통과한다 (아직 발급 전)", () => {
    expect(() => loadEnv(validEnv)).not.toThrow();
  });

  it("필수 값이 누락되면 어떤 키가 문제인지 알려주며 던진다", () => {
    const { SUPABASE_DEV_ANON_KEY: _omit, ...incomplete } = validEnv;
    expect(() => loadEnv(incomplete)).toThrow(/SUPABASE_DEV_ANON_KEY/);
  });

  it("URL 형식이 아니면 던진다", () => {
    expect(() => loadEnv({ ...validEnv, SUPABASE_DEV_URL: "not-a-url" })).toThrow(
      /SUPABASE_DEV_URL/,
    );
  });
});
