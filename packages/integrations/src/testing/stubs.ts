// P0-S4-T3: 실제 어댑터(Phase 1에서 구현)가 없어도 오케스트레이터/레지스트리를 테스트할 수 있는
// 스텁 provider들. 프로덕션 코드에서는 절대 쓰지 않는다 — `@ongod/integrations/testing`
// 서브패스로만 접근 가능하게 분리해뒀다.

import type {
  GenerateSongInfoResult,
  LyricsResult,
  MetadataProvider,
  MetadataResult,
  TranslateLyricsResult,
  TranslationProvider,
} from "../providers";
import type { LyricsProvider } from "../providers";

const DEFAULT_METADATA: MetadataResult = {
  album: "Stub Album",
  releaseYear: 1999,
  genre: "Gospel",
  albumCoverUrl: "https://example.com/cover.jpg",
  externalId: "stub-id",
  externalUrl: "https://example.com/track",
};

export function createStubMetadataProvider(
  name: string,
  overrides: Partial<MetadataResult> = {},
): MetadataProvider {
  return {
    name,
    async fetchMetadata() {
      return { ...DEFAULT_METADATA, ...overrides };
    },
  };
}

const DEFAULT_LYRICS: LyricsResult = {
  originalText: "Amazing grace, how sweet the sound",
  sourceUrl: "https://example.com/lyrics",
};

export function createStubLyricsProvider(
  name: string,
  overrides: Partial<LyricsResult> = {},
): LyricsProvider {
  return {
    name,
    async fetchLyrics() {
      return { ...DEFAULT_LYRICS, ...overrides };
    },
  };
}

const DEFAULT_TRANSLATION: TranslateLyricsResult = {
  koreanTranslation: "놀라운 은혜, 그 소리 얼마나 달콤한가",
  translationNotes: null,
  modelUsed: "stub-model",
};

const DEFAULT_SONG_INFO: GenerateSongInfoResult = {
  descriptionKo: "스텁 곡 소개",
  historicalContextKo: "스텁 역사적 맥락",
  scriptureReference: null,
  modelUsed: "stub-model",
};

export function createStubTranslationProvider(
  name: string,
  overrides: {
    translation?: Partial<TranslateLyricsResult>;
    songInfo?: Partial<GenerateSongInfoResult>;
  } = {},
): TranslationProvider {
  return {
    name,
    async translateLyrics() {
      return { ...DEFAULT_TRANSLATION, ...overrides.translation };
    },
    async generateSongInfo() {
      return { ...DEFAULT_SONG_INFO, ...overrides.songInfo };
    },
  };
}
