"use client";

import { useTransition } from "react";

import { unassignSchedule } from "./actions";

export function UnassignButton({ pickId }: { pickId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => unassignSchedule(pickId))}
      style={{ fontSize: 12 }}
    >
      {pending ? "취소 중..." : "배정 취소"}
    </button>
  );
}
