import Link from "next/link";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

interface ReviewQueueRow {
  id: string;
  title: string;
  artist: string;
  created_at: string;
  lyrics: { is_verified: boolean | null } | null;
  song_info: { is_verified: boolean | null } | null;
}

function needsReview(row: ReviewQueueRow): boolean {
  return !row.lyrics?.is_verified || !row.song_info?.is_verified;
}

export default async function ReviewQueuePage() {
  const db = getServiceRoleClient();
  const { data, error } = await db
    .from("songs")
    .select("id, title, artist, created_at, lyrics(is_verified), song_info(is_verified)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as ReviewQueueRow[];
  const pending = rows.filter(needsReview);
  const verified = rows.filter((r) => !needsReview(r));

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>검수 큐</h1>
      {error ? <p style={{ color: "crimson" }}>목록을 못 불러왔다: {error.message}</p> : null}

      <h2 style={{ fontSize: 16, marginTop: 24 }}>검수 대기 ({pending.length})</h2>
      {pending.length === 0 ? (
        <p style={{ color: "#666", fontSize: 14 }}>대기 중인 곡 없음.</p>
      ) : (
        <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pending.map((row) => (
            <li key={row.id}>
              <Link href={`/review/${row.id}`}>
                {row.title} — {row.artist}
              </Link>
              <span style={{ marginLeft: 8, fontSize: 12, color: "#999" }}>
                (가사 {row.lyrics?.is_verified ? "✓" : "미검수"} / 소개 {row.song_info?.is_verified ? "✓" : "미검수"})
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 16, marginTop: 24 }}>검수 완료 ({verified.length})</h2>
      {verified.length === 0 ? (
        <p style={{ color: "#666", fontSize: 14 }}>없음.</p>
      ) : (
        <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {verified.map((row) => (
            <li key={row.id}>
              <Link href={`/review/${row.id}`}>
                {row.title} — {row.artist}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
