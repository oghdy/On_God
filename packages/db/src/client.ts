import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types/database";

export type OnGodClient = SupabaseClient<Database>;

/**
 * anon key로 만드는 클라이언트. RLS가 적용되며, 유저 세션(auth)을 유지한다.
 * `apps/mobile`, `apps/admin`의 클라이언트 사이드에서 사용한다.
 */
export function createAnonClient(url: string, anonKey: string): OnGodClient {
  return createClient<Database>(url, anonKey);
}

/**
 * service_role key로 만드는 클라이언트. RLS를 우회한다 — 서버 전용(Edge Function,
 * 어드민 서버 API 라우트)에서만 쓰고 절대 클라이언트 번들에 포함하지 않는다.
 */
export function createServiceRoleClient(url: string, serviceRoleKey: string): OnGodClient {
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
