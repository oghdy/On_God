import { useQuery } from "@tanstack/react-query";
import { toKstDateString } from "@ongod/core";

import { queryKeys } from "../lib/query/keys";
import { mapPickRow, type PickWithSong } from "../lib/supabase/mapPick";
import { supabase } from "../lib/supabase/client";

const DEFAULT_LIMIT = 14;

async function fetchRecentPicks(limit: number): Promise<PickWithSong[]> {
  const today = toKstDateString();

  const { data, error } = await supabase
    .from("daily_picks")
    .select("*, songs(*, song_info(*))")
    .lte("pick_date", today)
    .eq("status", "published")
    .order("pick_date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapPickRow);
}

/**
 * 오늘(KST) 이하 날짜의 발행된 곡을 최신순으로 최대 `limit`개 가져온다.
 * 카드 스와이프(P2-S3-T4, MVP: 최근 곡까지)용 — index 0이 가장 최근(보통 오늘) 픽이다.
 */
export function useRecentPicks(limit = DEFAULT_LIMIT) {
  return useQuery({
    queryKey: queryKeys.dailyPick.recent(limit),
    queryFn: () => fetchRecentPicks(limit),
  });
}
