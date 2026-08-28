// P0-S4-T4: 모든 외부 API 어댑터가 던지는 에러를 하나의 형태로 표준화한다.
// 오케스트레이터(Phase 1)가 provider별 에러 shape을 따로 알 필요 없이
// `error.code`/`error.retryable`만으로 부분 실패 처리를 판단할 수 있게 한다.

export type IntegrationErrorCode =
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "INVALID_RESPONSE"
  | "NETWORK_ERROR"
  | "UNKNOWN";

const RETRYABLE_CODES: readonly IntegrationErrorCode[] = [
  "TIMEOUT",
  "RATE_LIMITED",
  "NETWORK_ERROR",
];

export interface IntegrationErrorParams {
  code: IntegrationErrorCode;
  /** 어댑터/provider 이름, 예: "apple-music", "genius". 레지스트리 키와 맞춘다. */
  provider: string;
  message: string;
  /** 재시도해서 나아질 가능성이 있는 에러인지. 생략하면 code로부터 추론한다. */
  retryable?: boolean;
  cause?: unknown;
}

export class IntegrationError extends Error {
  readonly code: IntegrationErrorCode;
  readonly provider: string;
  readonly retryable: boolean;

  constructor(params: IntegrationErrorParams) {
    super(`[${params.provider}] ${params.code}: ${params.message}`);
    this.name = "IntegrationError";
    this.code = params.code;
    this.provider = params.provider;
    this.retryable = params.retryable ?? RETRYABLE_CODES.includes(params.code);
    this.cause = params.cause;
  }
}

/** HTTP status → IntegrationErrorCode 매핑. `http-client.ts`에서 사용. */
export function codeFromHttpStatus(status: number): IntegrationErrorCode {
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 404) return "NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "NETWORK_ERROR";
  return "UNKNOWN";
}
