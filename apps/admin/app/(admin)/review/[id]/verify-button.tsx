"use client";

import { useTransition } from "react";

import { markVerified } from "./actions";

export function VerifyButton({ songId, alreadyVerified }: { songId: string; alreadyVerified: boolean }) {
  const [pending, startTransition] = useTransition();

  if (alreadyVerified) {
    return <p style={{ color: "green", fontWeight: 600 }}>✓ 검수 완료됨</p>;
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => markVerified(songId))}
      style={{ fontWeight: 600 }}
    >
      {pending ? "처리 중..." : "검수 완료로 표시"}
    </button>
  );
}
