import { afterEach, describe, expect, it, vi } from "vitest";

import { IntegrationError } from "./errors";
import { createHttpClient } from "./http-client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createHttpClient", () => {
  it("성공 응답을 JSON으로 파싱해 반환한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ hello: "world" }));
    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpClient({ provider: "test", baseUrl: "https://api.example.com" });
    const result = await client.request<{ hello: string }>({ path: "/songs" });

    expect(result).toEqual({ hello: "world" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.example.com/songs");
  });

  it("query 파라미터를 URL에 직렬화한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpClient({ provider: "test", baseUrl: "https://api.example.com" });
    await client.request({ path: "/search", query: { q: "amazing grace", limit: 5, skip: undefined } });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.example.com/search?q=amazing+grace&limit=5",
    );
  });

  it("404는 재시도하지 않고 바로 NOT_FOUND IntegrationError를 던진다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 404));
    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpClient({ provider: "genius", baseUrl: "https://api.example.com" });

    await expect(client.request({ path: "/x" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      provider: "genius",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("429는 재시도하고, 결국 성공하면 그 결과를 반환한다", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpClient({
      provider: "spotify",
      baseUrl: "https://api.example.com",
      maxRetries: 1,
      retryDelayMs: 1,
    });

    const result = await client.request<{ ok: boolean }>({ path: "/x" });
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("재시도 횟수를 다 쓰면 마지막 에러를 던진다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 500));
    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpClient({
      provider: "apple-music",
      baseUrl: "https://api.example.com",
      maxRetries: 2,
      retryDelayMs: 1,
    });

    await expect(client.request({ path: "/x" })).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      retryable: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("네트워크 예외(fetch reject)는 NETWORK_ERROR로 정규화된다", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpClient({
      provider: "youtube",
      baseUrl: "https://api.example.com",
      maxRetries: 0,
    });

    await expect(client.request({ path: "/x" })).rejects.toBeInstanceOf(IntegrationError);
    await expect(client.request({ path: "/x" })).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });
});
