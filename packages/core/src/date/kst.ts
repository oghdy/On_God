// P0-S3-T4: KST(UTC+9, DST 없음) 자정 기준 날짜 유틸.
// Daily Pick(`daily_picks.pick_date`)이 KST 자정에 바뀌므로, 서버/클라이언트의 로컬
// 타임존과 무관하게 "오늘"을 KST 기준으로 판정해야 하는 모든 곳에서 이 함수들을 쓴다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 주어진 순간이 속한 KST 날짜를 `YYYY-MM-DD`로 반환한다. */
export function toKstDateString(date: Date = new Date()): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** `YYYY-MM-DD`(KST 날짜)의 KST 자정에 해당하는 UTC 순간을 반환한다. */
export function kstMidnightToUtc(kstDateString: string): Date {
  return new Date(`${kstDateString}T00:00:00+09:00`);
}

/** 두 순간이 같은 KST 날짜에 속하는지 판정한다. */
export function isSameKstDay(a: Date, b: Date): boolean {
  return toKstDateString(a) === toKstDateString(b);
}
