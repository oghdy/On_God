"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** status가 "running"인 동안 3초마다 서버 컴포넌트를 재조회한다. */
export function AutoRefresh({ intervalMs = 3000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
