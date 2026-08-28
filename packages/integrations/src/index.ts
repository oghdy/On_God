export { codeFromHttpStatus, IntegrationError } from "./errors";
export type { IntegrationErrorCode, IntegrationErrorParams } from "./errors";

export { createHttpClient } from "./http-client";
export type { HttpClient, HttpClientOptions, HttpRequestOptions } from "./http-client";

export type {
  GenerateSongInfoInput,
  GenerateSongInfoResult,
  LyricsProvider,
  LyricsResult,
  MetadataProvider,
  MetadataResult,
  NamedProvider,
  SongQuery,
  TranslateLyricsInput,
  TranslateLyricsResult,
  TranslationProvider,
} from "./providers";

export { createProviderRegistry } from "./registry";
export type { ProviderRegistry } from "./registry";
