import Link from "next/link";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

import { DeleteButton } from "./delete-button";

interface SongRow {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  created_at: string;
  lyrics: { is_verified: boolean | null } | null;
  song_info: { is_verified: boolean | null } | null;
}

export default async function SongsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; verified?: string }>;
}) {
  const { q, verified } = await searchParams;
  const db = getServiceRoleClient();

  // P1-S7-T1: 텍스트 검색은 DB 레벨에서(제목/아티스트 부분일치) — 곡이 많아져도 계속
  // 확장 가능하게, 클라이언트에서 전체 목록을 내려받아 필터링하는 방식은 피한다.
  let query = db
    .from("songs")
    .select("id, title, artist, genre, created_at, lyrics(is_verified), song_info(is_verified)")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`title.ilike.%${q}%,artist.ilike.%${q}%`);
  }

  const { data } = await query;
  let songs = (data ?? []) as unknown as SongRow[];

  if (verified === "yes") {
    songs = songs.filter((s) => s.lyrics?.is_verified && s.song_info?.is_verified);
  } else if (verified === "no") {
    songs = songs.filter((s) => !s.lyrics?.is_verified || !s.song_info?.is_verified);
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>곡 목록</h1>

      <form style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input type="text" name="q" defaultValue={q ?? ""} placeholder="제목·아티스트 검색" />
        <select name="verified" defaultValue={verified ?? ""}>
          <option value="">검수 상태 전체</option>
          <option value="yes">검수 완료만</option>
          <option value="no">미검수만</option>
        </select>
        <button type="submit">검색</button>
      </form>

      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "4px 8px" }}>제목</th>
            <th style={{ padding: "4px 8px" }}>아티스트</th>
            <th style={{ padding: "4px 8px" }}>장르</th>
            <th style={{ padding: "4px 8px" }}>검수</th>
            <th style={{ padding: "4px 8px" }} />
          </tr>
        </thead>
        <tbody>
          {songs.map((song) => {
            const isVerified = !!song.lyrics?.is_verified && !!song.song_info?.is_verified;
            return (
              <tr key={song.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "4px 8px" }}>
                  <Link href={`/review/${song.id}`}>{song.title}</Link>
                </td>
                <td style={{ padding: "4px 8px" }}>{song.artist}</td>
                <td style={{ padding: "4px 8px" }}>{song.genre ?? "-"}</td>
                <td style={{ padding: "4px 8px", color: isVerified ? "green" : "#b45309" }}>
                  {isVerified ? "완료" : "미검수"}
                </td>
                <td style={{ padding: "4px 8px" }}>
                  <DeleteButton songId={song.id} songLabel={`${song.title} — ${song.artist}`} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {songs.length === 0 ? <p style={{ color: "#666", fontSize: 13 }}>결과 없음.</p> : null}
    </div>
  );
}
