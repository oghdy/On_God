import { describe, expect, it } from "vitest";

import {
  WIDGET_DEEP_LINK,
  buildWidgetTimeline,
  isAfterWidgetSwitch,
  resolveWidgetImageUrl,
  toWidgetPayload,
  widgetSwitchAt,
  widgetSwitchAtForDate,
  type WidgetTodayPickRow,
} from "./widget";

const row: WidgetTodayPickRow = {
  pick_date: "2026-09-08",
  published_at: "2026-09-08T07:47:27.720406+00:00",
  song_id: "15c6a224-d8b5-4b5b-911e-678cadd85cbc",
  title: "Oh Happy Day",
  artist: "Edwin Hawkins Singers",
  widget_image_url: "https://example.supabase.co/album-covers/x/widget.webp",
  album_cover_url: "https://example.supabase.co/album-covers/x/cover.webp",
};

describe("resolveWidgetImageUrl — 폴백 3단계", () => {
  it("위젯 전용 이미지가 있으면 그걸 쓴다", () => {
    expect(resolveWidgetImageUrl(row)).toBe(row.widget_image_url);
  });

  it("위젯 전용이 없으면 원본 커버로 내려간다", () => {
    expect(resolveWidgetImageUrl({ ...row, widget_image_url: null })).toBe(row.album_cover_url);
  });

  it("둘 다 없으면 null — 위젯이 내장 플레이스홀더를 그려야 한다", () => {
    // dev의 "Go Down Moses"가 실제로 이 상태다(백엔드가 폴백 검증용으로 남겨둠).
    expect(resolveWidgetImageUrl({ widget_image_url: null, album_cover_url: null })).toBeNull();
  });

  it("빈 문자열은 없는 것으로 친다 — 깨진 이미지를 그리면 안 된다", () => {
    expect(resolveWidgetImageUrl({ widget_image_url: "", album_cover_url: "  " })).toBeNull();
    expect(resolveWidgetImageUrl({ widget_image_url: "   ", album_cover_url: row.album_cover_url })).toBe(
      row.album_cover_url,
    );
  });
});

describe("toWidgetPayload", () => {
  it("뷰 행을 위젯 페이로드로 변환한다", () => {
    expect(toWidgetPayload(row)).toEqual({
      pickDate: "2026-09-08",
      songId: "15c6a224-d8b5-4b5b-911e-678cadd85cbc",
      title: "Oh Happy Day",
      artist: "Edwin Hawkins Singers",
      imageUrl: row.widget_image_url,
      deepLink: WIDGET_DEEP_LINK,
    });
  });

  it("행이 없으면 null — 오늘 픽 없음은 에러가 아니다", () => {
    // dev의 9/21이 실제로 이 케이스다(백엔드가 검증용으로 하루 비워둠).
    expect(toWidgetPayload(null)).toBeNull();
    expect(toWidgetPayload(undefined)).toBeNull();
  });

  it("커버가 아예 없는 곡도 페이로드는 만들어진다(imageUrl만 null)", () => {
    const payload = toWidgetPayload({ ...row, widget_image_url: null, album_cover_url: null });
    expect(payload).not.toBeNull();
    expect(payload?.imageUrl).toBeNull();
    expect(payload?.title).toBe("Oh Happy Day");
  });
});

describe("widgetSwitchAt / isAfterWidgetSwitch — KST 07:00 전환", () => {
  it("그날 KST 07:00을 가리킨다", () => {
    expect(widgetSwitchAt(new Date("2026-09-09T03:00:00+09:00")).toISOString()).toBe(
      new Date("2026-09-09T07:00:00+09:00").toISOString(),
    );
  });

  it("07:00 직전은 아직 전환 전 — 어제 곡이 떠 있는 게 정상이다", () => {
    expect(isAfterWidgetSwitch(new Date("2026-09-09T06:59:59+09:00"))).toBe(false);
  });

  it("07:00 정각부터 전환된 것으로 본다", () => {
    expect(isAfterWidgetSwitch(new Date("2026-09-09T07:00:00+09:00"))).toBe(true);
  });

  it("KST 자정 직후는 전환 전이다 — 곡은 발행됐지만 위젯은 아직 어제 것", () => {
    expect(isAfterWidgetSwitch(new Date("2026-09-09T00:00:01+09:00"))).toBe(false);
  });

  it("늦은 밤은 전환 후다", () => {
    expect(isAfterWidgetSwitch(new Date("2026-09-09T23:30:00+09:00"))).toBe(true);
  });

  it("UTC 날짜가 KST 날짜와 다른 순간에도 KST 기준으로 계산한다", () => {
    // 2026-09-08T22:00Z = 2026-09-09T07:00+09:00 — UTC로는 8일이지만 KST로는 9일 07:00.
    const moment = new Date("2026-09-08T22:00:00Z");
    expect(widgetSwitchAt(moment).toISOString()).toBe(moment.toISOString());
    expect(isAfterWidgetSwitch(moment)).toBe(true);
  });

  it("UTC 기준 전날 오후는 KST로 다음날 새벽 — 아직 전환 전이다", () => {
    // 2026-09-08T16:00Z = 2026-09-09T01:00+09:00
    expect(isAfterWidgetSwitch(new Date("2026-09-08T16:00:00Z"))).toBe(false);
  });
});

describe("buildWidgetTimeline — 언제 바꿔 그릴지", () => {
  const today = { t: "오늘 곡" };
  const yesterday = { t: "어제 곡" };

  it("07:00을 지났으면 오늘 곡을 지금 그린다", () => {
    const now = new Date("2026-09-09T09:00:00+09:00");
    expect(buildWidgetTimeline({ now, next: today, current: { date: new Date("2026-09-08T07:00:00+09:00"), props: yesterday } })).toEqual([
      { date: now, props: today },
    ]);
  });

  it("07:00 전이면 어제 곡을 유지하고 07:00에 전환을 예약한다", () => {
    const now = new Date("2026-09-09T03:00:00+09:00");
    const current = { date: new Date("2026-09-08T07:00:00+09:00"), props: yesterday };

    const [kept, scheduled] = buildWidgetTimeline({ now, next: today, current });

    // 지금 떠 있는 것을 그대로 유지 — 이게 빠지면 07:00까지 위젯이 빈다.
    expect(kept).toEqual(current);
    expect(scheduled?.props).toBe(today);
    expect(scheduled?.date.toISOString()).toBe(new Date("2026-09-09T07:00:00+09:00").toISOString());
  });

  it("07:00 전이라도 지금 떠 있는 게 없으면(첫 설치) 오늘 곡을 바로 그린다", () => {
    const now = new Date("2026-09-09T03:00:00+09:00");
    expect(buildWidgetTimeline({ now, next: today })).toEqual([{ date: now, props: today }]);
  });

  it("07:00 정각은 '지난 것'으로 본다 — 즉시 전환", () => {
    const now = new Date("2026-09-09T07:00:00+09:00");
    const current = { date: new Date("2026-09-08T07:00:00+09:00"), props: yesterday };
    expect(buildWidgetTimeline({ now, next: today, current })).toEqual([{ date: now, props: today }]);
  });

  it("오늘 픽이 없는 날도 같은 규칙이 적용된다 — 07:00에 빈 상태로 바뀐다", () => {
    const now = new Date("2026-09-21T02:00:00+09:00");
    const empty = { t: "준비 중" };
    const current = { date: new Date("2026-09-20T07:00:00+09:00"), props: yesterday };

    const [kept, scheduled] = buildWidgetTimeline({ now, next: empty, current });

    expect(kept?.props).toBe(yesterday);
    expect(scheduled?.props).toBe(empty);
    expect(scheduled?.date.toISOString()).toBe(new Date("2026-09-21T07:00:00+09:00").toISOString());
  });
});

describe("buildWidgetTimeline — pickDate 기준 전환 (P3-S4-T2: 기기 시계와 서버 시계가 어긋날 때)", () => {
  const today = { t: "9일 곡" };
  const yesterday = { t: "8일 곡" };
  const current = { date: new Date("2026-09-08T07:00:00+09:00"), props: yesterday };

  it("widgetSwitchAtForDate는 그 날짜의 07:00 KST다 — 연말 경계 포함", () => {
    expect(widgetSwitchAtForDate("2026-09-09").toISOString()).toBe(
      new Date("2026-09-09T07:00:00+09:00").toISOString(),
    );
    expect(widgetSwitchAtForDate("2027-01-01").toISOString()).toBe("2026-12-31T22:00:00.000Z");
  });

  it("기기 시계가 늦어 아직 전날 밤이라고 믿어도, 서버가 준 9일 곡은 9일 07:00에 바뀐다", () => {
    // 실제로는 KST 9일 00:02라 서버가 9일 곡을 줬는데, 기기 시계는 5분 늦어 8일 23:57이다.
    const deviceNow = new Date("2026-09-08T23:57:00+09:00");

    const [kept, scheduled] = buildWidgetTimeline({ now: deviceNow, next: today, pickDate: "2026-09-09", current });

    expect(kept).toEqual(current);
    expect(scheduled?.props).toBe(today);
    expect(scheduled?.date.toISOString()).toBe(new Date("2026-09-09T07:00:00+09:00").toISOString());
  });

  it("같은 상황에서 pickDate 없이 기기 시계만 보면 자정에 바로 바뀌어버린다 — 이걸 막으려는 것", () => {
    const deviceNow = new Date("2026-09-08T23:57:00+09:00");
    expect(buildWidgetTimeline({ now: deviceNow, next: today, current })).toEqual([
      { date: deviceNow, props: today },
    ]);
  });

  it("기기 시계가 빨라 다음날 새벽이라고 믿어도, 받은 곡의 07:00이 지났으면 바로 그린다", () => {
    // 실제로는 KST 9일 23:00이라 서버가 9일 곡을 줬는데, 기기 시계는 2시간 빨라 10일 01:00이다.
    const deviceNow = new Date("2026-09-10T01:00:00+09:00");
    const shown = { date: new Date("2026-09-09T07:00:00+09:00"), props: today };

    expect(buildWidgetTimeline({ now: deviceNow, next: today, pickDate: "2026-09-09", current: shown })).toEqual([
      { date: deviceNow, props: today },
    ]);
  });

  it("pickDate 기준으로도 07:00 정각은 '지난 것'이다", () => {
    const now = new Date("2026-09-09T07:00:00+09:00");
    expect(buildWidgetTimeline({ now, next: today, pickDate: "2026-09-09", current })).toEqual([
      { date: now, props: today },
    ]);
  });

  it("pickDate가 있어도 첫 설치(떠 있는 게 없음)면 바로 그린다", () => {
    const now = new Date("2026-09-09T03:00:00+09:00");
    expect(buildWidgetTimeline({ now, next: today, pickDate: "2026-09-09" })).toEqual([{ date: now, props: today }]);
  });
});
