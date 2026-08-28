// P0-S4-T2: 모든 어댑터가 공유하는 HTTP 클라이언트.
// 재시도(지수 백오프) · 타임아웃(AbortController) · 요청 속도 제한 · 에러 정규화(IntegrationError)를
// 여기서 한 번만 구현하고, 어댑터는 endpoint/응답 파싱만 신경 쓰면 되게 한다.

import { codeFromHttpStatus, IntegrationError } from "./errors";

export interface HttpClientOptions {
  /** 레지스트리 키와 맞추는 provider 이름, 에러 메시지/식별에 쓰인다. */
  provider: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  /** 재시도 간 기본 대기시간(ms). 실제 대기는 `retryDelayMs * 2^attempt`. */
  retryDelayMs?: number;
  headers?: Record<string, string>;
  /** 초당 허용 요청 수. 생략하면 속도 제한을 걸지 않는다. */
  requestsPerSecond?: number;
}

export interface HttpRequestOptions {
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export interface HttpClient {
  request<T>(options: HttpRequestOptions): Promise<T>;
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
  const {
    provider,
    baseUrl,
    timeoutMs = 10_000,
    maxRetries = 2,
    retryDelayMs = 300,
    headers: defaultHeaders,
    requestsPerSecond,
  } = options;

  const throttle = requestsPerSecond ? createRateLimiter(requestsPerSecond) : null;

  async function attemptOnce<T>(url: string, reqOptions: HttpRequestOptions): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const hasBody = reqOptions.body !== undefined;
      const response = await fetch(url, {
        method: reqOptions.method ?? "GET",
        headers: {
          ...defaultHeaders,
          ...reqOptions.headers,
          ...(hasBody ? { "content-type": "application/json" } : {}),
        },
        body: hasBody ? JSON.stringify(reqOptions.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new IntegrationError({
          code: codeFromHttpStatus(response.status),
          provider,
          message: `HTTP ${response.status} ${response.statusText}`,
        });
      }

      try {
        return (await response.json()) as T;
      } catch (parseError) {
        throw new IntegrationError({
          code: "INVALID_RESPONSE",
          provider,
          message: "failed to parse JSON response",
          cause: parseError,
        });
      }
    } finally {
      clearTimeout(timer);
    }
  }

  async function request<T>(reqOptions: HttpRequestOptions): Promise<T> {
    const url = buildUrl(baseUrl, reqOptions.path, reqOptions.query);
    let attempt = 0;
    for (;;) {
      if (throttle) await throttle();
      try {
        return await attemptOnce<T>(url, reqOptions);
      } catch (error) {
        const integrationError = toIntegrationError(error, provider, timeoutMs);
        if (!integrationError.retryable || attempt >= maxRetries) {
          throw integrationError;
        }
        await sleep(retryDelayMs * 2 ** attempt);
        attempt += 1;
      }
    }
  }

  return { request };
}

function toIntegrationError(error: unknown, provider: string, timeoutMs: number): IntegrationError {
  if (error instanceof IntegrationError) return error;
  const isAbort = error instanceof Error && error.name === "AbortError";
  return new IntegrationError({
    code: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
    provider,
    message: isAbort
      ? `request timed out after ${timeoutMs}ms`
      : error instanceof Error
        ? error.message
        : String(error),
    cause: error,
  });
}

function buildUrl(
  baseUrl: string | undefined,
  path: string | undefined,
  query: HttpRequestOptions["query"],
): string {
  const full = path ? `${baseUrl ?? ""}${path}` : (baseUrl ?? "");
  if (!query) return full;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${full}?${qs}` : full;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createRateLimiter(requestsPerSecond: number): () => Promise<void> {
  const intervalMs = 1000 / requestsPerSecond;
  let nextAvailableAt = 0;
  return async () => {
    const now = Date.now();
    const waitMs = Math.max(0, nextAvailableAt - now);
    nextAvailableAt = Math.max(now, nextAvailableAt) + intervalMs;
    if (waitMs > 0) await sleep(waitMs);
  };
}
