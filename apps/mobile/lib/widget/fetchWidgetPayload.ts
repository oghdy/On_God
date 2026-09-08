// P3-S1-T2: 위젯에 전달할 데이터를 가져오는 부분. 계약과 폴백 로직은 `@ongod/core`에
// 있고(앱·iOS·Android가 공유해야 하므로), 여기는 Supabase에서 읽어오는 I/O만 담당한다.

import { toWidgetPayload, type WidgetPayload, type WidgetTodayPickRow } from "@ongod/core";

import { supabase } from "../supabase/client";

/**
 * `widget_today_pick` 뷰에서 오늘 픽을 읽는다. 결과는 0행 또는 1행.
 *
 * **날짜 필터를 클라이언트에서 걸지 않는다.** 뷰가 KST 자정 기준으로 이미 걸러주며,
 * 그 기준은 P1-S6 발행 cron(UTC 15:00 = KST 00:00)과 같다. 앱이 `.eq("pick_date", ...)`
 * 같은 걸 덧붙이는 순간 기기 타임존에 따라 하루가 어긋난다 — 기존 `useTodayPick`이
 * 클라이언트에서 KST를 계산하는데, 위젯 경로는 의도적으로 그 방식을 쓰지 않는다.
 *
 * 인증 없이(anon) 조회된다. 게스트 모드에서도 위젯이 떠야 하기 때문이며, 뷰가
 * `status = 'published'`만 노출하므로 미발행 콘텐츠가 새어나가지 않는다.
 */
export async function fetchWidgetPayload(): Promise<WidgetPayload | null> {
  const { data, error } = await supabase
    .from("widget_today_pick")
    .select("*")
    .maybeSingle<WidgetTodayPickRow>();

  // 0행은 정상이다(그날 픽이 없거나 아직 발행 전) — `maybeSingle`이 null을 돌려주고
  // 에러로 취급하지 않는다. 그 외의 에러는 그대로 올려서 호출부가 재시도하게 둔다.
  if (error) throw error;

  return toWidgetPayload(data);
}
