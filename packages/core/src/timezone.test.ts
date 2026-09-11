// P3-S4-T2: 기기 타임존이 무엇이든 "KST 날짜"와 "KST 07:00 전환"이 같은 답을 내는지 고정한다.
//
// 이 테스트가 따로 필요한 이유 — 지금까지 이 로직은 **KST 기기(개발 Mac·시뮬레이터)와
// UTC(GitHub Actions)에서만** 돌아봤다. 둘 다 서머타임이 없고, 특히 KST 기기에서는
// "`+09:00`을 무시하고 로컬 시각으로 해석하는" 류의 버그가 우연히 같은 답을 내서 드러나지
// 않는다. 해외 사용자나 여행 중인 사용자의 폰을 흉내 내려고 프로세스 타임존을 바꿔가며
// 같은 기대값을 확인한다.
//
// 기대값은 전부 UTC 순간(ISO 문자열)이다 — 어느 타임존에서 돌려도 똑같아야 정상이다.

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { kstMidnightToUtc, toKstDateString } from "./date/kst";
import {
  buildWidgetTimeline,
  isAfterWidgetSwitch,
  widgetSwitchAt,
  widgetSwitchAtForDate,
} from "./domain/widget";

/** 타임존이 실제로 바뀌었는지 확인할 기준 순간. 아래 `offsetAtProbe`는 이 순간의 값이다. */
const PROBE = new Date("2026-09-09T12:00:00Z");

const ZONES: { zone: string; offsetAtProbe: number; why: string }[] = [
  { zone: "Asia/Seoul", offsetAtProbe: -540, why: "기준 — 개발 환경" },
  { zone: "UTC", offsetAtProbe: 0, why: "CI" },
  { zone: "America/Los_Angeles", offsetAtProbe: 420, why: "서머타임, KST와 16시간 차라 하루 대부분 날짜가 다르다" },
  { zone: "America/New_York", offsetAtProbe: 240, why: "서머타임" },
  { zone: "Europe/London", offsetAtProbe: -60, why: "서머타임" },
  { zone: "Asia/Kathmandu", offsetAtProbe: -345, why: "45분 단위 오프셋" },
  { zone: "Australia/Lord_Howe", offsetAtProbe: -630, why: "30분 단위 오프셋" },
  { zone: "Pacific/Kiritimati", offsetAtProbe: -840, why: "UTC+14 — KST보다 날짜가 앞선다" },
  { zone: "Pacific/Pago_Pago", offsetAtProbe: 660, why: "UTC-11 — KST와 20시간 차" },
];

const originalTz = process.env.TZ;

describe.each(ZONES)("기기 타임존 $zone ($why)", ({ zone, offsetAtProbe }) => {
  beforeAll(() => {
    process.env.TZ = zone;
  });

  afterAll(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it("타임존이 실제로 적용됐다 — 이게 실패하면 아래 결과는 아무것도 증명하지 못한다", () => {
    expect(PROBE.getTimezoneOffset()).toBe(offsetAtProbe);
  });

  it("KST 날짜 경계는 KST 자정이다", () => {
    expect(toKstDateString(new Date("2026-09-08T14:59:59Z"))).toBe("2026-09-08");
    expect(toKstDateString(new Date("2026-09-08T15:00:00Z"))).toBe("2026-09-09");
  });

  it("KST 날짜 문자열을 기기 로컬이 아니라 +09:00으로 해석한다", () => {
    expect(kstMidnightToUtc("2026-09-09").toISOString()).toBe("2026-09-08T15:00:00.000Z");
  });

  it("전환 시각은 항상 KST 07:00이다 — 해외 서머타임 전환일에도", () => {
    expect(widgetSwitchAtForDate("2026-09-09").toISOString()).toBe("2026-09-08T22:00:00.000Z");
    // 미국 서머타임 시작(3/8)·종료(11/1), 유럽 종료(10/25). KST는 서머타임이 없으므로
    // 이 날들도 똑같이 전날 22:00Z여야 한다.
    expect(widgetSwitchAtForDate("2026-03-08").toISOString()).toBe("2026-03-07T22:00:00.000Z");
    expect(widgetSwitchAtForDate("2026-10-25").toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(widgetSwitchAtForDate("2026-11-01").toISOString()).toBe("2026-10-31T22:00:00.000Z");
    expect(widgetSwitchAt(new Date("2026-09-08T16:00:00Z")).toISOString()).toBe("2026-09-08T22:00:00.000Z");
  });

  it("07:00 경계 판정이 흔들리지 않는다", () => {
    expect(isAfterWidgetSwitch(new Date("2026-09-08T21:59:59Z"))).toBe(false);
    expect(isAfterWidgetSwitch(new Date("2026-09-08T22:00:00Z"))).toBe(true);
  });

  it("타임라인 예약 시각도 같다", () => {
    const [kept, scheduled] = buildWidgetTimeline({
      now: new Date("2026-09-08T18:00:00Z"), // KST 9일 03:00
      next: "오늘 곡",
      pickDate: "2026-09-09",
      current: { date: new Date("2026-09-07T22:00:00Z"), props: "어제 곡" },
    });

    expect(kept?.props).toBe("어제 곡");
    expect(scheduled?.date.toISOString()).toBe("2026-09-08T22:00:00.000Z");
  });
});
