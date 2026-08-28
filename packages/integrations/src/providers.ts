// P0-S4-T1: 외부 서비스(Apple Music/Spotify/YouTube/Genius/Claude)를 공통 인터페이스
// 뒤에 숨긴다. 실제 구현은 Phase 1(P1-S2/S3)에서 이 인터페이스를 구현하는 형태로 만든다.
// 오케스트레이터는 구체 provider가 아니라 이 인터페이스만 알면 된다 — 설계 원칙 2.

export interface SongQuery {
  title: string;
  artist: string;
}

export interface NamedProvider {
  /** 레지스트리 키, 예: "apple-music", "spotify", "youtube", "genius", "claude". */
  readonly name: string;
}

// --- 메타데이터 (Apple Music / Spotify / YouTube) ---

export interface MetadataResult {
  album: string | null;
  releaseYear: number | null;
  genre: string | null;
  albumCoverUrl: string | null;
  /** provider 쪽 트랙/영상 ID (apple_music_id, spotify_id, youtube_id 등에 매핑). */
  externalId: string | null;
  externalUrl: string | null;
}

export interface MetadataProvider extends NamedProvider {
  fetchMetadata(query: SongQuery): Promise<MetadataResult>;
}

// --- 원문 가사 (Genius) ---

export interface LyricsResult {
  originalText: string;
  /** 저작권 출처 표기용 원본 URL. */
  sourceUrl: string;
}

export interface LyricsProvider extends NamedProvider {
  fetchLyrics(query: SongQuery): Promise<LyricsResult>;
}

// --- AI 번역/해석 (Claude) ---

export interface TranslateLyricsInput {
  originalText: string;
  songTitle: string;
  artist: string;
}

export interface TranslateLyricsResult {
  koreanTranslation: string;
  translationNotes: string | null;
  modelUsed: string;
}

export interface GenerateSongInfoInput {
  songTitle: string;
  artist: string;
  originalLyrics: string;
}

export interface GenerateSongInfoResult {
  descriptionKo: string;
  historicalContextKo: string;
  /** 성경구절 연계는 선택 사항 (P1-S3-T4). */
  scriptureReference: string | null;
  modelUsed: string;
}

export interface TranslationProvider extends NamedProvider {
  translateLyrics(input: TranslateLyricsInput): Promise<TranslateLyricsResult>;
  generateSongInfo(input: GenerateSongInfoInput): Promise<GenerateSongInfoResult>;
}
