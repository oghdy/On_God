import { toKstDateString } from "@ongod/core";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

import { AssignForm } from "./assign-form";
import { UnassignButton } from "./unassign-button";

const WINDOW_DAYS = 14;

const STATUS_LABEL: Record<string, string> = {
  draft: "초안",
  scheduled: "예약됨",
  published: "발행됨",
};

/** KST 기준 오늘부터 `WINDOW_DAYS`일간의 날짜 문자열(YYYY-MM-DD) 배열. */
function upcomingKstDates(days: number): string[] {
  const todayKst = toKstDateString(new Date());
  const [y, m, d] = todayKst.split("-").map(Number) as [number, number, number];
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    // UTC 기준 날짜 산술로 달력 계산(월/년 경계)을 안전하게 처리 — KST "날짜"만 다루므로
    // 시각대 자체는 중요하지 않고, 달력 계산의 정확성만 필요하다.
    const date = new Date(Date.UTC(y, m - 1, d + i));
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

interface DailyPickRow {
  id: string;
  song_id: string;
  pick_date: string;
  status: string;
  editor_note: string | null;
  songs: { title: string; artist: string } | null;
}

export default async function SchedulePage() {
  const db = getServiceRoleClient();
  const dates = upcomingKstDates(WINDOW_DAYS);
  const rangeStart = dates[0]!;
  const rangeEnd = dates[dates.length - 1]!;

  const { data: picksData } = await db
    .from("daily_picks")
    .select("id, song_id, pick_date, status, editor_note, songs(title, artist)")
    .gte("pick_date", rangeStart)
    .lte("pick_date", rangeEnd)
    .order("pick_date");
  const picks = (picksData ?? []) as unknown as DailyPickRow[];
  const pickByDate = new Map(picks.map((p) => [p.pick_date, p]));

  // P1-S6-T1: 배정 후보는 "검수 완료된" 곡만 — 검수 안 된 곡을 예약해도 어차피
  // pg_cron이 발행 안 시키지만(P1-S6-T5), 애초에 후보에서 빼는 게 운영자 혼란을 줄인다.
  const { data: songsData } = await db
    .from("songs")
    .select("id, title, artist, lyrics(is_verified), song_info(is_verified)");
  const verifiedSongs = ((songsData ?? []) as unknown as Array<{
    id: string;
    title: string;
    artist: string;
    lyrics: { is_verified: boolean | null } | null;
    song_info: { is_verified: boolean | null } | null;
  }>).filter((s) => s.lyrics?.is_verified && s.song_info?.is_verified);

  // 이미 예약 기간 안에 배정된 곡은 후보에서 뺀다(같은 곡을 실수로 두 번 예약하는 것 방지).
  const alreadyPickedSongIds = new Set(picks.map((p) => p.song_id));
  const availableSongs = verifiedSongs.filter((s) => !alreadyPickedSongIds.has(s.id));

  const emptyDates = dates.filter((d) => !pickByDate.has(d));

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>예약 발행</h1>
      <p style={{ fontSize: 13, color: "#666" }}>
        KST 자정마다 pg_cron이 <code>publish_scheduled_daily_picks()</code>를 실행해서, 예약된 곡 중 오늘
        날짜가 되고 검수까지 끝난 것만 자동으로 발행한다.
      </p>

      {emptyDates.length > 0 ? (
        <p style={{ color: "#b45309", fontSize: 13, background: "#fef3c7", padding: 8, borderRadius: 4 }}>
          ⚠ 앞으로 {WINDOW_DAYS}일 중 <strong>{emptyDates.length}일</strong>이 아직 비어있다:{" "}
          {emptyDates.join(", ")}
        </p>
      ) : (
        <p style={{ color: "green", fontSize: 13 }}>✓ 앞으로 {WINDOW_DAYS}일 전부 배정됨.</p>
      )}

      <h2 style={{ fontSize: 16, marginTop: 24 }}>새로 배정</h2>
      {availableSongs.length === 0 ? (
        <p style={{ fontSize: 13, color: "#666" }}>
          배정 가능한 곡이 없다 — 검수 완료됐지만 아직 예약 안 된 곡이 없음.
        </p>
      ) : (
        <AssignForm
          availableSongs={availableSongs.map((s) => ({ id: s.id, title: s.title, artist: s.artist }))}
          defaultDate={emptyDates[0]}
        />
      )}

      <h2 style={{ fontSize: 16, marginTop: 24 }}>
        발행 일정 ({rangeStart} ~ {rangeEnd})
      </h2>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "4px 8px" }}>날짜</th>
            <th style={{ padding: "4px 8px" }}>곡</th>
            <th style={{ padding: "4px 8px" }}>상태</th>
            <th style={{ padding: "4px 8px" }}>메모</th>
            <th style={{ padding: "4px 8px" }} />
          </tr>
        </thead>
        <tbody>
          {dates.map((date) => {
            const pick = pickByDate.get(date);
            return (
              <tr key={date} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "4px 8px" }}>{date}</td>
                <td style={{ padding: "4px 8px", color: pick ? "black" : "#b45309" }}>
                  {pick ? `${pick.songs?.title} — ${pick.songs?.artist}` : "(비어있음)"}
                </td>
                <td style={{ padding: "4px 8px" }}>{pick ? (STATUS_LABEL[pick.status] ?? pick.status) : "-"}</td>
                <td style={{ padding: "4px 8px" }}>{pick?.editor_note ?? "-"}</td>
                <td style={{ padding: "4px 8px" }}>
                  {pick && pick.status === "scheduled" ? <UnassignButton pickId={pick.id} /> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
