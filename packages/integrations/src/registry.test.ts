import { describe, expect, it } from "vitest";

import { IntegrationError } from "./errors";
import { createProviderRegistry } from "./registry";
import type { NamedProvider } from "./providers";

interface FakeProvider extends NamedProvider {
  ping(): string;
}

function fakeProvider(name: string): FakeProvider {
  return { name, ping: () => `pong from ${name}` };
}

describe("createProviderRegistry", () => {
  it("이름으로 등록된 provider를 찾는다", () => {
    const registry = createProviderRegistry([fakeProvider("a"), fakeProvider("b")]);
    expect(registry.get("a").ping()).toBe("pong from a");
    expect(registry.get("b").ping()).toBe("pong from b");
  });

  it("list()는 등록된 이름을 전부 반환한다", () => {
    const registry = createProviderRegistry([fakeProvider("a"), fakeProvider("b")]);
    expect(registry.list()).toEqual(["a", "b"]);
  });

  it("등록 안 된 이름을 찾으면 재시도 불가능한 NOT_FOUND IntegrationError를 던진다", () => {
    const registry = createProviderRegistry([fakeProvider("a")]);
    try {
      registry.get("missing");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(IntegrationError);
      const integrationError = error as IntegrationError;
      expect(integrationError.code).toBe("NOT_FOUND");
      expect(integrationError.retryable).toBe(false);
    }
  });
});
