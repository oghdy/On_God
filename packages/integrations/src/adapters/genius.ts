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

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Genius 검색은 쿼리에 없는 단어까지 느슨하게 매칭해서 완전히 다른 곡을 1순위로 주는 경우가
 * 흔하다(특히 "Traditional"처럼 흔한 단어가 아티스트명일 때). 그래서 결과를 무조건 신뢰하지
 * 않고 두 가지를 같이 확인한다:
 *   1) 제목이 실제로 겹치는지
 *   2) URL이 `-lyrics`로 끝나는지 — Genius는 실제 노래 가사 페이지엔 이 접미사를 붙이고,
 *      자체 콘텐츠(책 발췌·기사·아티스트 아카이브 같은 "annotated" 문서)는 `-annotated`로
 *      끝낸다. 실제로 "Amazing Grace Traditional"을 검색해보면 1순위 hit이 노래가 아니라
 *      "Aaron Cohen"이 쓴 책 발췌문(lyrics_state는 "complete"라 그것만으론 구분 안 됨)이라서
 *      이 URL 패턴 없이는 걸러낼 방법이 없었다.
 * 둘 다 만족하는 hit이 없으면 차라리 NOT_FOUND가 낫다(틀린 가사를 가져오는 것보다).
 */
function pickBestHit(
  hits: GeniusSearchResponse["response"]["hits"],
  query: SongQuery,
): GeniusSearchResponse["response"]["hits"][number] | undefined {
  const normalizedQueryTitle = normalizeTitle(query.title);
  return hits.find((h) => {
    if (h.type !== "song") return false;
    if (!h.result.url.endsWith("-lyrics")) return false;
    const normalizedHitTitle = normalizeTitle(h.result.title);
    return (
      normalizedHitTitle.includes(normalizedQueryTitle) || normalizedQueryTitle.includes(normalizedHitTitle)
    );
  });
}

/** Genius 곡 페이지 HTML에서 `data-lyrics-container` 블록만 뽑아 텍스트로 만든다. */
/**
 * Genius의 `[data-lyrics-container]` 안에는 실제 가사 앞에 종종 페이지 헤더 텍스트
 * ("2 ContributorsGo Down Moses LyricsTraditional" 같은, 기여자 수+제목+"Lyrics"+아티스트가
 * 붙어 있는 한 줄)가 별도 줄로 섞여 들어온다. HTML class명이 언제든 바뀔 수 있는 스크래핑
 * 특성상 DOM 선택자로 걸러내는 대신, 이 특정 패턴만 정규식으로 첫 줄에서 제거한다 —
 * 실제 가사 첫 줄이 우연히 이 모양일 확률은 사실상 없다.
 */
function stripGeniusPageHeader(text: string): string {
  const lines = text.split("\n");
  if (lines[0] && /^\d+\s*Contributors?.*Lyrics/i.test(lines[0])) {
    lines.shift();
    while (lines[0] === "") lines.shift();
  }
  return lines.join("\n").trim();
}

function extractLyricsText(html: string): string {
  const $ = cheerio.load(html);
  const containers = $("[data-lyrics-container='true']");
  containers.find("br").replaceWith("\n");

  const parts: string[] = [];
  containers.each((_, el) => {
    const text = stripGeniusPageHeader($(el).text().trim());
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

      const hit = pickBestHit(search.response.hits, query);
      if (!hit) {
        throw new IntegrationError({
          code: "NOT_FOUND",
          provider: "genius",
          message: `"${query.title}" by ${query.artist}와 제목이 겹치는 검색 결과 없음`,
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
