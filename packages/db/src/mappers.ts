// P0-S3-T3: DB row → 도메인 타입 변환. `packages/core`가 아니라 여기 두는 이유는
// 의존 방향(`db → core`, `core`는 아무것도 import 안 함) 때문이다 —
// `packages/README.md`의 의존 규칙과 `docs/OVERVIEW.md`의 패키지 다이어그램 참고.

import type {
  DailyPick,
  DailyPickStatus,
  Lyrics,
  PipelineRun,
  PipelineRunStatus,
  Profile,
  PushSubscription,
  Song,
  SongInfo,
  UserFavorite,
} from "@ongod/core";

import type { Tables } from "./types/database";

const DAILY_PICK_STATUSES: readonly DailyPickStatus[] = ["draft", "scheduled", "published"];
const PIPELINE_RUN_STATUSES: readonly PipelineRunStatus[] = [
  "running",
  "partial",
  "done",
  "failed",
];

function assertOneOf<T extends string>(
  value: string,
  allowed: readonly T[],
  context: string,
): T {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(`${context}: unexpected value "${value}" (expected one of ${allowed.join(", ")})`);
  }
  return value as T;
}

export function fromProfileRow(row: Tables<"profiles">): Profile {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    provider: row.provider,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromSongRow(row: Tables<"songs">): Song {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    album: row.album,
    releaseYear: row.release_year,
    genre: row.genre,
    originCountry: row.origin_country,
    appleMusicId: row.apple_music_id,
    spotifyId: row.spotify_id,
    youtubeId: row.youtube_id,
    appleMusicUrl: row.apple_music_url,
    spotifyUrl: row.spotify_url,
    youtubeUrl: row.youtube_url,
    albumCoverUrl: row.album_cover_url,
    albumCoverSourceUrl: row.album_cover_source_url,
    albumCoverThumbnailUrl: row.album_cover_thumbnail_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromLyricsRow(row: Tables<"lyrics">): Lyrics {
  return {
    id: row.id,
    songId: row.song_id,
    originalText: row.original_text,
    sourceUrl: row.source_url,
    koreanTranslation: row.korean_translation,
    translationNotes: row.translation_notes,
    aiModelUsed: row.ai_model_used,
    isVerified: row.is_verified ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromSongInfoRow(row: Tables<"song_info">): SongInfo {
  return {
    id: row.id,
    songId: row.song_id,
    descriptionKo: row.description_ko,
    historicalContextKo: row.historical_context_ko,
    scriptureReference: row.scripture_reference,
    aiModelUsed: row.ai_model_used,
    isVerified: row.is_verified ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromDailyPickRow(row: Tables<"daily_picks">): DailyPick {
  return {
    id: row.id,
    songId: row.song_id,
    pickDate: row.pick_date,
    editorNote: row.editor_note,
    status: assertOneOf(row.status, DAILY_PICK_STATUSES, "daily_picks.status"),
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

export function fromUserFavoriteRow(row: Tables<"user_favorites">): UserFavorite {
  return {
    id: row.id,
    userId: row.user_id,
    songId: row.song_id,
    createdAt: row.created_at,
  };
}

export function fromPushSubscriptionRow(row: Tables<"push_subscriptions">): PushSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    expoPushToken: row.expo_push_token,
    notifyAt: row.notify_at,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromPipelineRunRow(row: Tables<"pipeline_runs">): PipelineRun {
  return {
    id: row.id,
    songId: row.song_id,
    status: assertOneOf(row.status, PIPELINE_RUN_STATUSES, "pipeline_runs.status"),
    steps: (row.steps ?? {}) as Record<string, unknown>,
    errorLog: row.error_log,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
