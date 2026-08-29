// P1-S4-T2~T5, T7: SRS 6장 플로우 1~6을 결합하는 오케스트레이터.
//
// 흐름: 메타데이터 병렬 수집(T2) → songs 생성 → 가사 수집(T3) → AI 해석+곡 소개(T4)
// → 앨범커버 Storage 복사·WebP 변환(T5, ADR-0003).
// 각 단계 성공/실패를 `pipeline_runs.steps`에 기록한다(T7, ADR-0002) — provider 하나가
// 실패해도 나머지는 계속 진행하는 부분 성공 처리가 이 파일의 핵심이다(P1-S2-T6).
//
// "비동기 실행"(T6)은 별도 Supabase Edge Function 대신 Next.js `after()`로 구현했다 —
// Server Action이 pipeline_runs 행을 만들고 즉시 응답을 돌려준 뒤, 같은 요청 생명주기
// 안에서 `after()`가 이 함수를 실행한다. 진짜 Edge Function으로 옮기더라도 이 함수
// 시그니처(순수 입력→DB 부수효과)는 거의 그대로 재사용 가능하도록 짰다.

import "server-only";
import type { Json } from "@ongod/db";
import type { MetadataResult } from "@ongod/integrations";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

import { copyAlbumCoverToStorage } from "./album-cover";
import { buildLyricsProvider, buildMetadataProviders, buildTranslationProvider } from "./providers";

interface StepResult {
  status: "done" | "failed" | "skipped";
  detail?: string;
  provider?: string;
  providers?: Record<string, string>;
}

/**
 * Error 인스턴스뿐 아니라, supabase-js가 던지는 PostgrestError처럼 `.message`만 있고
 * `Error`를 상속하지 않는 plain object도 처리한다 — 안 그러면 `String(error)`가
 * "[object Object]"를 반환해서 실제 원인을 알 수 없게 된다.
 */
function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export interface RunPipelineParams {
  pipelineRunId: string;
  title: string;
  artist: string;
}

export async function runPipeline(params: RunPipelineParams): Promise<void> {
  const db = getServiceRoleClient();
  const steps: Record<string, StepResult> = {};
  const stepsAsJson = (): Json => steps as unknown as Json;

  async function persistSteps() {
    await db.from("pipeline_runs").update({ steps: stepsAsJson() }).eq("id", params.pipelineRunId);
  }

  // --- 1. 메타데이터 병렬 수집 (T2) ---
  const metadataProviders = buildMetadataProviders();
  const settled = await Promise.allSettled(
    metadataProviders.map((p) => p.fetchMetadata({ title: params.title, artist: params.artist })),
  );

  const byName = new Map<string, MetadataResult>();
  const providerStatus: Record<string, string> = {};
  metadataProviders.forEach((provider, i) => {
    const outcome = settled[i];
    if (!outcome) return;
    if (outcome.status === "fulfilled") {
      byName.set(provider.name, outcome.value);
      providerStatus[provider.name] = "ok";
    } else {
      providerStatus[provider.name] = errorMessage(outcome.reason);
    }
  });

  const appleMusic = byName.get("apple-music");
  const spotify = byName.get("spotify");
  const youtube = byName.get("youtube");
  // 앨범/장르/발매연도는 Apple Music을 우선한다(카탈로그가 가장 넓음), 없으면 Spotify.
  const primary = appleMusic ?? spotify ?? null;
  // 앨범커버만은 YouTube 썸네일까지 최후 fallback으로 쓴다 — Apple Music/Spotify가 아직
  // 없는 지금(2026-08-29), 앨범커버가 아예 없는 것보다 영상 썸네일이라도 있는 게 낫다.
  const sourceCoverUrl = primary?.albumCoverUrl ?? youtube?.albumCoverUrl ?? null;

  steps.metadata = {
    status: byName.size > 0 ? "done" : "failed",
    providers: providerStatus,
  };

  let songId: string;
  try {
    const { data: song, error } = await db
      .from("songs")
      .insert({
        title: params.title,
        artist: params.artist,
        album: primary?.album ?? null,
        release_year: primary?.releaseYear ?? null,
        genre: primary?.genre ?? null,
        album_cover_url: sourceCoverUrl,
        album_cover_source_url: sourceCoverUrl,
        apple_music_id: appleMusic?.externalId ?? null,
        apple_music_url: appleMusic?.externalUrl ?? null,
        spotify_id: spotify?.externalId ?? null,
        spotify_url: spotify?.externalUrl ?? null,
        youtube_id: youtube?.externalId ?? null,
        youtube_url: youtube?.externalUrl ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    songId = song.id;
  } catch (error) {
    await db
      .from("pipeline_runs")
      .update({ status: "failed", steps: stepsAsJson(), error_log: `songs insert 실패: ${errorMessage(error)}` })
      .eq("id", params.pipelineRunId);
    return;
  }

  await db.from("pipeline_runs").update({ song_id: songId, steps: stepsAsJson() }).eq("id", params.pipelineRunId);

  // --- 2. 가사 수집 (T3) ---
  const lyricsProvider = buildLyricsProvider();
  let lyricsId: string | null = null;
  let originalText: string | null = null;

  if (!lyricsProvider) {
    steps.lyrics = { status: "skipped", detail: "GENIUS_ACCESS_TOKEN 미설정" };
  } else {
    try {
      const result = await lyricsProvider.fetchLyrics({ title: params.title, artist: params.artist });
      const { data, error } = await db
        .from("lyrics")
        .insert({ song_id: songId, original_text: result.originalText, source_url: result.sourceUrl })
        .select("id")
        .single();
      if (error) throw error;
      lyricsId = data.id;
      originalText = result.originalText;
      steps.lyrics = { status: "done", provider: lyricsProvider.name };
    } catch (error) {
      steps.lyrics = { status: "failed", detail: errorMessage(error) };
    }
  }
  await persistSteps();

  // --- 3. AI 해석 + 곡 소개 (T4) — 가사가 있어야 진행 가능 ---
  const translationProvider = buildTranslationProvider();
  if (!translationProvider) {
    const detail = "ANTHROPIC_API_KEY 미설정";
    steps.translation = { status: "skipped", detail };
    steps.songInfo = { status: "skipped", detail };
  } else if (!lyricsId || !originalText) {
    const detail = "가사 수집 실패/스킵으로 해석 불가";
    steps.translation = { status: "skipped", detail };
    steps.songInfo = { status: "skipped", detail };
  } else {
    const [translationOutcome, songInfoOutcome] = await Promise.allSettled([
      translationProvider.translateLyrics({
        originalText,
        songTitle: params.title,
        artist: params.artist,
      }),
      translationProvider.generateSongInfo({
        songTitle: params.title,
        artist: params.artist,
        originalLyrics: originalText,
      }),
    ]);

    if (translationOutcome.status === "fulfilled") {
      const t = translationOutcome.value;
      await db
        .from("lyrics")
        .update({
          korean_translation: t.koreanTranslation,
          translation_notes: t.translationNotes,
          ai_model_used: t.modelUsed,
        })
        .eq("id", lyricsId);
      steps.translation = { status: "done" };
    } else {
      steps.translation = { status: "failed", detail: errorMessage(translationOutcome.reason) };
    }

    if (songInfoOutcome.status === "fulfilled") {
      const info = songInfoOutcome.value;
      const { error } = await db.from("song_info").insert({
        song_id: songId,
        description_ko: info.descriptionKo,
        historical_context_ko: info.historicalContextKo,
        scripture_reference: info.scriptureReference,
        ai_model_used: info.modelUsed,
      });
      steps.songInfo = error
        ? { status: "failed", detail: errorMessage(error) }
        : { status: "done" };
    } else {
      steps.songInfo = { status: "failed", detail: errorMessage(songInfoOutcome.reason) };
    }
  }

  // --- 4. 앨범커버 Storage 복사·WebP 변환 (T5, ADR-0003) ---
  if (!sourceCoverUrl) {
    steps.albumCover = { status: "skipped", detail: "메타데이터에 앨범커버 URL이 없음" };
  } else {
    try {
      const { albumCoverUrl, albumCoverThumbnailUrl } = await copyAlbumCoverToStorage(songId, sourceCoverUrl);
      const { error } = await db
        .from("songs")
        .update({ album_cover_url: albumCoverUrl, album_cover_thumbnail_url: albumCoverThumbnailUrl })
        .eq("id", songId);
      if (error) throw error;
      steps.albumCover = { status: "done" };
    } catch (error) {
      // 실패해도 songs.album_cover_url엔 이미 원본 외부 URL이 들어있어서(위 insert)
      // 완전히 이미지가 없는 상태는 아니다 — 나중에 만료되면 문제가 되지만, "지금 당장
      // 이미지가 아예 안 뜨는 것"보다는 나은 상태이므로 그대로 둔다.
      steps.albumCover = { status: "failed", detail: errorMessage(error) };
    }
  }

  // --- 최종 상태 (T7) ---
  const statuses = Object.values(steps).map((s) => s.status);
  const overallStatus = statuses.every((s) => s === "done")
    ? "done"
    : statuses.some((s) => s === "done")
      ? "partial"
      : "failed";

  await db.from("pipeline_runs").update({ status: overallStatus, steps: stepsAsJson() }).eq("id", params.pipelineRunId);
}
