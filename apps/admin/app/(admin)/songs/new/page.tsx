"use client";

import { useActionState } from "react";

import { createSong, type CreateSongState } from "./actions";

const initialState: CreateSongState = { error: null };

export default function NewSongPage() {
  const [state, formAction, pending] = useActionState(createSong, initialState);

  return (
    <div style={{ maxWidth: 480 }}>
      <h1>곡 등록</h1>
      <p style={{ color: "#666", fontSize: 14 }}>
        곡 제목과 아티스트만 입력하면 메타데이터·가사·해석을 자동으로 수집한다. 등록 후
        진행 상황 페이지로 이동한다.
      </p>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          곡 제목
          <input type="text" name="title" required placeholder="예: Go Down Moses" />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          아티스트
          <input type="text" name="artist" required placeholder="예: Traditional" />
        </label>
        {state.error ? (
          <p role="alert" style={{ color: "crimson" }}>
            {state.error}
          </p>
        ) : null}
        <button type="submit" disabled={pending}>
          {pending ? "등록 중..." : "등록 및 파이프라인 시작"}
        </button>
      </form>
    </div>
  );
}
