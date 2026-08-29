// P1-S4: 실제 env에 있는 키만으로 provider들을 조립한다. Apple Music/Spotify 키가 아직
// 없으면(2026-08-29 기준) 그냥 등록하지 않는다 — 오케스트레이터가 "등록된 provider만 병렬
// 호출"하는 구조라 이게 그대로 부분 성공 처리(P1-S2-T6)로 이어진다. 키가 생기면 여기
// 조건문이 자동으로 활성화되고, 코드는 더 손댈 필요 없다.

import "server-only";
import {
  createAppleMusicProvider,
  createClaudeProvider,
  createGeniusProvider,
  createSpotifyProvider,
  createYoutubeProvider,
} from "@ongod/integrations/adapters";
import type { LyricsProvider, MetadataProvider, TranslationProvider } from "@ongod/integrations";

import { serverEnv } from "@/lib/env.server";

export function buildMetadataProviders(): MetadataProvider[] {
  const providers: MetadataProvider[] = [];

  if (serverEnv.APPLE_MUSIC_TEAM_ID && serverEnv.APPLE_MUSIC_KEY_ID && serverEnv.APPLE_MUSIC_PRIVATE_KEY) {
    providers.push(
      createAppleMusicProvider({
        teamId: serverEnv.APPLE_MUSIC_TEAM_ID,
        keyId: serverEnv.APPLE_MUSIC_KEY_ID,
        privateKey: serverEnv.APPLE_MUSIC_PRIVATE_KEY,
      }),
    );
  }

  if (serverEnv.SPOTIFY_CLIENT_ID && serverEnv.SPOTIFY_CLIENT_SECRET) {
    providers.push(
      createSpotifyProvider({
        clientId: serverEnv.SPOTIFY_CLIENT_ID,
        clientSecret: serverEnv.SPOTIFY_CLIENT_SECRET,
      }),
    );
  }

  if (serverEnv.YOUTUBE_API_KEY) {
    providers.push(createYoutubeProvider({ apiKey: serverEnv.YOUTUBE_API_KEY }));
  }

  return providers;
}

export function buildLyricsProvider(): LyricsProvider | null {
  return serverEnv.GENIUS_ACCESS_TOKEN
    ? createGeniusProvider({ accessToken: serverEnv.GENIUS_ACCESS_TOKEN })
    : null;
}

export function buildTranslationProvider(): TranslationProvider | null {
  return serverEnv.ANTHROPIC_API_KEY ? createClaudeProvider({ apiKey: serverEnv.ANTHROPIC_API_KEY }) : null;
}
