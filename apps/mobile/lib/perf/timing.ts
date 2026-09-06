// P2-S7-T1: SRS 4.2 "오늘의 카드 로딩 2초 이내"를 실제로 측정하기 위한 최소 계측.
// `app/_layout.tsx`의 첫 줄에서 import해야 정확하다 — JS 번들이 evaluate되는 시점을
// "앱 진입" 기준점으로 삼는다(네이티브 프로세스 기동 시간은 포함 안 됨, 하지만 매 실행마다
// 일관된 상대값이라 "느려졌는지/개선됐는지" 비교에는 충분하다).
const bootTimestamp = Date.now();

export function msSinceBoot(): number {
  return Date.now() - bootTimestamp;
}

/** 오늘의 카드가 실제로 화면에 그려지는 시점 등, 의미 있는 마일스톤에서 한 번만 호출한다. */
export function markContentVisible(label: string): number {
  const elapsed = msSinceBoot();
  console.log(`[perf] ${label}: ${elapsed}ms`);
  return elapsed;
}
