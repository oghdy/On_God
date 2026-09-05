import type { DailyPick, Song, SongInfo } from "@ongod/core";
import { fromDailyPickRow, fromSongInfoRow, fromSongRow, type Tables } from "@ongod/db";

export interface PickWithSong {
  dailyPick: DailyPick;
  song: Song;
  songInfo: SongInfo | null;
}

type SongRowWithInfo = Tables<"songs"> & { song_info: Tables<"song_info"> | null };
type DailyPickRowWithSong = Tables<"daily_picks"> & { songs: SongRowWithInfo | null };

/**
 * `daily_picks` + `songs` + `song_info` 중첩 조인(`.select("*, songs(*, song_info(*))")`)
 * 결과 한 행을 도메인 타입으로 변환한다. `useTodayPick`/`useRecentPicks`가 공유한다.
 */
export function mapPickRow(row: DailyPickRowWithSong): PickWithSong {
  const { songs, ...pickRow } = row;
  if (!songs) {
    throw new Error("daily_picks 조회 결과에 songs 조인이 비어 있음 (FK 무결성 문제)");
  }
  const { song_info, ...songRow } = songs;

  return {
    dailyPick: fromDailyPickRow(pickRow),
    song: fromSongRow(songRow),
    songInfo: song_info ? fromSongInfoRow(song_info) : null,
  };
}
