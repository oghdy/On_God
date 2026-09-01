import { QueryClient } from "@tanstack/react-query";

// P2-S1-T3: 오늘의 곡은 자정(KST) 전까지는 바뀌지 않으므로 staleTime을 길게 잡는다.
// gcTime은 P2-S1-T6의 AsyncStorage 영속 캐시가 살려둘 최대 기간과 맞춘다 — 이보다 길게
// 오프라인 상태가 이어지면 마지막 캐시도 정리 대상이 된다.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
    },
  },
});
