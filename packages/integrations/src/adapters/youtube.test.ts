import { afterEach, describe, expect, it, vi } from "vitest";

import { IntegrationError } from "../errors";
import { createYoutubeProvider } from "./youtube";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createYoutubeProvider", () => {
  it("검색 결과를 MetadataResult로 매핑한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        items: [
          {
            id: { videoId: "abc123" },
            snippet: { thumbnails: { high: { url: "https://img.example.com/hi.jpg" } } },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = createYoutubeProvider({ apiKey: "test-key" });
    const result = await provider.fetchMetadata({ title: "Wade in the Water", artist: "Traditional" });

    expect(result).toEqual({
      album: null,
      releaseYear: null,
      genre: null,
      albumCoverUrl: "https://img.example.com/hi.jpg",
      externalId: "abc123",
      externalUrl: "https://www.youtube.com/watch?v=abc123",
    });

    const requestedUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestedUrl.searchParams.get("key")).toBe("test-key");
    expect(requestedUrl.searchParams.get("q")).toBe("Wade in the Water Traditional");
  });

  it("검색 결과가 없으면 NOT_FOUND IntegrationError를 던진다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ items: [] })));

    const provider = createYoutubeProvider({ apiKey: "test-key" });
    await expect(provider.fetchMetadata({ title: "Nope", artist: "Nobody" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      provider: "youtube",
    } satisfies Partial<IntegrationError>);
  });
});
