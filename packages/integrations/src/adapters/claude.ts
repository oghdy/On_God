// P1-S3-T1~T6: Claude 어댑터(TranslationProvider). 가사 해석(직역+의역+신학·역사 맥락 notes)과
// 곡 소개+역사적 맥락(+성경구절 연계)을 생성한다.
//
// 구조화된 출력은 자유 텍스트를 파싱하는 대신 tool_choice로 특정 tool 호출을 강제하고,
// 그 input을 zod로 다시 검증하는 방식으로 만든다(T6) — 모델이 스키마를 어겨도(드묾) 여기서
// 바로 잡아낸다. 프롬프트가 바뀌면 `PROMPT_VERSION`을 올린다 — `ai_model_used`에
// `모델ID/prompt-v{N}` 형태로 같이 기록해서, 나중에 "이 해석이 어떤 프롬프트로 만들어졌는지"
// 추적할 수 있게 한다(T5/T6).

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { IntegrationError, codeFromHttpStatus } from "../errors";
import type {
  GenerateSongInfoInput,
  GenerateSongInfoResult,
  TranslateLyricsInput,
  TranslateLyricsResult,
  TranslationProvider,
} from "../providers";

export interface ClaudeConfig {
  apiKey: string;
  /** 테스트 전용: SDK가 쓸 fetch 구현을 주입한다(계약 테스트에서 네트워크 없이 mock하기 위함). */
  fetch?: typeof fetch;
}

const MODEL_ID = "claude-sonnet-5";
const PROMPT_VERSION = 1;
const modelUsed = () => `${MODEL_ID}/prompt-v${PROMPT_VERSION}`;

function toIntegrationError(error: unknown, action: string): IntegrationError {
  if (error instanceof Anthropic.AuthenticationError) {
    return new IntegrationError({
      code: "UNAUTHORIZED",
      provider: "claude",
      message: `${action}: 인증 실패 — ANTHROPIC_API_KEY 확인해라`,
      cause: error,
    });
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new IntegrationError({
      code: "RATE_LIMITED",
      provider: "claude",
      message: `${action}: rate limit`,
      cause: error,
    });
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new IntegrationError({
      code: "TIMEOUT",
      provider: "claude",
      message: `${action}: 타임아웃`,
      cause: error,
    });
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new IntegrationError({
      code: "NETWORK_ERROR",
      provider: "claude",
      message: `${action}: 연결 실패`,
      cause: error,
    });
  }
  if (error instanceof Anthropic.APIError) {
    return new IntegrationError({
      code: codeFromHttpStatus(error.status ?? 500),
      provider: "claude",
      message: `${action}: HTTP ${error.status ?? "?"} ${error.message}`,
      cause: error,
    });
  }
  return new IntegrationError({
    code: "UNKNOWN",
    provider: "claude",
    message: `${action}: ${error instanceof Error ? error.message : String(error)}`,
    cause: error,
  });
}

/** tool_choice로 강제한 tool_use 블록의 input을 뽑아, 없으면 INVALID_RESPONSE로 던진다. */
function extractToolInput(message: Anthropic.Message, toolName: string, action: string): unknown {
  const block = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === toolName,
  );
  if (!block) {
    throw new IntegrationError({
      code: "INVALID_RESPONSE",
      provider: "claude",
      message: `${action}: 모델이 "${toolName}" tool을 호출하지 않음 (stop_reason: ${message.stop_reason})`,
    });
  }
  return block.input;
}

function parseWithZod<T>(schema: z.ZodType<T>, input: unknown, action: string): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new IntegrationError({
      code: "INVALID_RESPONSE",
      provider: "claude",
      message: `${action}: 응답 스키마 검증 실패 — ${result.error.message}`,
    });
  }
  return result.data;
}

// --- 가사 해석 (P1-S3-T2) ---

const translationSchema = z.object({
  koreanTranslation: z.string().min(1),
  translationNotes: z.string().nullable(),
});

const TRANSLATE_LYRICS_TOOL: Anthropic.Tool = {
  name: "provide_translation",
  description: "흑인영가/가스펠 가사의 한국어 번역과 해설 노트를 제출한다.",
  input_schema: {
    type: "object",
    properties: {
      koreanTranslation: {
        type: "string",
        description:
          "가사 전체를 자연스럽고 시적인 한국어로 의역한 번역. 원문의 절/후렴 구조를 그대로 유지한다(줄바꿈 보존).",
      },
      translationNotes: {
        type: ["string", "null"],
        description:
          "신학적·역사적 맥락 설명, 직역이 의역과 크게 다른 핵심 구절의 직역 병기, 흑인영가 특유의 이중적 의미(예: 탈출·자유에 대한 은유) 등. 특별히 설명할 게 없으면 null.",
      },
    },
    required: ["koreanTranslation", "translationNotes"],
  },
};

const TRANSLATE_SYSTEM_PROMPT = `당신은 흑인영가(Negro Spiritual)·블랙 가스펠 음악을 한국 독자에게 소개하는 전문 번역가 겸 신학·역사 연구자다.
가사를 번역할 때 다음을 지킨다:
- 원문의 절/후렴 구조와 줄바꿈을 그대로 유지한 자연스러운 한국어 의역을 만든다. 직역투(번역체)를 피하고, 노래로 불릴 수 있을 만큼 시적으로 다듬는다.
- 흑인영가는 표면적 가사 아래 노예 해방·탈출·자유에 대한 은유가 담긴 경우가 많다(예: "Wade in the Water"의 물, "Go Down Moses"의 출애굽). 이런 이중적 의미가 있으면 translationNotes에 설명한다.
- 성경 인용/암시가 있으면 정확한 출처를 밝힌다. 확실하지 않은 신학적 해석은 단정하지 말고 "~로 해석되기도 한다"처럼 표현한다.
- 원문에 없는 내용을 지어내지 않는다.`;

// --- 곡 소개 + 역사적 맥락 + 성경구절 연계 (P1-S3-T3, T4) ---

const songInfoSchema = z.object({
  descriptionKo: z.string().min(1),
  historicalContextKo: z.string().min(1),
  scriptureReference: z.string().nullable(),
});

const SONG_INFO_TOOL: Anthropic.Tool = {
  name: "provide_song_info",
  description: "곡 소개, 역사적 맥락, (있다면) 성경구절 연계를 제출한다.",
  input_schema: {
    type: "object",
    properties: {
      descriptionKo: {
        type: "string",
        description: "이 곡을 처음 접하는 사람을 위한 짧은 소개(2~4문장). 장르적 특징, 곡의 주제를 다룬다.",
      },
      historicalContextKo: {
        type: "string",
        description:
          "곡이 만들어지고 불린 역사적 배경(노예제 시대, 민권운동 등과의 연관, 알려진 유래나 채보 경위 등). 확실하지 않은 사실은 단정하지 않는다.",
      },
      scriptureReference: {
        type: ["string", "null"],
        description:
          "가사가 직접 인용/암시하는 성경 구절이 명확히 있으면 '책 장:절' 형식으로(예: '출애굽기 8:1'). 없거나 불확실하면 null — 억지로 연결하지 않는다.",
      },
    },
    required: ["descriptionKo", "historicalContextKo", "scriptureReference"],
  },
};

const SONG_INFO_SYSTEM_PROMPT = `당신은 흑인영가·블랙 가스펠 음악사를 연구하는 한국어 해설가다.
곡 소개와 역사적 맥락을 쓸 때 다음을 지킨다:
- 검증되지 않은 사실을 단정적으로 서술하지 않는다. 불확실하면 "~로 전해진다", "~라는 설이 있다"처럼 표현한다.
- 노예제·인종차별의 역사적 고통을 다루는 만큼, 선정적이지 않고 존중하는 어조를 유지한다.
- 성경구절 연계는 가사에 실제로 근거가 있을 때만 채운다 — 없으면 null로 둔다.`;

export function createClaudeProvider(config: ClaudeConfig): TranslationProvider {
  const client = new Anthropic({ apiKey: config.apiKey, fetch: config.fetch });

  return {
    name: "claude",

    async translateLyrics(input: TranslateLyricsInput): Promise<TranslateLyricsResult> {
      let message: Anthropic.Message;
      try {
        message = await client.messages.create({
          model: MODEL_ID,
          max_tokens: 8192,
          system: TRANSLATE_SYSTEM_PROMPT,
          tools: [TRANSLATE_LYRICS_TOOL],
          tool_choice: { type: "tool", name: TRANSLATE_LYRICS_TOOL.name },
          messages: [
            {
              role: "user",
              content: `곡: "${input.songTitle}" — ${input.artist}\n\n원문 가사:\n${input.originalText}`,
            },
          ],
        });
      } catch (error) {
        throw toIntegrationError(error, "translateLyrics");
      }

      const rawInput = extractToolInput(message, TRANSLATE_LYRICS_TOOL.name, "translateLyrics");
      const parsed = parseWithZod(translationSchema, rawInput, "translateLyrics");

      return { ...parsed, modelUsed: modelUsed() };
    },

    async generateSongInfo(input: GenerateSongInfoInput): Promise<GenerateSongInfoResult> {
      let message: Anthropic.Message;
      try {
        message = await client.messages.create({
          model: MODEL_ID,
          max_tokens: 8192,
          system: SONG_INFO_SYSTEM_PROMPT,
          tools: [SONG_INFO_TOOL],
          tool_choice: { type: "tool", name: SONG_INFO_TOOL.name },
          messages: [
            {
              role: "user",
              content: `곡: "${input.songTitle}" — ${input.artist}\n\n원문 가사:\n${input.originalLyrics}`,
            },
          ],
        });
      } catch (error) {
        throw toIntegrationError(error, "generateSongInfo");
      }

      const rawInput = extractToolInput(message, SONG_INFO_TOOL.name, "generateSongInfo");
      const parsed = parseWithZod(songInfoSchema, rawInput, "generateSongInfo");

      return { ...parsed, modelUsed: modelUsed() };
    },
  };
}
