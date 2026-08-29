import Link from "next/link";
import { toKstDateString } from "@ongod/core";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

const STATUS_COLOR: Record<string, string> = {
  draft: "#999",
  scheduled: "#2563eb",
  published: "#16a34a",
};

interface CalendarPick {
  pick_date: string;
  status: string;
  songs: { title: string } | null;
}

interface CalendarCell {
  date: string;
  day: number;
}

/** KST 기준 "이번 달" 달력 그리드(일요일 시작, 앞뒤 빈 칸 포함). P1-S7-T2. */
function buildMonthGrid(): { cells: (CalendarCell | null)[]; rangeStart: string; rangeEnd: string } {
  const todayKst = toKstDateString(new Date());
  const [y, m] = todayKst.split("-").map(Number) as [number, number];

  const firstOfMonth = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const startWeekday = firstOfMonth.getUTCDay(); // 0 = 일요일

  const cells: (CalendarCell | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(y, m - 1, day)).toISOString().slice(0, 10);
    cells.push({ date, day });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return {
    cells,
    rangeStart: `${y}-${String(m).padStart(2, "0")}-01`,
    rangeEnd: new Date(Date.UTC(y, m - 1, daysInMonth)).toISOString().slice(0, 10),
  };
}

/** P1-S7-T4: 오늘부터 `days`일 중 daily_picks가 아예 없는 날짜 수(재고 경고). */
function countEmptyUpcomingDays(coveredDates: Set<string>, days: number): number {
  const todayKst = toKstDateString(new Date());
  const [y, m, d] = todayKst.split("-").map(Number) as [number, number, number];
  let empty = 0;
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10);
    if (!coveredDates.has(date)) empty++;
  }
  return empty;
}

export default async function DashboardPage() {
  const db = getServiceRoleClient();

  const [{ count: totalSongs }, { data: songsForVerify }, { data: picksData }, { cells, rangeStart, rangeEnd }] =
    await Promise.all([
      db.from("songs").select("id", { count: "exact", head: true }),
      db.from("songs").select("id, lyrics(is_verified), song_info(is_verified)"),
      db.from("daily_picks").select("pick_date, status, songs(title)"),
      Promise.resolve(buildMonthGrid()),
    ]);

  const verifyRows = (songsForVerify ?? []) as unknown as Array<{
    id: string;
    lyrics: { is_verified: boolean | null } | null;
    song_info: { is_verified: boolean | null } | null;
  }>;
  const pendingReviewCount = verifyRows.filter((s) => !s.lyrics?.is_verified || !s.song_info?.is_verified).length;

  const allPicks = (picksData ?? []) as unknown as CalendarPick[];
  const publishedCount = allPicks.filter((p) => p.status === "published").length;
  const scheduledCount = allPicks.filter((p) => p.status === "scheduled").length;

  const WINDOW_DAYS = 14;
  const emptyUpcoming = countEmptyUpcomingDays(new Set(allPicks.map((p) => p.pick_date)), WINDOW_DAYS);

  const monthPicks = allPicks.filter((p) => p.pick_date >= rangeStart && p.pick_date <= rangeEnd);
  const monthPickByDate = new Map(monthPicks.map((p) => [p.pick_date, p]));

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>대시보드</h1>

      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
        <Stat label="전체 곡" value={totalSongs ?? 0} />
        <Stat label="검수 대기" value={pendingReviewCount} warn={pendingReviewCount > 0} />
        <Stat label="예약됨" value={scheduledCount} />
        <Stat label="발행됨" value={publishedCount} />
      </div>

      {emptyUpcoming > 0 ? (
        <p style={{ color: "#b45309", fontSize: 13, background: "#fef3c7", padding: 8, borderRadius: 4, marginTop: 16 }}>
          ⚠ 앞으로 {WINDOW_DAYS}일 중 <strong>{emptyUpcoming}일</strong>치 콘텐츠가 비어있다. →{" "}
          <Link href="/schedule">예약 발행에서 채우기</Link>
        </p>
      ) : (
        <p style={{ color: "green", fontSize: 13, marginTop: 16 }}>✓ 앞으로 {WINDOW_DAYS}일치 콘텐츠 재고 충분.</p>
      )}

      <div style={{ display: "flex", gap: 16, marginTop: 16, fontSize: 13 }}>
        <Link href="/songs/new">+ 곡 등록</Link>
        <Link href="/review">검수 큐</Link>
        <Link href="/songs">곡 목록</Link>
        <Link href="/schedule">예약 발행</Link>
      </div>

      <h2 style={{ fontSize: 16, marginTop: 24 }}>발행 캘린더 ({rangeStart.slice(0, 7)})</h2>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12, tableLayout: "fixed" }}>
        <thead>
          <tr>
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <th key={d} style={{ padding: 4, borderBottom: "1px solid #ddd" }}>
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: cells.length / 7 }, (_, week) => (
            <tr key={week}>
              {cells.slice(week * 7, week * 7 + 7).map((cell, i) => {
                if (!cell) return <td key={i} style={{ padding: 4, border: "1px solid #f0f0f0" }} />;
                const pick = monthPickByDate.get(cell.date);
                return (
                  <td key={cell.date} style={{ padding: 4, border: "1px solid #f0f0f0", verticalAlign: "top" }}>
                    <div>{cell.day}</div>
                    {pick ? (
                      <div style={{ color: STATUS_COLOR[pick.status] ?? "black", fontSize: 11 }}>
                        {pick.songs?.title ?? "(제목 없음)"}
                      </div>
                    ) : (
                      <div style={{ color: "#ccc", fontSize: 11 }}>-</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 11, color: "#666" }}>
        <span style={{ color: STATUS_COLOR.scheduled }}>■</span> 예약됨 &nbsp;
        <span style={{ color: STATUS_COLOR.published }}>■</span> 발행됨 &nbsp;
        <span style={{ color: STATUS_COLOR.draft }}>■</span> 초안
      </p>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: "8px 16px", minWidth: 100 }}>
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: warn ? "#b45309" : "black" }}>{value}</div>
    </div>
  );
}
