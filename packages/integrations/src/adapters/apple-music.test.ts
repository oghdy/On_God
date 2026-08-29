import { exportPKCS8, generateKeyPair, jwtVerify } from "jose";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { createAppleMusicProvider } from "./apple-music";

let privateKeyPem: string;
let publicKey: Awaited<ReturnType<typeof generateKeyPair>>["publicKey"];

beforeAll(async () => {
  const { privateKey, publicKey: pub } = await generateKeyPair("ES256", { extractable: true });
  privateKeyPem = await exportPKCS8(privateKey);
  publicKey = pub;
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const SEARCH_RESPONSE = {
  results: {
    songs: {
      data: [
        {
          id: "song123",
          attributes: {
            albumName: "Spirituals",
            releaseDate: "1960-05-01",
            genreNames: ["Gospel", "Christian"],
            artwork: { url: "https://img.example.com/{w}x{h}bb.jpg" },
            url: "https://music.apple.com/us/song/song123",
          },
        },
      ],
    },
  },
};

describe("createAppleMusicProvider", () => {
  it("실제 EC 키로 서명한 developer token을 Authorization 헤더에 싣고, 검색 결과를 매핑한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(SEARCH_RESPONSE));
    vi.stubGlobal("fetch", fetchMock);

    const provider = createAppleMusicProvider({
      teamId: "TEAM123",
      keyId: "KEY456",
      privateKey: privateKeyPem,
      storefront: "us",
    });

    const result = await provider.fetchMetadata({ title: "Wade in the Water", artist: "Traditional" });

    expect(result).toEqual({
      album: "Spirituals",
      releaseYear: 1960,
      genre: "Gospel",
      albumCoverUrl: "https://img.example.com/600x600bb.jpg",
      externalId: "song123",
      externalUrl: "https://music.apple.com/us/song/song123",
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const authHeader = (requestInit.headers as Record<string, string>).Authorization ?? "";
    expect(authHeader).toMatch(/^Bearer /);

    const token = authHeader.replace("Bearer ", "");
    const { payload, protectedHeader } = await jwtVerify(token, publicKey);
    expect(protectedHeader.kid).toBe("KEY456");
    expect(payload.iss).toBe("TEAM123");
  });

  it("privateKey가 잘못되면 UNAUTHORIZED IntegrationError를 던진다", async () => {
    const provider = createAppleMusicProvider({
      teamId: "TEAM123",
      keyId: "KEY456",
      privateKey: "not-a-valid-pem-key",
    });

    await expect(provider.fetchMetadata({ title: "X", artist: "Y" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      provider: "apple-music",
    });
  });

  it("검색 결과가 없으면 NOT_FOUND를 던진다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ results: {} })));

    const provider = createAppleMusicProvider({
      teamId: "TEAM123",
      keyId: "KEY456",
      privateKey: privateKeyPem,
    });

    await expect(provider.fetchMetadata({ title: "Nope", artist: "Nobody" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      provider: "apple-music",
    });
  });
});
