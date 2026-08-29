"use client";

import { useActionState } from "react";

import { updateStreamingLinks, type FormActionState } from "./actions";

const initialState: FormActionState = { error: null };

export function StreamingLinksForm({
  songId,
  appleMusicUrl,
  spotifyUrl,
  youtubeUrl,
}: {
  songId: string;
  appleMusicUrl: string | null;
  spotifyUrl: string | null;
  youtubeUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateStreamingLinks.bind(null, songId), initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
        Apple Music URL
        <input type="url" name="apple_music_url" defaultValue={appleMusicUrl ?? ""} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
        Spotify URL
        <input type="url" name="spotify_url" defaultValue={spotifyUrl ?? ""} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
        YouTube URL (자동 매칭이 종종 틀림 — 여기서 직접 교정)
        <input type="url" name="youtube_url" defaultValue={youtubeUrl ?? ""} />
      </label>
      {state.error ? <p style={{ color: "crimson", fontSize: 12 }}>{state.error}</p> : null}
      {state.success ? <p style={{ color: "green", fontSize: 12 }}>저장됨.</p> : null}
      <button type="submit" disabled={pending} style={{ alignSelf: "flex-start" }}>
        {pending ? "저장 중..." : "링크 저장"}
      </button>
    </form>
  );
}
