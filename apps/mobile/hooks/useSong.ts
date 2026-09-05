import { useQuery } from "@tanstack/react-query";
import type { Song } from "@ongod/core";
import { fromSongRow } from "@ongod/db";

import { queryKeys } from "../lib/query/keys";
import { supabase } from "../lib/supabase/client";

async function fetchSong(songId: string): Promise<Song | null> {
  const { data, error } = await supabase.from("songs").select("*").eq("id", songId).maybeSingle();

  if (error) throw error;
  return data ? fromSongRow(data) : null;
}

/** 가사 뷰어(P2-S4)의 sticky 헤더처럼 곡 메타데이터만 단독으로 필요할 때 쓴다. */
export function useSong(songId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.song.byId(songId ?? ""),
    queryFn: () => fetchSong(songId as string),
    enabled: Boolean(songId),
  });
}
