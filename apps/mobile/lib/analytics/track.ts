// P2-S7-T4: 기본 분석 이벤트. 실제 분석 도구(Amplitude/PostHog 등, 선택 사항 — 아직 계정
// 없음)가 붙기 전까지는 콘솔에만 남긴다. 나중에 도구가 정해지면 이 함수 내부만 바꾸면
// 호출부(화면 코드)는 손댈 필요 없다.
type AnalyticsEvent =
  | { name: "daily_card_viewed"; properties: { songId: string; pickDate: string } }
  | { name: "lyrics_viewed"; properties: { songId: string; tab: "original" | "translation" } }
  | { name: "streaming_link_opened"; properties: { songId: string; platform: string } }
  | { name: "login_attempted"; properties: { provider: "apple" | "google" } }
  | { name: "login_succeeded"; properties: { provider: string } }
  | { name: "logout"; properties: Record<string, never> };

export function track(event: AnalyticsEvent): void {
  console.log(`[analytics] ${event.name}`, event.properties);
}
