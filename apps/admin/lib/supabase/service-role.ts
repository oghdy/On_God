// P1-S1-T4: service-role 클라이언트는 RLS를 완전히 우회한다 — ADR-0001에 따라 콘텐츠
// 쓰기는 오직 이 클라이언트로만, 오직 서버에서만 한다. `import "server-only"`가 있는
// `env.server.ts`를 거치기 때문에, 클라이언트 컴포넌트가 이 파일을 import하면 그 시점에
// 빌드가 실패한다 — "서버 전용"이 컨벤션이 아니라 빌드 타임에 강제되는 경계다.

import "server-only";
import { createServiceRoleClient, type OnGodClient } from "@ongod/db";

import { serverEnv } from "@/lib/env.server";

let cached: OnGodClient | null = null;

export function getServiceRoleClient(): OnGodClient {
  cached ??= createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
  return cached;
}
