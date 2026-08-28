import { describe, expect, it } from "vitest";

import { isSameKstDay, kstMidnightToUtc, toKstDateString } from "./kst";

describe("toKstDateString", () => {
  it("UTC 오후 3시(KST 자정 직후)를 다음날 KST 날짜로 취급한다", () => {
    // 2026-01-14T15:00:00Z == 2026-01-15T00:00:00+09:00
    expect(toKstDateString(new Date("2026-01-14T15:00:00Z"))).toBe("2026-01-15");
  });

  it("UTC 오후 2시 59분(KST 자정 직전)은 이전 날짜로 취급한다", () => {
    expect(toKstDateString(new Date("2026-01-14T14:59:00Z"))).toBe("2026-01-14");
  });

  it("연말 경계를 넘어간다", () => {
    expect(toKstDateString(new Date("2025-12-31T15:30:00Z"))).toBe("2026-01-01");
  });
});

describe("kstMidnightToUtc", () => {
  it("KST 날짜의 자정을 올바른 UTC 순간으로 변환한다", () => {
    expect(kstMidnightToUtc("2026-01-15").toISOString()).toBe("2026-01-14T15:00:00.000Z");
  });

  it("toKstDateString의 역함수로 동작한다", () => {
    const dateStr = "2026-06-01";
    expect(toKstDateString(kstMidnightToUtc(dateStr))).toBe(dateStr);
  });
});

describe("isSameKstDay", () => {
  it("KST 자정을 사이에 둔 두 UTC 순간은 다른 날로 판정한다", () => {
    const beforeMidnight = new Date("2026-01-14T14:59:00Z");
    const afterMidnight = new Date("2026-01-14T15:00:00Z");
    expect(isSameKstDay(beforeMidnight, afterMidnight)).toBe(false);
  });

  it("같은 KST 날짜 안의 두 순간은 같은 날로 판정한다", () => {
    const morning = new Date("2026-01-14T15:00:00Z");
    const night = new Date("2026-01-15T14:00:00Z");
    expect(isSameKstDay(morning, night)).toBe(true);
  });
});
