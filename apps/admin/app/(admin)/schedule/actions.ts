"use server";

import { revalidatePath } from "next/cache";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

export interface ScheduleActionState {
  error: string | null;
  success?: boolean;
}

// P1-S6-T1/T2: 곡 하나를 특정 날짜에 배정한다. pick_date는 UNIQUE라서(daily_picks 스키마)
// 같은 날짜에 두 번 배정하면 DB가 자체적으로 막아준다 — 여기선 그 에러(23505)를 사람이
// 읽을 수 있는 메시지로 바꿔주기만 한다.
export async function assignSchedule(
  _prev: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const songId = String(formData.get("song_id") ?? "");
  const pickDate = String(formData.get("pick_date") ?? "");
  const editorNote = String(formData.get("editor_note") ?? "").trim() || null;

  if (!songId || !pickDate) {
    return { error: "곡과 날짜를 모두 선택해라." };
  }

  const db = getServiceRoleClient();
  const { error } = await db.from("daily_picks").insert({
    song_id: songId,
    pick_date: pickDate,
    editor_note: editorNote,
    status: "scheduled",
  });

  if (error) {
    if (error.code === "23505") {
      return { error: `${pickDate}에는 이미 다른 곡이 배정돼 있다. 먼저 취소하거나 다른 날짜를 골라라.` };
    }
    return { error: error.message };
  }

  revalidatePath("/schedule");
  return { error: null, success: true };
}

export async function unassignSchedule(pickId: string): Promise<void> {
  const db = getServiceRoleClient();
  await db.from("daily_picks").delete().eq("id", pickId).eq("status", "scheduled");
  revalidatePath("/schedule");
}
