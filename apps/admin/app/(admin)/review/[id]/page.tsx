import Link from "next/link";
import { notFound } from "next/navigation";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

import { LyricsForm } from "./lyrics-form";
import { SongInfoForm } from "./song-info-form";
import { StreamingLinksForm } from "./streaming-links-form";
import { VerifyButton } from "./verify-button";

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getServiceRoleClient();

  const { data: song } = await db.from("songs").select("*").eq("id", id).maybeSingle();
  if (!song) notFound();

  const { data: lyrics } = await db.from("lyrics").select("*").eq("song_id", id).maybeSingle();
  const { data: songInfo } = await db.from("song_info").select("*").eq("song_id", id).maybeSingle();

  const bothVerified = !!lyrics?.is_verified && !!songInfo?.is_verified;

  return (
    <div style={{ maxWidth: 900 }}>
      <p>
        <Link href="/review">← 검수 큐로</Link>
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>
            {song.title} — {song.artist}
          </h1>
          <p style={{ fontSize: 13, color: "#666" }}>
            앨범: {song.album ?? "-"} · 발매연도: {song.release_year ?? "-"} · 장르: {song.genre ?? "-"}
          </p>
        </div>
        <VerifyButton songId={id} alreadyVerified={bothVerified} />
      </div>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16 }}>스트리밍 링크</h2>
        <StreamingLinksForm
          songId={id}
          appleMusicUrl={song.apple_music_url}
          spotifyUrl={song.spotify_url}
          youtubeUrl={song.youtube_url}
        />
      </section>

      <div style={{ marginTop: 24 }}>
        <LyricsForm
          key={lyrics?.updated_at ?? "new"}
          songId={id}
          songTitle={song.title}
          artist={song.artist}
          originalText={lyrics?.original_text ?? null}
          koreanTranslation={lyrics?.korean_translation ?? null}
          translationNotes={lyrics?.translation_notes ?? null}
          isVerified={!!lyrics?.is_verified}
        />
        {lyrics?.source_url ? (
          <p style={{ fontSize: 12, color: "#666" }}>
            출처:{" "}
            <a href={lyrics.source_url} target="_blank" rel="noreferrer">
              {lyrics.source_url}
            </a>
          </p>
        ) : null}
      </div>

      <SongInfoForm
        key={songInfo?.updated_at ?? "new"}
        songId={id}
        songTitle={song.title}
        artist={song.artist}
        originalText={lyrics?.original_text ?? null}
        descriptionKo={songInfo?.description_ko ?? null}
        historicalContextKo={songInfo?.historical_context_ko ?? null}
        scriptureReference={songInfo?.scripture_reference ?? null}
        isVerified={!!songInfo?.is_verified}
      />
    </div>
  );
}
