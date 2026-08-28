// P1-S1-T1: Server Component/Server Action에서 쓰는 세션 인지 Supabase 클라이언트.
// 쿠키에 저장된 유저 세션을 읽고(RLS 적용됨), anon key로 동작한다 — service-role과는
// 별개다 (그건 `service-role.ts` 참고).

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { clientEnv } from "@/lib/env";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component에서 호출되면 쓰기가 무시된다 — 세션 갱신은
          // middleware.ts가 담당하므로 여기서 실패해도 무해하다.
        }
      },
    },
  });
}
