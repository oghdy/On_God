import { createClient, type SupabaseClient, type SupportedStorage } from "@supabase/supabase-js";

import type { Database } from "./types/database";

export type OnGodClient = SupabaseClient<Database>;

export interface AnonClientOptions {
  /**
   * 세션 저장소 어댑터. 웹(admin)은 기본값(localStorage)으로 충분하지만, RN에는
   * localStorage가 없으므로 `apps/mobile`은 AsyncStorage 등을 여기로 주입한다.
   */
  storage?: SupportedStorage;
}

/**
 * anon key로 만드는 클라이언트. RLS가 적용되며, 유저 세션(auth)을 유지한다.
 * `apps/mobile`, `apps/admin`의 클라이언트 사이드에서 사용한다.
 */
export function createAnonClient(url: string, anonKey: string, options?: AnonClientOptions): OnGodClient {
  return createClient<Database>(url, anonKey, options?.storage ? { auth: { storage: options.storage } } : undefined);
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
