// P0-S3-T3: 도메인 모델 타입. `packages/db`의 자동 생성 Row 타입과는 별개로,
// 앱 계층이 실제로 다루는 형태(선택적 camelCase, 좁혀진 literal union 등)를 정의한다.
// DB row → 이 타입으로의 변환 함수는 `packages/db`에 둔다 (core는 db를 import하지 않으므로).

export interface Profile {
  id: string;
  authUserId: string;
  displayName: string | null;
  avatarUrl: string | null;
  provider: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  releaseYear: number | null;
  genre: string | null;
  originCountry: string | null;
  appleMusicId: string | null;
  spotifyId: string | null;
  youtubeId: string | null;
  appleMusicUrl: string | null;
  spotifyUrl: string | null;
  youtubeUrl: string | null;
  albumCoverUrl: string | null;
  albumCoverSourceUrl: string | null;
  /** 위젯(Phase 3)용 경량 축소판. ADR-0003. */
  albumCoverThumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Lyrics {
  id: string;
  songId: string;
  originalText: string | null;
  /** 원문 가사 출처 URL(저작권 표기용). ADR-0003의 album_cover_source_url과 같은 패턴. */
  sourceUrl: string | null;
  koreanTranslation: string | null;
  translationNotes: string | null;
  aiModelUsed: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SongInfo {
  id: string;
  songId: string;
  descriptionKo: string | null;
  historicalContextKo: string | null;
  scriptureReference: string | null;
  aiModelUsed: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/** ADR-0002가 참조하는 constraints.sql의 CHECK 제약과 동일한 값 집합. */
export type DailyPickStatus = "draft" | "scheduled" | "published";

export interface DailyPick {
  id: string;
  songId: string;
  pickDate: string;
  editorNote: string | null;
  status: DailyPickStatus;
  publishedAt: string | null;
  createdAt: string;
}

export interface UserFavorite {
  id: string;
  userId: string;
  songId: string;
  createdAt: string;
}

export interface PushSubscription {
  id: string;
  userId: string;
  expoPushToken: string;
  /** `HH:MM:SS` (Postgres `time`), 로컬 발송 시각. */
  notifyAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** ADR-0002: 파이프라인 실행 상태 추적. */
export type PipelineRunStatus = "running" | "partial" | "done" | "failed";

export interface PipelineRun {
  id: string;
  songId: string | null;
  status: PipelineRunStatus;
  steps: Record<string, unknown>;
  errorLog: string | null;
  createdAt: string;
  updatedAt: string;
}
