import { useQuery } from "@tanstack/react-query";
import { toKstDateString } from "@ongod/core";
import type { DailyPick, Song } from "@ongod/core";
import { fromDailyPickRow, fromSongRow } from "@ongod/db";

import { supabase } from "../lib/supabase/client";
import { queryKeys } from "../lib/query/keys";

export interface TodayPick {
  dailyPick: DailyPick;
  song: Song;
}

async function fetchTodayPick(): Promise<TodayPick | null> {
  const today = toKstDateString();

  const { data, error } = await supabase
    .from("daily_picks")
    .select("*, songs(*)")
    .eq("pick_date", today)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { songs, ...pickRow } = data;
  if (!songs) {
    throw new Error("daily_picks 조회 결과에 songs 조인이 비어 있음 (FK 무결성 문제)");
  }

  return {
    dailyPick: fromDailyPickRow(pickRow),
    song: fromSongRow(songs),
  };
}

/** 오늘(KST) 발행된 곡. 없으면 `data`가 `null` — "오늘의 곡 없음"은 에러가 아니다. */
export function useTodayPick() {
  return useQuery({
    queryKey: queryKeys.dailyPick.today(),
    queryFn: fetchTodayPick,
  });
}
