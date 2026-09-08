import { describe, expect, it } from "vitest";

import {
  WIDGET_DEEP_LINK,
  resolveWidgetImageUrl,
  toWidgetPayload,
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
