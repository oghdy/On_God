// P3-S1-T2: 위젯이 그릴 데이터의 계약. 앱(RN)·iOS 위젯·Android 위젯 세 곳이 같은 모양을
// 봐야 하므로 mobile이 아니라 공유 패키지에 둔다(설계 대원칙 3 "타입을 공유한다").
//
// 읽기 원본은 Supabase의 `widget_today_pick` 뷰다(백엔드 P3-S1-T1). 이 뷰가 두 가지를
// 서버에서 강제한다 — `status = 'published'`인 픽만, 그리고 "오늘"의 기준은 KST 자정.
// **클라이언트에서 오늘 날짜를 계산하지 말 것.** 앱·iOS·Android가 각자 로컬 타임존으로
// 계산하면 해외 사용자에게 하루 어긋나고, 세 구현이 서로 달라지는 순간 원인 추적이 거의
// 불가능해진다. 이 파일에 날짜 계산이 없는 것은 의도된 것이다.

/** `widget_today_pick` 뷰가 돌려주는 행. 0행 또는 1행이며, 0행은 정상 시나리오다. */
export interface WidgetTodayPickRow {
  pick_date: string;
  published_at: string;
  song_id: string;
  title: string;
  artist: string;
  /** 위젯용 512×512 WebP. null 가능. */
  widget_image_url: string | null;
  /** 원본 600×600 WebP. `widget_image_url`이 없을 때 대체. 역시 null 가능. */
  album_cover_url: string | null;
}

/** 위젯 표면에 실제로 전달되는 값. 여기까지 오면 날짜 판단·폴백이 이미 끝나 있다. */
export interface WidgetPayload {
  pickDate: string;
  songId: string;
  title: string;
  artist: string;
  /**
   * 그릴 이미지. **null이면 위젯이 자기 내장 플레이스홀더를 그려야 한다** —
   * 원격 URL이 없다는 뜻이지 오류가 아니다.
   */
  imageUrl: string | null;
  /** 위젯 탭 시 열 딥링크. 목적지가 항상 오늘 카드라 상수다. */
  deepLink: string;
}

/** 위젯 탭 → 앱의 오늘 카드(index 라우트). */
export const WIDGET_DEEP_LINK = "ongod://";

/**
 * 이미지 폴백 3단계: 위젯 전용(512) → 원본 커버(600) → 없음(null).
 *
 * 3단계까지 실제로 내려간다 — dev의 "Go Down Moses"가 Storage 버킷이 생기기 전에 등록돼
 * 커버가 아예 없는 상태로 남아 있다(백엔드가 폴백 검증용으로 일부러 둔 것). 빈 문자열도
 * 없는 것으로 친다: DB에서 `''`가 들어오면 `null`과 똑같이 취급해야 위젯이 깨진 이미지를
 * 그리지 않는다.
 */
export function resolveWidgetImageUrl(row: {
  widget_image_url: string | null;
  album_cover_url: string | null;
}): string | null {
  const widget = row.widget_image_url?.trim();
  if (widget) return widget;

  const cover = row.album_cover_url?.trim();
  if (cover) return cover;

  return null;
}

/**
 * 뷰 행을 위젯 페이로드로 바꾼다. 행이 없으면(오늘 픽이 없거나 아직 발행 전) `null`.
 * 호출부는 `null`을 "빈 위젯을 그려라"로 해석하면 된다 — 에러가 아니다.
 */
export function toWidgetPayload(row: WidgetTodayPickRow | null | undefined): WidgetPayload | null {
  if (!row) return null;

  return {
    pickDate: row.pick_date,
    songId: row.song_id,
    title: row.title,
    artist: row.artist,
    imageUrl: resolveWidgetImageUrl(row),
    deepLink: WIDGET_DEEP_LINK,
  };
}
