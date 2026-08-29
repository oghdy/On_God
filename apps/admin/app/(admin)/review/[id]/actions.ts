"use server";

import { revalidatePath } from "next/cache";

import { buildTranslationProvider } from "@/lib/pipeline/providers";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export interface FormActionState {
  error: string | null;
  success?: boolean;
}

function nullableString(value: FormDataEntryValue | null): string | null {
  const str = typeof value === "string" ? value.trim() : "";
  return str.length > 0 ? str : null;
}

// --- P1-S5-T3: 스트리밍 링크 수동 교정 (특히 자동 매칭이 틀리기 쉬운 YouTube) ---

export async function updateStreamingLinks(
  songId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const db = getServiceRoleClient();
  const { error } = await db
    .from("songs")
    .update({
      apple_music_url: nullableString(formData.get("apple_music_url")),
      spotify_url: nullableString(formData.get("spotify_url")),
      youtube_url: nullableString(formData.get("youtube_url")),
    })
    .eq("id", songId);

  if (error) return { error: error.message };
  revalidatePath(`/review/${songId}`);
  return { error: null, success: true };
}

// --- P1-S5-T2: 가사/번역 인라인 편집 ---
// upsert(song_id 기준)를 쓴다 — 파이프라인이 가사 수집에서 실패했으면(부분 성공) lyrics
// 행 자체가 없을 수 있는데, 운영자가 여기서 직접 채워 넣을 수 있어야 하기 때문.

export async function updateLyrics(
  songId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const db = getServiceRoleClient();
  const { error } = await db.from("lyrics").upsert(
    {
      song_id: songId,
      original_text: nullableString(formData.get("original_text")),
      korean_translation: nullableString(formData.get("korean_translation")),
      translation_notes: nullableString(formData.get("translation_notes")),
    },
    { onConflict: "song_id" },
  );

  if (error) return { error: error.message };
  revalidatePath(`/review/${songId}`);
  return { error: null, success: true };
}

// --- P1-S5-T2: 곡 소개/역사적 맥락/성경구절 인라인 편집 ---

export async function updateSongInfo(
  songId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const db = getServiceRoleClient();
  const { error } = await db.from("song_info").upsert(
    {
      song_id: songId,
      description_ko: nullableString(formData.get("description_ko")),
      historical_context_ko: nullableString(formData.get("historical_context_ko")),
      scripture_reference: nullableString(formData.get("scripture_reference")),
    },
    { onConflict: "song_id" },
  );

  if (error) return { error: error.message };
  revalidatePath(`/review/${songId}`);
  return { error: null, success: true };
}

// --- P1-S5-T4: 검수 완료 ---

export async function markVerified(songId: string): Promise<void> {
  const db = getServiceRoleClient();
  await db.from("lyrics").update({ is_verified: true }).eq("song_id", songId);
  await db.from("song_info").update({ is_verified: true }).eq("song_id", songId);
  revalidatePath(`/review/${songId}`);
  revalidatePath("/review");
}

// --- P1-S5-T5: AI 재생성 — 다시 만들면 다시 검수해야 하니 is_verified를 되돌린다 ---

export async function regenerateTranslation(
  songId: string,
  songTitle: string,
  artist: string,
  originalText: string,
): Promise<FormActionState> {
  const provider = buildTranslationProvider();
  if (!provider) return { error: "ANTHROPIC_API_KEY 미설정" };
  if (!originalText.trim()) return { error: "원문 가사가 없어서 재생성할 수 없다." };

  try {
    const result = await provider.translateLyrics({ originalText, songTitle, artist });
    const db = getServiceRoleClient();
    const { error } = await db
      .from("lyrics")
      .update({
        korean_translation: result.koreanTranslation,
        translation_notes: result.translationNotes,
        ai_model_used: result.modelUsed,
        is_verified: false,
      })
      .eq("song_id", songId);
    if (error) return { error: error.message };
    revalidatePath(`/review/${songId}`);
    return { error: null, success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function regenerateSongInfo(
  songId: string,
  songTitle: string,
  artist: string,
  originalText: string,
): Promise<FormActionState> {
  const provider = buildTranslationProvider();
  if (!provider) return { error: "ANTHROPIC_API_KEY 미설정" };
  if (!originalText.trim()) return { error: "원문 가사가 없어서 재생성할 수 없다." };

  try {
    const result = await provider.generateSongInfo({ songTitle, artist, originalLyrics: originalText });
    const db = getServiceRoleClient();
    const { error } = await db.from("song_info").upsert(
      {
        song_id: songId,
        description_ko: result.descriptionKo,
        historical_context_ko: result.historicalContextKo,
        scripture_reference: result.scriptureReference,
        ai_model_used: result.modelUsed,
        is_verified: false,
      },
      { onConflict: "song_id" },
    );
    if (error) return { error: error.message };
    revalidatePath(`/review/${songId}`);
    return { error: null, success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
