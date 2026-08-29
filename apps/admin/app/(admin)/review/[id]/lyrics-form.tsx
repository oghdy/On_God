"use client";

import { useActionState, useState, useTransition } from "react";

import { regenerateTranslation, updateLyrics, type FormActionState } from "./actions";

const initialState: FormActionState = { error: null };

export function LyricsForm({
  songId,
  songTitle,
  artist,
  originalText,
  koreanTranslation,
  translationNotes,
  isVerified,
}: {
  songId: string;
  songTitle: string;
  artist: string;
  originalText: string | null;
  koreanTranslation: string | null;
  translationNotes: string | null;
  isVerified: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateLyrics.bind(null, songId), initialState);
  const [currentOriginalText, setCurrentOriginalText] = useState(originalText ?? "");
  const [isRegenerating, startRegenerate] = useTransition();
  const [regenError, setRegenError] = useState<string | null>(null);

  function handleRegenerate() {
    setRegenError(null);
    startRegenerate(async () => {
      const result = await regenerateTranslation(songId, songTitle, artist, currentOriginalText);
      if (result.error) setRegenError(result.error);
    });
  }

  return (
    <section>
      <h2 style={{ fontSize: 16 }}>
        원문 가사 / 한국어 번역{" "}
        <span style={{ fontSize: 12, color: isVerified ? "green" : "#999" }}>
          {isVerified ? "(검수됨)" : "(미검수)"}
        </span>
      </h2>
      <form action={formAction}>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 13 }}>원문</label>
            <textarea
              name="original_text"
              rows={12}
              value={currentOriginalText}
              onChange={(e) => setCurrentOriginalText(e.target.value)}
              style={{ fontFamily: "inherit", fontSize: 13 }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 13 }}>한국어 번역</label>
            <textarea
              name="korean_translation"
              rows={12}
              defaultValue={koreanTranslation ?? ""}
              style={{ fontFamily: "inherit", fontSize: 13 }}
            />
            <label style={{ fontSize: 13, marginTop: 8 }}>해설 notes</label>
            <textarea
              name="translation_notes"
              rows={6}
              defaultValue={translationNotes ?? ""}
              style={{ fontFamily: "inherit", fontSize: 13 }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <button type="submit" disabled={pending}>
            {pending ? "저장 중..." : "가사/번역 저장"}
          </button>
          <button type="button" onClick={handleRegenerate} disabled={isRegenerating || !currentOriginalText.trim()}>
            {isRegenerating ? "재생성 중..." : "AI로 번역 재생성"}
          </button>
        </div>

        {state.error ? <p style={{ color: "crimson", fontSize: 12 }}>{state.error}</p> : null}
        {state.success ? <p style={{ color: "green", fontSize: 12 }}>저장됨.</p> : null}
        {regenError ? <p style={{ color: "crimson", fontSize: 12 }}>{regenError}</p> : null}
      </form>
    </section>
  );
}
