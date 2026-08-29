"use client";

import { useState, useTransition } from "react";

import { deleteSong } from "./actions";

// 네이티브 `window.confirm()` 대신 인라인 2단계 확인을 쓴다 — 헤드리스 브라우저/E2E
// 테스트 환경 상당수가 네이티브 dialog를 지원 안 하거나 자동으로 거부해버리고(실제로
// 이 프로젝트의 브라우저 자동화 도구에서도 confirm()이 항상 false로 막히는 걸 확인함),
// 커스텀 UI는 그런 환경 차이 없이 항상 테스트 가능하다.
export function DeleteButton({ songId, songLabel }: { songId: string; songLabel: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteSong(songId);
      if (result.error) {
        setError(result.error);
      } else {
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <span style={{ fontSize: 12 }}>
        &ldquo;{songLabel}&rdquo; 삭제할까?{" "}
        <button type="button" onClick={handleConfirm} disabled={pending} style={{ color: "crimson" }}>
          {pending ? "삭제 중..." : "예"}
        </button>{" "}
        <button type="button" onClick={() => setConfirming(false)} disabled={pending}>
          아니오
        </button>
        {error ? <div style={{ color: "crimson", fontSize: 11 }}>{error}</div> : null}
      </span>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} style={{ fontSize: 12, color: "crimson" }}>
      삭제
    </button>
  );
}
