import { useQuery } from "@tanstack/react-query";
import type { Lyrics } from "@ongod/core";
import { fromLyricsRow } from "@ongod/db";

import { supabase } from "../lib/supabase/client";
import { queryKeys } from "../lib/query/keys";

async function fetchSongLyrics(songId: string): Promise<Lyrics | null> {
  const { data, error } = await supabase.from("lyrics").select("*").eq("song_id", songId).maybeSingle();

  if (error) throw error;
  return data ? fromLyricsRow(data) : null;
}

/** `songId`가 없으면(아직 오늘의 곡을 못 불러온 상태 등) 쿼리를 아예 실행하지 않는다. */
export function useSongLyrics(songId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.lyrics.bySong(songId ?? ""),
    queryFn: () => fetchSongLyrics(songId as string),
    enabled: Boolean(songId),
  });
}
