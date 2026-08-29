// P1-S2-T3: YouTube 어댑터. MV/오디오 영상을 검색해서 매칭한다(YouTube Data API v3).
// album/releaseYear/genre 개념이 없어서 그 셋은 항상 null — MetadataProvider 인터페이스는
// 그 필드들이 nullable이라 문제 없음.

import { IntegrationError } from "../errors";
import { createHttpClient } from "../http-client";
import type { MetadataProvider, MetadataResult, SongQuery } from "../providers";

export interface YoutubeConfig {
  apiKey: string;
}

interface YoutubeSearchResponse {
  items: Array<{
    id: { videoId: string };
    snippet: {
      thumbnails: {
        high?: { url: string };
        default?: { url: string };
      };
    };
  }>;
}

export function createYoutubeProvider(config: YoutubeConfig): MetadataProvider {
  const client = createHttpClient({
    provider: "youtube",
    baseUrl: "https://www.googleapis.com/youtube/v3",
  });

  return {
    name: "youtube",
    async fetchMetadata(query: SongQuery): Promise<MetadataResult> {
      const res = await client.request<YoutubeSearchResponse>({
        path: "/search",
        query: {
          part: "snippet",
          type: "video",
          maxResults: 1,
          q: `${query.title} ${query.artist}`,
          key: config.apiKey,
        },
      });

      const item = res.items[0];
      if (!item) {
        throw new IntegrationError({
          code: "NOT_FOUND",
          provider: "youtube",
          message: `"${query.title}" by ${query.artist} 검색 결과 없음`,
        });
      }

      return {
        album: null,
        releaseYear: null,
        genre: null,
        albumCoverUrl: item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.default?.url ?? null,
        externalId: item.id.videoId,
        externalUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      };
    },
  };
}
