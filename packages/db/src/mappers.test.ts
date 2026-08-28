import { describe, expect, it } from "vitest";

import { fromDailyPickRow, fromLyricsRow, fromPushSubscriptionRow } from "./mappers";
import type { Tables } from "./types/database";

describe("fromLyricsRow", () => {
  it("is_verified이 null이면 false로 기본값을 채운다", () => {
    const row: Tables<"lyrics"> = {
      id: "l1",
      song_id: "s1",
      original_text: null,
      korean_translation: null,
      translation_notes: null,
      ai_model_used: null,
      is_verified: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(fromLyricsRow(row).isVerified).toBe(false);
  });
});

describe("fromPushSubscriptionRow", () => {
  it("is_active가 null이면 true로 기본값을 채운다", () => {
    const row: Tables<"push_subscriptions"> = {
      id: "p1",
      user_id: "u1",
      expo_push_token: "token",
      notify_at: "08:00:00",
      is_active: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(fromPushSubscriptionRow(row).isActive).toBe(true);
  });
});

describe("fromDailyPickRow", () => {
  it("허용된 status 값은 그대로 통과시킨다", () => {
    const row: Tables<"daily_picks"> = {
      id: "d1",
      song_id: "s1",
      pick_date: "2026-01-01",
      editor_note: null,
      status: "published",
      published_at: "2026-01-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
    };
    expect(fromDailyPickRow(row).status).toBe("published");
  });

  it("허용되지 않은 status 값이면 던진다 (DB CHECK 제약이 깨졌다는 뜻)", () => {
    const row = {
      id: "d1",
      song_id: "s1",
      pick_date: "2026-01-01",
      editor_note: null,
      status: "archived",
      published_at: null,
      created_at: "2026-01-01T00:00:00Z",
    } as Tables<"daily_picks">;
    expect(() => fromDailyPickRow(row)).toThrow(/unexpected value "archived"/);
  });
});
