import { describe, expect, it } from "vitest";

import { codeFromHttpStatus, IntegrationError } from "./errors";

describe("codeFromHttpStatus", () => {
  it.each([
    [401, "UNAUTHORIZED"],
    [403, "UNAUTHORIZED"],
    [404, "NOT_FOUND"],
    [429, "RATE_LIMITED"],
    [500, "NETWORK_ERROR"],
    [503, "NETWORK_ERROR"],
    [418, "UNKNOWN"],
  ] as const)("%i -> %s", (status, expected) => {
    expect(codeFromHttpStatus(status)).toBe(expected);
  });
});

describe("IntegrationError", () => {
  it("TIMEOUT/RATE_LIMITED/NETWORK_ERROR는 기본적으로 재시도 가능하다", () => {
    for (const code of ["TIMEOUT", "RATE_LIMITED", "NETWORK_ERROR"] as const) {
      expect(new IntegrationError({ code, provider: "test", message: "x" }).retryable).toBe(true);
    }
  });

  it("NOT_FOUND/UNAUTHORIZED/INVALID_RESPONSE/UNKNOWN은 기본적으로 재시도 불가능하다", () => {
    for (const code of ["NOT_FOUND", "UNAUTHORIZED", "INVALID_RESPONSE", "UNKNOWN"] as const) {
      expect(new IntegrationError({ code, provider: "test", message: "x" }).retryable).toBe(false);
    }
  });

  it("retryable을 명시하면 기본 추론값을 덮어쓴다", () => {
    expect(
      new IntegrationError({ code: "NOT_FOUND", provider: "test", message: "x", retryable: true })
        .retryable,
    ).toBe(true);
  });

  it("메시지에 provider와 code를 포함한다", () => {
    const error = new IntegrationError({ code: "TIMEOUT", provider: "genius", message: "slow" });
    expect(error.message).toBe("[genius] TIMEOUT: slow");
  });
});
