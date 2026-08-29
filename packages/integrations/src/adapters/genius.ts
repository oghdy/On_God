// P1-S2-T4: Genius 어댑터. Genius의 공식 API는 검색만 지원하고 가사 본문은 주지 않는다
// (ToS상 API로 가사 전문을 배포하지 않음) — 그래서 1) 검색 API로 곡 페이지 URL을 찾고,
// 2) 그 공개 웹페이지 HTML을 받아 가사 블록만 파싱해서 뽑아낸다. 두 단계라 provider 하나
// 안에서 fetch를 두 번(JSON 한 번 + HTML 한 번) 한다.

import * as cheerio from "cheerio";

import { IntegrationError } from "../errors";
import { createHttpClient } from "../http-client";
import type { LyricsProvider, LyricsResult, SongQuery } from "../providers";

export interface GeniusConfig {
  accessToken: string;
}

interface GeniusSearchResponse {
  response: {
    hits: Array<{
      type: string;
      result: {
        id: number;
        title: string;
        url: string;
        primary_artist: { name: string };
      };
    }>;
  };
}

async function fetchLyricsPageHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new IntegrationError({
        code: "NETWORK_ERROR",
        provider: "genius",
        message: `가사 페이지 요청 실패: HTTP ${res.status} (${url})`,
      });
    }
    return await res.text();
  } catch (error) {
    if (error instanceof IntegrationError) throw error;
    const isAbort = error instanceof Error && error.name === "AbortError";
    throw new IntegrationError({
      code: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
      provider: "genius",
      message: isAbort ? "가사 페이지 요청 타임아웃" : `가사 페이지 요청 실패: ${String(error)}`,
      cause: error,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Genius 곡 페이지 HTML에서 `data-lyrics-container` 블록만 뽑아 텍스트로 만든다. */
function extractLyricsText(html: string): string {
  const $ = cheerio.load(html);
  const containers = $("[data-lyrics-container='true']");
  containers.find("br").replaceWith("\n");

  const parts: string[] = [];
  containers.each((_, el) => {
    const text = $(el).text().trim();
    if (text) parts.push(text);
  });

  return parts.join("\n\n").trim();
}

export function createGeniusProvider(config: GeniusConfig): LyricsProvider {
  const client = createHttpClient({
    provider: "genius",
    baseUrl: "https://api.genius.com",
    headers: { Authorization: `Bearer ${config.accessToken}` },
  });

  return {
    name: "genius",
    async fetchLyrics(query: SongQuery): Promise<LyricsResult> {
      const search = await client.request<GeniusSearchResponse>({
        path: "/search",
        query: { q: `${query.title} ${query.artist}` },
      });

      const hit = search.response.hits.find((h) => h.type === "song");
      if (!hit) {
        throw new IntegrationError({
          code: "NOT_FOUND",
          provider: "genius",
          message: `"${query.title}" by ${query.artist} 검색 결과 없음`,
        });
      }

      const html = await fetchLyricsPageHtml(hit.result.url);
      const originalText = extractLyricsText(html);
      if (!originalText) {
        throw new IntegrationError({
          code: "INVALID_RESPONSE",
          provider: "genius",
          message: `가사 페이지에서 가사 블록을 찾지 못함 (${hit.result.url}) — Genius가 페이지 구조를 바꿨을 수 있음`,
        });
      }

      return { originalText, sourceUrl: hit.result.url };
    },
  };
}
