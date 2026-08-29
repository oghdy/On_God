"use server";

import { revalidatePath } from "next/cache";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

export interface DeleteSongState {
  error: string | null;
}

// P1-S7-T5: 곡 삭제. daily_picks.song_id는 `on delete restrict`라(발행 이력이 있는 곡을
// 실수로 지워서 앱에 노출된 카드가 깨지는 걸 막기 위한 스키마 차원의 안전장치, P0-S2-T3),
// 그 FK 위반(23503)만 사람이 읽을 수 있는 메시지로 바꿔준다 — 나머지(lyrics/song_info 등)는
// `on delete cascade`라 같이 지워진다.
export async function deleteSong(songId: string): Promise<DeleteSongState> {
  const db = getServiceRoleClient();
  const { error } = await db.from("songs").delete().eq("id", songId);

  if (error) {
    if (error.code === "23503") {
      return { error: "이 곡은 발행 일정 이력이 있어서 삭제할 수 없다. 먼저 예약/발행 기록을 정리해라." };
    }
    return { error: error.message };
  }

  revalidatePath("/songs");
  revalidatePath("/review");
  revalidatePath("/schedule");
  return { error: null };
}
