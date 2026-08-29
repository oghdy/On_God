"use client";

import { useActionState } from "react";

import { assignSchedule, type ScheduleActionState } from "./actions";

const initialState: ScheduleActionState = { error: null };

export function AssignForm({
  availableSongs,
  defaultDate,
}: {
  availableSongs: Array<{ id: string; title: string; artist: string }>;
  defaultDate?: string;
}) {
  const [state, formAction, pending] = useActionState(assignSchedule, initialState);

  return (
    <form action={formAction} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
        곡 (검수 완료된 것만 표시)
        <select name="song_id" required style={{ minWidth: 220 }}>
          <option value="">-- 선택 --</option>
          {availableSongs.map((song) => (
            <option key={song.id} value={song.id}>
              {song.title} — {song.artist}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
        발행일 (KST)
        <input type="date" name="pick_date" defaultValue={defaultDate} required />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
        메모 (선택)
        <input type="text" name="editor_note" style={{ minWidth: 160 }} />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "배정 중..." : "배정"}
      </button>
      {state.error ? <p style={{ color: "crimson", fontSize: 12, width: "100%" }}>{state.error}</p> : null}
      {state.success ? <p style={{ color: "green", fontSize: 12, width: "100%" }}>배정됨.</p> : null}
    </form>
  );
}
