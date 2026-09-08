// P3-S1-T2: 앱이 오늘 곡을 받으면 위젯이 읽을 수 있는 곳에 넘긴다.
//
// 가져오기(fetch)와 넘기기(deliver)를 나눈 이유: 가져오는 쪽은 플랫폼과 무관하게 확정됐지만
// **넘기는 쪽이 아직 미결**이다. expo-widgets(공식 모듈)의 `updateSnapshot`으로 밀어넣을지,
// ADR-0004대로 App Group/SharedPreferences에 직접 쓸지가 정해져야 한다(ADR-0009 예정).
// 그 결정이 `deliverWidgetPayload` 하나만 바꾸면 되도록 경계를 여기 뒀다.

import type { WidgetPayload } from "@ongod/core";

import { fetchWidgetPayload } from "./fetchWidgetPayload";

/**
 * 위젯 표면에 페이로드를 전달한다. `null`은 "오늘 픽 없음" — 위젯이 빈 상태를 그려야 한다.
 *
 * **아직 구현 전이다.** 전달 방식(ADR-0009)이 정해지면 여기만 채우면 된다. 그때까지는
 * 콘솔에만 남긴다 — 아무것도 안 하는 것보다 파이프라인이 도는지 확인할 수 있고, Expo Go에서
 * 네이티브 없이도 앱이 정상 동작한다.
 */
async function deliverWidgetPayload(payload: WidgetPayload | null): Promise<void> {
  if (payload) {
    console.log("[widget] payload", {
      pickDate: payload.pickDate,
      title: payload.title,
      artist: payload.artist,
      hasImage: payload.imageUrl !== null,
    });
  } else {
    console.log("[widget] payload 없음 — 오늘 픽이 없거나 아직 발행 전");
  }
}

/**
 * 오늘 픽을 읽어 위젯에 전달한다. 실패해도 절대 던지지 않는다 — 위젯 동기화가 안 되는 것이
 * 앱 자체를 깨뜨려서는 안 된다(네트워크 없음은 흔한 상황이고, 위젯은 마지막 값을 계속 그리면
 * 된다). 실패는 로그만 남기고 다음 기회에 다시 시도한다.
 */
export async function syncWidget(): Promise<void> {
  try {
    const payload = await fetchWidgetPayload();
    await deliverWidgetPayload(payload);
  } catch (error) {
    console.warn("[widget] 동기화 실패 — 위젯은 마지막 값을 유지한다", error);
  }
}
