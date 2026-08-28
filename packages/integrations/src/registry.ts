// P0-S4-T5: Provider 레지스트리 — 설정(문자열 이름)만으로 구현체를 교체할 수 있게 한다.
// 실제 API 어댑터든 테스트용 스텁이든 `NamedProvider`(= `.name`을 가짐)만 만족하면
// 이 레지스트리에 등록할 수 있다. MetadataProvider/LyricsProvider/TranslationProvider가
// 각자 클래스를 따로 만들 필요 없이 이 제네릭 하나로 셋 다 처리한다.

import { IntegrationError } from "./errors";
import type { NamedProvider } from "./providers";

export interface ProviderRegistry<T extends NamedProvider> {
  get(name: string): T;
  list(): string[];
}

export function createProviderRegistry<T extends NamedProvider>(
  providers: readonly T[],
): ProviderRegistry<T> {
  const byName = new Map(providers.map((provider) => [provider.name, provider] as const));

  return {
    get(name: string): T {
      const provider = byName.get(name);
      if (!provider) {
        throw new IntegrationError({
          code: "NOT_FOUND",
          provider: name,
          message: `provider "${name}" is not registered (registered: ${[...byName.keys()].join(", ") || "none"})`,
          retryable: false,
        });
      }
      return provider;
    },
    list(): string[] {
      return [...byName.keys()];
    },
  };
}
