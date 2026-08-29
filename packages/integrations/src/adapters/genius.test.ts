import { afterEach, describe, expect, it, vi } from "vitest";

import { createGeniusProvider } from "./genius";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, { status, headers: { "content-type": "text/html" } });
}

const SEARCH_RESPONSE = {
  response: {
    hits: [
      {
        type: "song",
        result: {
          id: 1,
          title: "Wade in the Water",
          url: "https://genius.com/Traditional-wade-in-the-water-lyrics",
          primary_artist: { name: "Traditional" },
        },
      },
    ],
  },
};

const LYRICS_HTML = `
<html><body>
  <div data-lyrics-container="true">Wade in the water<br>Wade in the water, children</div>
  <div data-lyrics-container="true">God's gonna trouble the water</div>
</body></html>
`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createGeniusProvider", () => {
  it("검색 API로 곡을 찾고, 가사 페이지에서 텍스트를 추출한다", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(SEARCH_RESPONSE))
      .mockResolvedValueOnce(htmlResponse(LYRICS_HTML));
    vi.stubGlobal("fetch", fetchMock);

    const provider = createGeniusProvider({ accessToken: "test-token" });
    const result = await provider.fetchLyrics({ title: "Wade in the Water", artist: "Traditional" });

    expect(result.sourceUrl).toBe("https://genius.com/Traditional-wade-in-the-water-lyrics");
    expect(result.originalText).toContain("Wade in the water");
    expect(result.originalText).toContain("Wade in the water, children");
    expect(result.originalText).toContain("God's gonna trouble the water");

    const searchCall = fetchMock.mock.calls[0];
    const searchUrl = new URL(String(searchCall?.[0]));
    expect(searchUrl.hostname).toBe("api.genius.com");
    const searchHeaders = (searchCall?.[1] as RequestInit).headers as Record<string, string>;
    expect(searchHeaders.Authorization).toBe("Bearer test-token");
  });

  it("검색 결과가 없으면 NOT_FOUND를 던진다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ response: { hits: [] } })));

    const provider = createGeniusProvider({ accessToken: "test-token" });
    await expect(provider.fetchLyrics({ title: "Nope", artist: "Nobody" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      provider: "genius",
    });
  });

  it("가사 페이지에 가사 블록이 없으면 INVALID_RESPONSE를 던진다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(SEARCH_RESPONSE))
        .mockResolvedValueOnce(htmlResponse("<html><body>page changed, no lyrics here</body></html>")),
    );

    const provider = createGeniusProvider({ accessToken: "test-token" });
    await expect(provider.fetchLyrics({ title: "Wade in the Water", artist: "Traditional" })).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      provider: "genius",
    });
  });
});
