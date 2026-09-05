import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "../supabase/client";

interface AuthContextValue {
  session: Session | null;
  user: Session["user"] | null;
  /** 최초 세션 복원(`getSession`)이 끝나기 전까지 true. 이후엔 계속 false — 로그인/로그아웃
   * 자체는 즉시 반영되므로 매번 로딩 상태로 안 돌아간다. */
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ session: null, user: null, isLoading: true });

/**
 * P2-S6-T5: 세션 영속·자동 갱신은 이미 `lib/supabase/client.ts`(AsyncStorage 스토리지 +
 * autoRefreshToken)가 처리한다. 이 Provider는 그 세션 상태를 컴포넌트 트리에 구독시켜주는
 * 역할만 한다 — `supabase.auth.onAuthStateChange`가 로그인/로그아웃/토큰 갱신을 전부 실어다 줌.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
