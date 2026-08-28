// P1-S1-T1: 모든 요청마다 세션을 갱신하고, 로그인 여부·운영자 allowlist를 검사해
// 리다이렉트한다. Supabase 공식 가이드가 권장하는 패턴 — 세션 갱신은 미들웨어가
// 책임지고, Server Component/Action에서는 `requireAdmin()`으로 한 번 더 확인한다
// (미들웨어 설정 실수에 대한 방어적 이중 검증, 설계 원칙 5).

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientEnv } from "@/lib/env";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = !!user?.email && getAdminEmails().includes(user.email.toLowerCase());
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!isAdmin && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAdmin && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
