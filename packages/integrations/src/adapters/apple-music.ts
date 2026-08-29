// P1-S2-T1: Apple Music 어댑터. Apple Music API는 앱 단위 "developer token"(JWT, ES256)이
// 필요하다 — Team ID/Key ID/.p8 개인키로 직접 서명해서 만든다(사용자가 로그인하는 토큰과는
// 다름, MusicKit의 "musicUserToken"이 아니라 서버-서버 인증용 토큰).
//
// 2026-08-28 기준: 키(Team ID/Key ID/.p8)를 아직 발급받지 못해 이 어댑터는 실행 테스트를
// 못 했다 — 하지만 Apple Music API 스펙 자체는 안정적이고 문서화가 잘 되어 있어서, 값이
// 채워지는 즉시 동작하도록 구현은 다 끝내뒀다. 키 발급되면 registerAvailableProviders()
// (오케스트레이터, P1-S4)에 config만 넘기면 된다 — 코드 변경 불필요.

import { SignJWT, importPKCS8 } from "jose";

import { IntegrationError } from "../errors";
import { createHttpClient } from "../http-client";
import type { MetadataProvider, MetadataResult, SongQuery } from "../providers";

export interface AppleMusicConfig {
  teamId: string;
  keyId: string;
  /** .p8 파일 내용 원문 (PEM 형식, `-----BEGIN PRIVATE KEY-----`로 시작). */
  privateKey: string;
  /** 카탈로그 검색 대상 스토어프론트. 기본 미국(`us`) — 흑인영가/가스펠 카탈로그가 가장 넓다. */
  storefront?: string;
}

interface AppleMusicSearchResponse {
  results: {
    songs?: {
      data: Array<{
        id: string;
        attributes: {
          albumName?: string;
          releaseDate?: string;
          genreNames?: string[];
          artwork?: { url: string };
          url?: string;
        };
      }>;
    };
  };
}

/** ES256으로 서명한 developer token을 만든다. 만료 12시간(Apple 허용 최대 6개월, 짧게 잡아 재발급 부담을 낮춤). */
async function createDeveloperToken(config: AppleMusicConfig): Promise<string> {
  try {
    const key = await importPKCS8(config.privateKey, "ES256");
    return await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: config.keyId })
      .setIssuer(config.teamId)
      .setIssuedAt()
      .setExpirationTime("12h")
      .sign(key);
  } catch (error) {
    throw new IntegrationError({
      code: "UNAUTHORIZED",
      provider: "apple-music",
      message: "developer token 서명 실패 — teamId/keyId/privateKey(.p8) 값을 확인해라",
      cause: error,
    });
  }
}

export function createAppleMusicProvider(config: AppleMusicConfig): MetadataProvider {
  const storefront = config.storefront ?? "us";
  let tokenPromise: Promise<string> | null = null;

  function getToken(): Promise<string> {
    tokenPromise ??= createDeveloperToken(config);
    return tokenPromise;
  }

  return {
    name: "apple-music",
    async fetchMetadata(query: SongQuery): Promise<MetadataResult> {
      const token = await getToken();
      const client = createHttpClient({
        provider: "apple-music",
        baseUrl: "https://api.music.apple.com/v1",
        headers: { Authorization: `Bearer ${token}` },
      });

      let res: AppleMusicSearchResponse;
      try {
        res = await client.request<AppleMusicSearchResponse>({
          path: `/catalog/${storefront}/search`,
          query: { term: `${query.title} ${query.artist}`, types: "songs", limit: 1 },
        });
      } catch (error) {
        if (error instanceof IntegrationError && error.code === "UNAUTHORIZED") {
          tokenPromise = null; // 만료/무효 토큰이면 다음 호출에서 재발급 시도
        }
        throw error;
      }

      const song = res.results.songs?.data[0];
      if (!song) {
        throw new IntegrationError({
          code: "NOT_FOUND",
          provider: "apple-music",
          message: `"${query.title}" by ${query.artist} 검색 결과 없음`,
        });
      }

      const attrs = song.attributes;
      return {
        album: attrs.albumName ?? null,
        releaseYear: attrs.releaseDate ? Number(attrs.releaseDate.slice(0, 4)) : null,
        genre: attrs.genreNames?.[0] ?? null,
        albumCoverUrl: attrs.artwork ? attrs.artwork.url.replace("{w}", "600").replace("{h}", "600") : null,
        externalId: song.id,
        externalUrl: attrs.url ?? null,
      };
    },
  };
}
