// P1-S2-T2: Spotify 어댑터. Client Credentials Flow(사용자 로그인 없이 앱 자격만으로
// 액세스 토큰 발급)로 카탈로그 검색만 한다 — 재생/사용자 데이터는 필요 없어서 이 플로우로 충분.
//
// 2026-08-28 기준: 무료 Spotify Developer 계정으로는 대시보드에서 Web API 접근 자체가
// 막혀있어(Premium 요구) 키를 아직 못 받았다 — backend-log P1-S2-T0b 참고. Client
// Credentials Flow 스펙 자체는 안정적이라 구현은 다 끝내뒀고, clientId/clientSecret만
// 채우면 바로 동작한다.

import { IntegrationError, codeFromHttpStatus } from "../errors";
import { createHttpClient } from "../http-client";
import type { MetadataProvider, MetadataResult, SongQuery } from "../providers";

export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
}

interface SpotifyTokenResponse {
  access_token: string;
  expires_in: number;
}

interface SpotifySearchResponse {
  tracks: {
    items: Array<{
      id: string;
      album?: {
        name?: string;
        release_date?: string;
        images?: Array<{ url: string }>;
      };
      external_urls?: { spotify?: string };
    }>;
  };
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

async function fetchAccessToken(config: SpotifyConfig): Promise<CachedToken> {
  const basic = btoa(`${config.clientId}:${config.clientSecret}`);
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new IntegrationError({
      code: codeFromHttpStatus(res.status),
      provider: "spotify",
      message: `access token 발급 실패: HTTP ${res.status} — clientId/clientSecret 확인해라`,
    });
  }

  const data = (await res.json()) as SpotifyTokenResponse;
  // 만료 60초 전에 미리 갱신해서 요청 도중 만료되는 경우를 피한다.
  return { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
}

export function createSpotifyProvider(config: SpotifyConfig): MetadataProvider {
  let cached: CachedToken | null = null;

  async function getAccessToken(): Promise<string> {
    if (!cached || cached.expiresAt <= Date.now()) {
      cached = await fetchAccessToken(config);
    }
    return cached.token;
  }

  return {
    name: "spotify",
    async fetchMetadata(query: SongQuery): Promise<MetadataResult> {
      const token = await getAccessToken();
      const client = createHttpClient({
        provider: "spotify",
        baseUrl: "https://api.spotify.com/v1",
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await client.request<SpotifySearchResponse>({
        path: "/search",
        query: { q: `track:${query.title} artist:${query.artist}`, type: "track", limit: 1 },
      });

      const track = res.tracks.items[0];
      if (!track) {
        throw new IntegrationError({
          code: "NOT_FOUND",
          provider: "spotify",
          message: `"${query.title}" by ${query.artist} 검색 결과 없음`,
        });
      }

      return {
        album: track.album?.name ?? null,
        releaseYear: track.album?.release_date ? Number(track.album.release_date.slice(0, 4)) : null,
        // Spotify 트랙 검색 응답엔 장르가 없다(아티스트 엔드포인트에만 있음) — 필요해지면
        // 아티스트 조회를 한 번 더 붙여야 하는데, 지금 스코프(트랙 링크·popularity)엔 불필요.
        genre: null,
        albumCoverUrl: track.album?.images?.[0]?.url ?? null,
        externalId: track.id,
        externalUrl: track.external_urls?.spotify ?? null,
      };
    },
  };
}
