// P1-S1-T2: 보호 라우트에서 실제로 인증·인가를 재검증한다. middleware.ts가 이미
// 리다이렉트를 처리하지만, "미들웨어 설정이 없거나 매처가 잘못됐을 때도 안전한가?"에
// 답하려면 Server Component/Action 쪽에서도 독립적으로 확인해야 한다 — Supabase 공식
// 가이드가 강조하는 이중 검증.

import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin(): Promise<User> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !serverEnv.ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    redirect("/login");
  }

  return user;
}
