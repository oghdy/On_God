import { afterEach, describe, expect, it, vi } from "vitest";

import { createSpotifyProvider } from "./spotify";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const TOKEN_RESPONSE = { access_token: "test-access-token", expires_in: 3600 };
const SEARCH_RESPONSE = {
  tracks: {
    items: [
      {
        id: "track123",
        album: {
          name: "Spirituals",
          release_date: "1960-01-01",
          images: [{ url: "https://img.example.com/cover.jpg" }],
        },
        external_urls: { spotify: "https://open.spotify.com/track/track123" },
      },
    ],
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createSpotifyProvider", () => {
  it("토큰 발급 후 검색 결과를 MetadataResult로 매핑한다", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(TOKEN_RESPONSE))
      .mockResolvedValueOnce(jsonResponse(SEARCH_RESPONSE));
    vi.stubGlobal("fetch", fetchMock);

    const provider = createSpotifyProvider({ clientId: "id", clientSecret: "secret" });
    const result = await provider.fetchMetadata({ title: "Wade in the Water", artist: "Traditional" });

    expect(result).toEqual({
      album: "Spirituals",
      releaseYear: 1960,
      genre: null,
      albumCoverUrl: "https://img.example.com/cover.jpg",
      externalId: "track123",
      externalUrl: "https://open.spotify.com/track/track123",
    });

    const tokenCall = fetchMock.mock.calls[0];
    expect(String(tokenCall?.[0])).toBe("https://accounts.spotify.com/api/token");
    expect((tokenCall?.[1] as RequestInit).method).toBe("POST");
  });

  it("같은 provider 인스턴스에서 두 번째 호출은 토큰을 재사용한다 (fetch 3번만 호출: 토큰1 + 검색2)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(TOKEN_RESPONSE))
      .mockResolvedValueOnce(jsonResponse(SEARCH_RESPONSE))
      .mockResolvedValueOnce(jsonResponse(SEARCH_RESPONSE));
    vi.stubGlobal("fetch", fetchMock);

    const provider = createSpotifyProvider({ clientId: "id", clientSecret: "secret" });
    await provider.fetchMetadata({ title: "A", artist: "B" });
    await provider.fetchMetadata({ title: "C", artist: "D" });

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("검색 결과가 없으면 NOT_FOUND를 던진다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(TOKEN_RESPONSE))
        .mockResolvedValueOnce(jsonResponse({ tracks: { items: [] } })),
    );

    const provider = createSpotifyProvider({ clientId: "id", clientSecret: "secret" });
    await expect(provider.fetchMetadata({ title: "Nope", artist: "Nobody" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      provider: "spotify",
    });
  });
});
