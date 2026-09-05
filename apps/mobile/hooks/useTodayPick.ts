import { useQuery } from "@tanstack/react-query";
import { toKstDateString } from "@ongod/core";

import { queryKeys } from "../lib/query/keys";
import { mapPickRow, type PickWithSong } from "../lib/supabase/mapPick";
import { supabase } from "../lib/supabase/client";

export type TodayPick = PickWithSong;

async function fetchTodayPick(): Promise<TodayPick | null> {
  const today = toKstDateString();

  const { data, error } = await supabase
    .from("daily_picks")
    .select("*, songs(*, song_info(*))")
    .eq("pick_date", today)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapPickRow(data);
}

/**
 * 오늘(KST) 발행된 곡 하나만 필요할 때 쓴다(예: Phase 3 위젯). 없으면 `data`가
 * `null` — "오늘의 곡 없음"은 에러가 아니다. Daily Card 화면(P2-S3)은 스와이프
 * 브라우징이 필요해 이 훅 대신 `useRecentPicks`를 쓴다.
 */
export function useTodayPick() {
  return useQuery({
    queryKey: queryKeys.dailyPick.today(),
    queryFn: fetchTodayPick,
  });
}
