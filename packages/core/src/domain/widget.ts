// P3-S1-T2: 위젯이 그릴 데이터의 계약. 앱(RN)·iOS 위젯·Android 위젯 세 곳이 같은 모양을
// 봐야 하므로 mobile이 아니라 공유 패키지에 둔다(설계 대원칙 3 "타입을 공유한다").
//
// 읽기 원본은 Supabase의 `widget_today_pick` 뷰다(백엔드 P3-S1-T1). 이 뷰가 두 가지를
// 서버에서 강제한다 — `status = 'published'`인 픽만, 그리고 "오늘"의 기준은 KST 자정.
// **클라이언트에서 오늘 날짜를 계산하지 말 것.** 앱·iOS·Android가 각자 로컬 타임존으로
// 계산하면 해외 사용자에게 하루 어긋나고, 세 구현이 서로 달라지는 순간 원인 추적이 거의
// 불가능해진다. 이 파일에 날짜 계산이 없는 것은 의도된 것이다.

import { kstMidnightToUtc, toKstDateString } from "../date/kst";

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
 * 위젯이 새 곡으로 바뀌는 시각 — **KST 기준 오전 7시**.
 *
 * 곡 자체는 KST 자정에 발행되지만(P1-S6 cron), 위젯은 아침 7시에 전환한다. 그래서
 * **자정~7시 사이에는 어제 곡이 떠 있는 것이 정상이다** — 갱신 실패가 아니다.
 *
 * 이 시각 덕분에 위젯은 **미발행 콘텐츠를 미리 받을 필요가 없다.** 7시에 보여줄 곡은
 * 자정부터 이미 `published`라 `widget_today_pick` 뷰로 그냥 읽힌다. 자정 즉시 전환이었다면
 * 발행 전에 받아둬야 해서 RLS를 열어야 했다(handoff 2026-09-08 참고).
 *
 * **사용자 로컬 7시가 아니라 KST 7시다.** 곡 날짜가 KST 기준으로 정의돼 있어 거기 맞췄다.
 * 앱·iOS 위젯·Android 위젯이 같은 값을 써야 하므로 여기 둔다 — 세 곳이 각자 박으면
 * 반드시 어긋난다.
 */
export const WIDGET_SWITCH_HOUR_KST = 7;

const HOUR_MS = 60 * 60 * 1000;

/**
 * 주어진 순간이 속한 **KST 날짜의 전환 시각**(그날 07:00 KST)을 돌려준다.
 *
 * 어느 픽을 보여줄지는 서버(`widget_today_pick` 뷰)가 정하지만, **언제 바꿔 그릴지는**
 * 클라이언트가 판단할 수밖에 없다 — 위젯 타임라인에 예약할 순간을 만들어야 하기 때문이다.
 * 그 계산이 세 표면(앱·iOS·Android)에 흩어지면 어긋나므로 여기 한 곳에 둔다.
 *
 * 기기 로컬 타임존과 무관하게 항상 KST 07:00을 가리킨다.
 */
export function widgetSwitchAt(now: Date = new Date()): Date {
  const kstMidnight = kstMidnightToUtc(toKstDateString(now));
  return new Date(kstMidnight.getTime() + WIDGET_SWITCH_HOUR_KST * HOUR_MS);
}

/**
 * 지금이 그날의 전환 시각을 지났는가 = **오늘 곡을 이미 보여줘야 하는 시간인가.**
 *
 * `false`면 아직 자정~07:00 구간이고, 이때 어제 곡이 떠 있는 것은 정상이다.
 */
export function isAfterWidgetSwitch(now: Date = new Date()): boolean {
  return now.getTime() >= widgetSwitchAt(now).getTime();
}

/** 위젯 타임라인의 한 항목 — `date`가 되면 `props`로 그린다. */
export interface WidgetTimelineSlot<Props> {
  date: Date;
  props: Props;
}

/**
 * 위젯 타임라인을 만든다 — **"무엇을 그릴지"가 아니라 "언제 바꿔 그릴지"를 정하는 부분**
 * (P3-S2-T4). iOS는 이 결과를 `updateTimeline`에 넘기고, Android(P3-S3)는 같은 규칙으로
 * WorkManager 예약을 잡는다. 두 플랫폼이 다르게 판단하면 같은 날 다른 곡이 뜨므로
 * 규칙을 여기 한 곳에 두고 테스트로 고정한다.
 *
 * 규칙:
 * 1. **07:00을 지났으면** 새 내용을 지금 그린다.
 * 2. **아직 07:00 전이면** 지금 떠 있는 것(어제 곡)을 그대로 두고, 07:00에 바뀌도록
 *    예약한다. 곡은 이미 자정에 발행됐지만 위젯 전환 시각은 07:00이기 때문이다.
 * 3. **07:00 전인데 지금 떠 있는 게 없으면**(위젯을 방금 추가) 새 내용을 바로 그린다.
 *    유지할 어제 곡이 없는데 빈 위젯을 몇 시간 보여주는 것보다 낫다.
 *
 * `Props`를 제네릭으로 둔 건 플랫폼마다 위젯이 받는 모양이 달라서다 — 이 함수는 시각만
 * 판단하고 내용에는 관여하지 않는다.
 */
export function buildWidgetTimeline<Props>(input: {
  now: Date;
  /** 이번에 새로 그릴 내용(오늘 곡, 또는 오늘 픽이 없을 때의 빈 상태). */
  next: Props;
  /** 지금 그려지고 있는 항목. 위젯을 방금 추가했다면 없다. */
  current?: WidgetTimelineSlot<Props>;
}): WidgetTimelineSlot<Props>[] {
  const { now, next, current } = input;

  if (isAfterWidgetSwitch(now) || !current) {
    return [{ date: now, props: next }];
  }

  return [
    // 지금 떠 있는 것을 그대로 유지한다. 이 항목을 빼면 07:00까지 위젯이 빈다.
    { date: current.date, props: current.props },
    { date: widgetSwitchAt(now), props: next },
  ];
}

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
