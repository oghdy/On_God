import { describe, expect, it, vi } from "vitest";

import { createClaudeProvider } from "./claude";

function anthropicResponse(content: unknown[], status = 200): Response {
  return new Response(
    JSON.stringify({
      id: "msg_test",
      type: "message",
      role: "assistant",
      model: "claude-sonnet-5",
      content,
      stop_reason: "tool_use",
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 20 },
    }),
    { status, headers: { "content-type": "application/json" } },
  );
}

function anthropicErrorResponse(status: number, type: string, message: string): Response {
  return new Response(JSON.stringify({ type: "error", error: { type, message } }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("createClaudeProvider.translateLyrics", () => {
  it("tool_use 블록을 파싱해 번역 결과를 반환한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      anthropicResponse([
        {
          type: "tool_use",
          id: "toolu_1",
          name: "provide_translation",
          input: {
            koreanTranslation: "모세여 내려가라",
            translationNotes: "출애굽 이야기를 노예 해방에 빗댄 표현.",
          },
        },
      ]),
    );

    const provider = createClaudeProvider({ apiKey: "test-key", fetch: fetchMock });
    const result = await provider.translateLyrics({
      songTitle: "Go Down Moses",
      artist: "Traditional",
      originalText: "Go down, Moses, way down in Egypt's land",
    });

    expect(result.koreanTranslation).toBe("모세여 내려가라");
    expect(result.translationNotes).toContain("출애굽");
    expect(result.modelUsed).toBe("claude-sonnet-5/prompt-v1");
  });

  it("tool_use 블록이 없으면 INVALID_RESPONSE를 던진다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "msg_test",
          type: "message",
          role: "assistant",
          model: "claude-sonnet-5",
          content: [{ type: "text", text: "그냥 텍스트만 옴" }],
          stop_reason: "end_turn",
          stop_sequence: null,
          usage: { input_tokens: 5, output_tokens: 5 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const provider = createClaudeProvider({ apiKey: "test-key", fetch: fetchMock });
    await expect(
      provider.translateLyrics({ songTitle: "X", artist: "Y", originalText: "z" }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE", provider: "claude" });
  });

  it("tool input이 스키마를 어기면(필수 필드 누락) INVALID_RESPONSE를 던진다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      anthropicResponse([
        {
          type: "tool_use",
          id: "toolu_1",
          name: "provide_translation",
          input: { koreanTranslation: "번역만 있고 notes 필드가 없음" },
        },
      ]),
    );

    const provider = createClaudeProvider({ apiKey: "test-key", fetch: fetchMock });
    await expect(
      provider.translateLyrics({ songTitle: "X", artist: "Y", originalText: "z" }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE", provider: "claude" });
  });

  it("401을 받으면 UNAUTHORIZED IntegrationError로 변환한다", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(anthropicErrorResponse(401, "authentication_error", "invalid x-api-key"));

    const provider = createClaudeProvider({ apiKey: "bad-key", fetch: fetchMock });
    await expect(
      provider.translateLyrics({ songTitle: "X", artist: "Y", originalText: "z" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED", provider: "claude" });
  });

  it("429를 받으면 RATE_LIMITED IntegrationError로 변환한다", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(anthropicErrorResponse(429, "rate_limit_error", "rate limited"));

    const provider = createClaudeProvider({ apiKey: "test-key", fetch: fetchMock });
    await expect(
      provider.translateLyrics({ songTitle: "X", artist: "Y", originalText: "z" }),
    ).rejects.toMatchObject({ code: "RATE_LIMITED", provider: "claude", retryable: true });
  });
});

describe("createClaudeProvider.generateSongInfo", () => {
  it("tool_use 블록을 파싱해 곡 소개/역사적 맥락/성경구절을 반환한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      anthropicResponse([
        {
          type: "tool_use",
          id: "toolu_2",
          name: "provide_song_info",
          input: {
            descriptionKo: "노예 해방을 노래한 대표적인 흑인영가.",
            historicalContextKo: "19세기 노예제 시대에 불리기 시작한 것으로 전해진다.",
            scriptureReference: "출애굽기 8:1",
          },
        },
      ]),
    );

    const provider = createClaudeProvider({ apiKey: "test-key", fetch: fetchMock });
    const result = await provider.generateSongInfo({
      songTitle: "Go Down Moses",
      artist: "Traditional",
      originalLyrics: "Go down, Moses...",
    });

    expect(result.descriptionKo).toContain("흑인영가");
    expect(result.scriptureReference).toBe("출애굽기 8:1");
    expect(result.modelUsed).toBe("claude-sonnet-5/prompt-v1");
  });

  it("scriptureReference가 null이어도 정상 처리한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      anthropicResponse([
        {
          type: "tool_use",
          id: "toolu_2",
          name: "provide_song_info",
          input: {
            descriptionKo: "설명",
            historicalContextKo: "맥락",
            scriptureReference: null,
          },
        },
      ]),
    );

    const provider = createClaudeProvider({ apiKey: "test-key", fetch: fetchMock });
    const result = await provider.generateSongInfo({
      songTitle: "X",
      artist: "Y",
      originalLyrics: "z",
    });

    expect(result.scriptureReference).toBeNull();
  });
});
