# Handoff — 트랙 간 영향 전파

> 백엔드 ↔ 프론트엔드처럼 **한 트랙의 변경이 다른 트랙의 작업에 영향을 줄 때만** 여기에 남긴다.
> 일반 작업 기록은 여기가 아니라 [`backend-log.md`](./backend-log.md) / [`frontend-log.md`](./frontend-log.md)에 쓴다.
>
> **모든 세션은 작업 시작 전 이 파일을 반드시 먼저 읽는다.** 미해결(`[ ]`) 항목 중
> 자기 트랙 것이 있으면 처리하고 상태를 `[x]`로 바꾼다. 처리한 항목도 지우지 않고 남겨둔다
> (지운 기록은 다음 세션이 "그런 일이 있었는지" 알 방법이 없어진다).

## 작성 규칙

무엇이 handoff 감인지 판단 기준:
- 다른 트랙의 코드/화면/데이터 구조를 수정해야만 하는 변경
- 다른 트랙이 의존하던 API·필드명·타입이 바뀐 경우
- 다른 트랙 작업 순서에 영향을 주는 결정 (예: 이 Task가 끝나야 저쪽이 시작 가능)

## 템플릿

```markdown
## YYYY-MM-DD · {backend|frontend} → {frontend|backend}

**변경**: 무엇이 바뀌었는지
**영향**: 상대 트랙에서 구체적으로 뭘 손봐야 하는지
**관련**: [해당 로그 항목](./backend-log.md#앵커) 또는 [ADR](../decisions/000N-*.md)
**상태**: [ ] 미해결
```

처리 완료 시 `**상태**: [x] 처리완료 — 처리한 세션/날짜` 로 바꾼다.

---

<!-- 아래에 새 handoff 항목을 계속 추가한다 -->

## 2026-08-28 · backend → frontend

**변경**: `apps/mobile` 최소 스캐폴딩 생성 (Expo 52 / React Native 0.76 / React 18.3.1). `App.tsx` + `index.ts` + `app.json`만 있는 껍데기 — 화면/네비게이션/상태관리 등은 전혀 없음. `tsc --noEmit`, `eslint .`는 통과하지만 **네이티브 빌드(Xcode/Android Studio)는 이 세션에서 확인 안 함** (환경에 없음, 실기기 테스트는 🧑 사람 몫).
**영향**: 프론트 세션 시작 시 이 스캐폴딩을 기준으로 진행할지, 처음부터 다시 짤지 판단 필요. `package.json`의 expo/react-native 버전(그리고 `@types/react` `~18.3.12` — react-native peer 요구사항에 맞춘 것) 그대로 쓸지 확인. `apps/mobile/eslint.config.js`·`tsconfig.json`은 `packages/config`(공유 tsconfig/eslint)를 확장하는 구조이니 그 규칙을 따라주면 나중에 CI lint가 깨지지 않음. `packages/ui-tokens`는 아직 없음 — 필요해지면 프론트 트랙에서 만들어도 됨(S1~S6 어디에도 명시된 산출물 아니었음).
**관련**: [backend-log P0-S1-T1~T7](./backend-log.md#2026-08-28--p0-s1-t1t7--모노레포-스캐폴딩pnpm--turborepo--apps--packagesconfig), [packages/README.md](../../packages/README.md)
**상태**: [x] 처리완료 — 프론트 세션, 2026-09-01. Expo Router 골격으로 이 스캐폴딩을 기반으로 계속 진행. `expo`/`react-native` 버전은 유지하되 `react-native`만 `0.76.5`→`0.76.9`로 정렬함(아래 새 handoff 항목 참고). 자세한 내용은 [frontend-log P2-S1-T1~T6](./frontend-log.md#2026-09-01--p2-s1-t1t6--expo-router-골격--supabase-연결--데이터-레이어) 참고.

## 2026-08-28 · backend → frontend

**변경**: `@ongod/core`(도메인 타입: `Song`/`DailyPick`/`Profile` 등, KST 자정 기준 날짜 유틸 `toKstDateString`/`kstMidnightToUtc`/`isSameKstDay`)와 `@ongod/db`(Supabase 클라이언트 팩토리 `createAnonClient`/`createServiceRoleClient`, DB row→도메인 변환 함수)가 생겼다. `apps/mobile`에는 아직 이 패키지들이 의존성으로 추가돼 있지 않음.
**영향**: 앱에서 Supabase 연결하거나 Daily Pick 날짜 계산할 때 새로 만들지 말고 이거 써주면 됨. `apps/mobile/package.json`에 `"@ongod/core": "workspace:*"`, `"@ongod/db": "workspace:*"` 추가해서 쓰면 됨(anon 클라이언트만 필요할 것 — service-role 클라이언트는 서버 전용이니 모바일에서 import하지 말 것). `packages/db/src/types/database.ts`는 Docker 부재로 CLI 자동생성 대신 손으로 마이그레이션 SQL 기준으로 작성됨 — 스키마 관련 타입 이슈 있으면 이 파일부터 의심.
**관련**: [backend-log P0-S3-T1~T5](./backend-log.md#2026-08-28--p0-s3-t1t5--packagesdb--packagescore-도메인-타입공유-유틸)
**상태**: [x] 처리완료 — 프론트 세션, 2026-09-01. `apps/mobile/package.json`에 두 패키지 모두 `workspace:*`로 추가, `useTodayPick`/`useSongLyrics` 훅에서 `fromDailyPickRow`/`fromSongRow`/`fromLyricsRow` 그대로 사용 중. `packages/db`의 `createAnonClient`는 RN에 맞게 소폭 확장함(아래 새 handoff 항목 참고).

## 2026-09-01 · frontend → backend

**변경**: 세 가지.
1. `packages/db/src/client.ts`의 `createAnonClient(url, anonKey)`에 세 번째 인자 `options?: { storage?: SupportedStorage }`를 추가했다(선택적, 기본 동작 불변). RN에는 `localStorage`가 없어서 세션 저장소로 `AsyncStorage`를 주입해야 하는데, 기존 시그니처로는 불가능했음. `apps/admin`은 옵션을 안 넘기므로 기존 동작 그대로다.
2. 루트에 `.npmrc`(`node-linker=hoisted`)를 추가했다 — Expo/Metro가 `metro`, `@babel/runtime` 같은 깊은 transitive 의존성을 프로젝트 기준으로 직접 `require()`해서 pnpm 기본 isolated 레이아웃이 깨졌음. 근거와 트레이드오프는 [ADR-0005](../decisions/0005-pnpm-hoisted-linker.md) 참고.
3. `apps/mobile`의 `react-native`를 `0.76.5`→`0.76.9`로 올렸다(`expo install --fix`가 SDK 52 호환 버전으로 정렬).
**영향**: (1)은 하위호환이라 admin 쪽 코드 변경 불필요. (2)는 저장소 전체 `node_modules` 레이아웃이 바뀌는 변경이라 admin도 영향권 — 변경 후 `pnpm turbo run typecheck lint test`(admin 포함 7개 워크스페이스)가 모두 통과함은 확인했지만, pnpm의 엄격한 격리(phantom dependency 방지)가 전역적으로 느슨해진 것은 알아둬야 함. 다음에 backend 세션이 새 패키지를 설치하다 이상하게 동작하면 이 변경을 의심할 것. CI 캐시 관련 첫 실행이 느려질 수 있음(레이아웃 변경으로 캐시 무효화).
**관련**: [ADR-0005](../decisions/0005-pnpm-hoisted-linker.md), [frontend-log P2-S1-T1~T6](./frontend-log.md#2026-09-01--p2-s1-t1t6--expo-router-골격--supabase-연결--데이터-레이어)
**상태**: [ ] 미해결
