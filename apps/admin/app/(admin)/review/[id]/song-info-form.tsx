"use client";

import { useActionState, useState, useTransition } from "react";

import { regenerateSongInfo, updateSongInfo, type FormActionState } from "./actions";

const initialState: FormActionState = { error: null };

export function SongInfoForm({
  songId,
  songTitle,
  artist,
  originalText,
  descriptionKo,
  historicalContextKo,
  scriptureReference,
  isVerified,
}: {
  songId: string;
  songTitle: string;
  artist: string;
  /** AI 재생성 시 원문 가사가 필요하다 — 없으면 재생성 버튼을 비활성화한다. */
  originalText: string | null;
  descriptionKo: string | null;
  historicalContextKo: string | null;
  scriptureReference: string | null;
  isVerified: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateSongInfo.bind(null, songId), initialState);
  const [isRegenerating, startRegenerate] = useTransition();
  const [regenError, setRegenError] = useState<string | null>(null);

  function handleRegenerate() {
    setRegenError(null);
    startRegenerate(async () => {
      const result = await regenerateSongInfo(songId, songTitle, artist, originalText ?? "");
      if (result.error) setRegenError(result.error);
    });
  }

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 16 }}>
        곡 소개 / 역사적 맥락 / 성경구절{" "}
        <span style={{ fontSize: 12, color: isVerified ? "green" : "#999" }}>
          {isVerified ? "(검수됨)" : "(미검수)"}
        </span>
      </h2>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontSize: 13 }}>
          곡 소개
          <textarea
            name="description_ko"
            rows={4}
            defaultValue={descriptionKo ?? ""}
            style={{ display: "block", width: "100%", fontFamily: "inherit", fontSize: 13 }}
          />
        </label>
        <label style={{ fontSize: 13 }}>
          역사적 맥락
          <textarea
            name="historical_context_ko"
            rows={6}
            defaultValue={historicalContextKo ?? ""}
            style={{ display: "block", width: "100%", fontFamily: "inherit", fontSize: 13 }}
          />
        </label>
        <label style={{ fontSize: 13 }}>
          성경구절 연계 (예: 출애굽기 8:1, 없으면 비워둠)
          <input
            type="text"
            name="scripture_reference"
            defaultValue={scriptureReference ?? ""}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="submit" disabled={pending}>
            {pending ? "저장 중..." : "곡 소개 저장"}
          </button>
          <button type="button" onClick={handleRegenerate} disabled={isRegenerating || !originalText?.trim()}>
            {isRegenerating ? "재생성 중..." : "AI로 소개 재생성"}
          </button>
        </div>

        {state.error ? <p style={{ color: "crimson", fontSize: 12 }}>{state.error}</p> : null}
        {state.success ? <p style={{ color: "green", fontSize: 12 }}>저장됨.</p> : null}
        {regenError ? <p style={{ color: "crimson", fontSize: 12 }}>{regenError}</p> : null}
      </form>
    </section>
  );
}
