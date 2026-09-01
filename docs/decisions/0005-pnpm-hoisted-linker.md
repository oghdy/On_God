# ADR-0005 — pnpm `node-linker=hoisted` (Expo/Metro 호환)

- 상태: 채택(Accepted)
- 일자: 2026-09-01
- 관련: [handoff 2026-09-01 frontend → backend](../logs/handoff.md), [frontend-log P2-S1-T1~T6](../logs/frontend-log.md)

## 배경

`apps/mobile`에서 `expo start`를 처음 실행하자 `Cannot find module 'metro/src/lib/TerminalReporter'`,
이어서 `Cannot find module '@babel/runtime/helpers/interopRequireDefault'`가 발생했다.

원인: `@expo/cli`와 Metro가 내부적으로 `metro/...`, `@babel/runtime/...` 같은 깊은 경로를
**프로젝트(`apps/mobile`) 기준으로 직접 `require()`** 한다. 이 패키지들은 `apps/mobile`의
직접 의존성이 아니라 `expo` → `@expo/metro-config` → `metro`처럼 여러 단계 아래 있는
transitive 의존성이라, pnpm 기본(isolated) 레이아웃에서는 `apps/mobile/node_modules`에서
보이지 않는다(phantom dependency 방지가 pnpm의 기본 설계 목적이라 의도된 동작).

## 결정

루트 `.npmrc`에 `node-linker=hoisted`를 설정한다. Expo 공식 pnpm 모노레포 가이드가
권장하는 설정과 동일하다.

## 근거

| 기준 | hoisted 링커(채택) | `public-hoist-pattern` 패턴 나열 |
|------|--------------------|-----------------------------------|
| 근본 해결 | 앞으로 나올 다른 Expo/RN 네이티브 모듈(reanimated, gesture-handler 등)도 동일 문제를 안 겪음 | 새 패키지가 같은 문제를 일으킬 때마다 패턴 추가 필요(실제로 `metro`→`@babel/runtime` 순으로 두 번 겪음) |
| 공식 지원 | Expo 문서가 명시적으로 권장 | 임시방편에 가까움 |
| 트레이드오프 | pnpm의 phantom dependency 방지 이점을 저장소 전체에서 포기 | 부분적으로는 유지 |

`apps/admin`(Next.js)은 자체 번들러(웹팩/터보팩)를 쓰고 이런 딥 리퀴이어 패턴이 없어
영향이 적을 것으로 예상했고, 변경 후 `pnpm turbo run typecheck lint test`(admin 포함
7개 워크스페이스 전체)가 모두 통과함을 확인했다.

## 영향

- 저장소 전체 `node_modules`가 hoisted(flat) 레이아웃으로 바뀐다 — pnpm의 엄격한 격리가
  느슨해지므로, 이론적으로는 `package.json`에 선언 안 한 패키지를 실수로 import해도
  즉시 에러가 나지 않을 수 있다. CI의 `pnpm install` + `lint`/`typecheck`가 이런 phantom
  import를 어느 정도 잡아줄 것으로 기대하지만, 완전한 방지는 아니다.
- `apps/mobile`의 `react-native`도 이 작업 중 `0.76.5` → `0.76.9`로 올렸다
  (`expo install --fix`가 SDK 52 호환 버전으로 정렬 — Expo Go의 dev 에러 오버레이가
  patch 버전 스큐에서 깨지는 별개 버그도 같이 해결됨).
- 이후 `pnpm install`은 `node_modules`를 완전히 새로 깐다(캐시 재사용은 되지만 레이아웃이
  바뀜) — CI 캐시 키가 `node-linker` 설정을 반영 못 하면 첫 CI 실행이 느려질 수 있음.
