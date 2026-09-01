# Frontend 작업 로그

> 프론트엔드 트랙(모바일 앱/Expo/UI/위젯 클라이언트 측)에서 진행한 작업을
> **시간순으로 append**한다. 가장 최근 항목이 맨 아래에 오도록 계속 추가한다.
> 이 파일은 절대 과거 항목을 지우거나 고쳐 쓰지 않는다 — 기록이 곧 역사다.

## 작성 규칙

- Task 하나를 완료할 때마다 아래 템플릿으로 항목 하나를 추가한다.
- 완료 후 해당 Task의 `docs/phase-N-*.md` 체크박스를 `[x]`로 바꾸고 이 항목 앵커를 링크한다.
- 다른 트랙(백엔드)에 영향을 주는 변경이면 반드시 [`handoff.md`](./handoff.md)에도 남긴다.
- 되돌리기 어려운 구조적 결정을 내렸다면 `docs/decisions/000N-*.md`로 ADR을 추가한다.

## 템플릿

```markdown
## YYYY-MM-DD · P#-S#-T# — 한 줄 제목

**Task**: [P#-S#-T#](../phase-N-*.md#관련-섹션)
**한 일**: 무엇을 구현/변경했는지
**왜 이렇게**: 선택한 방식과 이유 (대안이 있었다면 간단히)
**변경 파일**: `apps/mobile/...`, `packages/ui-tokens/...`
**검증**: 어떻게 확인했는지 (시뮬레이터 확인, 테스트 명령 등)
**막힌 점 / 다음 할 일**: 있으면 기록, 없으면 생략
```

---

<!-- 아래에 새 로그 항목을 계속 추가한다 -->

## 2026-09-01 · P2-S1-T1~T6 — Expo Router 골격 + Supabase 연결 + 데이터 레이어

**Task**: [P2-S1](../phase-2-core-app.md#s1-앱-기반)
**한 일**:
- P2-S1-T1: Expo Router 골격 (`app/_layout.tsx`, `app/index.tsx`). 기존 bare 템플릿(`App.tsx`/`index.ts`) 제거, `package.json`의 `main`을 `expo-router/entry`로 교체. `app.json`에 `scheme: "ongod"` 추가(딥링크/OAuth 리다이렉트에 P2-S5/S6에서 필요).
- P2-S1-T2: `apps/mobile/lib/supabase/client.ts` — `@ongod/db`의 `createAnonClient` 재사용. RN에 `localStorage`가 없어서 세션 저장소로 `AsyncStorage`를 주입해야 했는데, 기존 시그니처가 옵션을 안 받아서 `packages/db`의 `createAnonClient`에 선택적 `options.storage`를 추가함(하위호환, admin 영향 없음 — [handoff](./handoff.md) 참고). env 검증은 `apps/mobile/lib/env.ts`에서 admin의 `lib/env.ts` 패턴을 그대로 따름(zod, `EXPO_PUBLIC_*`만).
- P2-S1-T3: TanStack Query. `lib/query/client.ts`(QueryClient), `lib/query/keys.ts`(쿼리 키 팩토리).
- P2-S1-T4: 도메인 훅 `hooks/useTodayPick.ts`(`daily_picks` + `songs` 조인, KST 오늘 날짜 + `status=published` 필터), `hooks/useSongLyrics.ts`.
- P2-S1-T5: `components/state/{LoadingView,ErrorView,EmptyView}.tsx` — 최소 상태 컴포넌트. 스타일은 placeholder(P2-S2에서 `packages/ui-tokens`로 교체 예정)라고 주석에 명시해둠.
- P2-S1-T6: 오프라인 캐시. 직접 캐시 로직을 짜는 대신 `@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister`로 쿼리 캐시 전체를 AsyncStorage에 영속화(`lib/query/persister.ts`, `app/_layout.tsx`의 `PersistQueryClientProvider`). `gcTime`(24시간)이 지나면 자동 폐기.
**왜 이렇게**:
- T6는 "마지막 곡만 수동으로 캐싱"하는 커스텀 로직 대신 TanStack Query 공식 persister를 씀 — 쿼리 캐시 전체(오늘의 곡 + 가사)가 한 메커니즘으로 영속화되고, staleTime/gcTime 정책과 자연히 맞물림. 커스텀 캐시 계층을 따로 만들 필요가 없어짐.
- 경로 별칭(`@/`)은 Metro의 tsconfig-paths 지원 여부를 이 환경에서 100% 확인할 방법이 없어(오프라인 대신 dev 서버로 직접 검증) 전부 상대 경로로 씀. 나중에 별칭이 필요해지면 명시적으로 `metro.config.js`에서 설정할 것.
- `app/index.tsx`는 실제 Daily Card UI가 아니라 곡 제목/아티스트만 보여주는 최소 화면 — Supabase→Query→훅 파이프라인이 실제로 동작하는지 검증하는 용도. 실제 카드 UI는 P2-S3.
**변경 파일**: `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`, `apps/mobile/lib/env.ts`, `apps/mobile/lib/supabase/client.ts`, `apps/mobile/lib/query/{client,keys,persister}.ts`, `apps/mobile/hooks/{useTodayPick,useSongLyrics}.ts`, `apps/mobile/components/state/{LoadingView,ErrorView,EmptyView}.tsx`, `apps/mobile/babel.config.js`(신규), `apps/mobile/app.json`, `apps/mobile/package.json`, `apps/mobile/.env`/`.env.example`(신규, `.env`는 gitignore됨), `packages/db/src/client.ts`(`createAnonClient` 옵션 확장), 루트 `.npmrc`(신규, [ADR-0005](../decisions/0005-pnpm-hoisted-linker.md))
**검증**:
- `pnpm turbo run typecheck lint test` — 저장소 전체(admin 포함) 16개 태스크 통과.
- 실제 iOS 시뮬레이터(iPhone 16 Pro, Expo Go)에서 `expo start --ios`로 실행 확인. dev DB 연결 → `useTodayPick` 쿼리 실행 → 오늘(2026-09-01 KST) 발행된 픽이 없어서 `EmptyView`("오늘의 곡이 아직 준비되지 않았어요") 정상 렌더링됨 — dev DB의 유일한 published pick은 `pick_date=2026-08-29`라 정상적인 결과(버그 아님).
- happy path(픽이 있을 때 렌더링)는 동일 쿼리를 `pick_date='2026-08-29'`로 직접 실행해서 별도 검증 — `daily_picks`+`songs` 조인과 매퍼가 실제 데이터("Go Down Moses" / Traditional)를 정확히 반환함을 확인. 오늘 날짜에 맞는 published pick이 없어 앱 화면으로 이 경로까지 직접 보진 못했음 — P2-S3에서 실제 카드 UI 만들 때 다시 확인 필요.
**막힌 점 / 다음 할 일**:
- `expo start`가 pnpm 기본 레이아웃에서 `metro`/`@babel/runtime`을 못 찾는 문제를 겪음 → [ADR-0005](../decisions/0005-pnpm-hoisted-linker.md)로 `node-linker=hoisted` 채택, 전체 재설치로 해결.
- `react-native`가 SDK 52 기대 버전(`0.76.9`)과 안 맞아서(`0.76.5`) Expo Go의 dev 에러 오버레이 자체가 렌더링 실패하는 별개 버그를 유발함 — `expo install --fix`로 버전 정렬해서 해결.
- Expo Go에 `exp://<LAN IP>:8081`로 자동 연결이 안 돼서(이 샌드박스 환경의 LAN IP가 시뮬레이터 네트워크 네임스페이스에서 라우팅 안 되는 듯) `exp://127.0.0.1:8081`로 수동 재연결함 — 로컬 개발 환경 특성일 수 있어 사람이 실제 macOS에서 돌릴 때는 재현 안 될 수도 있음.
- 다음 Task는 P2-S2(디자인 시스템, `packages/ui-tokens` 신규 생성).

## 2026-09-01 · P2-S2-T1~T4 — 디자인 토큰(`packages/ui-tokens`) + 기초 컴포넌트 + 폰트/아이콘

**Task**: [P2-S2](../phase-2-core-app.md#s2-디자인-시스템)
**한 일**:
- P2-S2-T1: `packages/ui-tokens` 신규 워크스페이스 패키지 생성(`packages/core`와 동일 구조 — tsconfig/eslint는 `@ongod/config` 확장, vitest로 테스트). SRS 4.1 "다크모드 기본 지원"에 맞춰 `colors.dark` 팔레트(배경/표면/텍스트/accent 등 semantic 키)를 채웠다. 라이트 테마는 MVP 범위 밖이라 안 만들었지만, 값이 아니라 역할 이름으로 키를 지어놔서 나중에 `colors.light`를 같은 구조로 추가하면 됨. 타이포그래피 스케일(`fontSize`/`lineHeight`/`fontFamily`), 스페이싱(4px 기준), radius 스케일도 같이 정의.
- P2-S2-T2: `apps/mobile/components/ui/{Text,Button,Card,Tab,Skeleton}.tsx` — 토큰을 소비하는 기초 컴포넌트. `apps/mobile/lib/theme.ts`에서 `colors.dark` 하나만 참조하게 해서, 나중에 라이트 테마 붙일 때 이 파일 하나만 동적으로 바꾸면 되도록 함(컴포넌트들은 전부 `theme`만 import).
- P2-S2-T3: `packages/ui-tokens/src/streaming.ts` — Apple Music(흰 배경/검정 글자, 공식 흑백 배지 스타일), Spotify(#1DB954), YouTube(#FF0000) 브랜드 컬러. `Button`이 `backgroundColor`/`foregroundColor` override를 받게 만들어서 P2-S5에서 그대로 꽂아 쓸 수 있게 해둠.
- P2-S2-T4: 무료 Google Fonts로 처리(유료 폰트 필요하면 알려달라고 phase 문서에 남김) — 본문/UI는 Inter, 곡명 등 디스플레이는 Fraunces(`@expo-google-fonts/inter`, `@expo-google-fonts/fraunces`, `expo-font`). `apps/mobile/lib/fonts.ts`에서 로딩, `app/_layout.tsx`에서 `expo-splash-screen`으로 폰트 로딩 끝날 때까지 스플래시 유지. 아이콘은 Expo 기본 번들인 `@expo/vector-icons`를 명시적 의존성으로 추가만 해둠(아직 실제로 쓰는 화면이 없어서 — 첫 아이콘 필요해지는 Task에서 세트 고를 것).
**왜 이렇게**:
- 토큰(`packages/ui-tokens`, 프레임워크 무관 plain 값)과 컴포넌트(`apps/mobile/components/ui`, RN 전용)를 분리함 — 아키텍처 원칙(`앱은 packages를 쓰고 역은 금지`)과, Phase 3 네이티브 위젯(WidgetKit/Glance)이 RN 컴포넌트는 못 쓰지만 색상 값(hex)은 그대로 재사용할 수 있어야 하기 때문.
- 커스텀 폰트는 RN에서 굵기별로 별도 family가 되므로(`fontWeight` CSS 프로퍼티가 커스텀 폰트에 안 먹음), 토큰에 `Inter_600SemiBold`처럼 실제 로드할 family 이름을 그대로 박아뒀다 — `apps/mobile/lib/fonts.ts`의 `useFonts` 인자와 정확히 일치해야 함.
- 다크 테마 하나만 있는 지금 시점에 `ThemeProvider`/컨텍스트를 미리 만들지 않음(YAGNI) — `lib/theme.ts`가 단일 진입점이라 필요해지면 그 파일만 동적으로 바꾸면 됨.
**변경 파일**: `packages/ui-tokens/**`(신규), `apps/mobile/components/ui/**`(신규), `apps/mobile/lib/{theme,fonts}.ts`(신규), `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`, `apps/mobile/components/state/{LoadingView,ErrorView,EmptyView}.tsx`(토큰/컴포넌트로 교체), `apps/mobile/app.json`(`expo-font` 플러그인 자동 추가), `apps/mobile/package.json`
**검증**:
- `pnpm turbo run typecheck lint test` — 저장소 전체(신규 `@ongod/ui-tokens` 포함) 19개 태스크 통과.
- `packages/ui-tokens/src/colors.test.ts` — 모든 색상 값이 6자리 hex인지, 스트리밍 브랜드 3개가 다 정의됐는지 검증.
- iOS 시뮬레이터에서 재검증: 다크 배경(`theme.background`)이 실제로 적용됐고, `EmptyView`가 새 `Text` 컴포넌트로 정상 렌더링됨을 확인. 폰트 로딩은 에러 로그 없이 통과(=`useAppFonts`가 성공적으로 resolve돼 스플래시가 정상적으로 내려감).
- 실제 디스플레이 폰트(Fraunces)가 곡 제목에 적용된 모습은 오늘 발행된 픽이 없어(S1 로그 참고) 아직 못 봤음 — P2-S3에서 확인 필요.
**막힌 점 / 다음 할 일**:
- Metro dev 서버가 새로 설치한 패키지를 Fast Refresh로 못 잡아서(예전 세션 캐시) `expo start --clear`로 재시작해야 했음 — 새 워크스페이스 패키지/의존성 추가할 때마다 반복될 수 있는 패턴이니 참고.
- 다음 Task는 P2-S3(Daily Card 화면) — 여기서 처음으로 이번 토큰/컴포넌트가 실제 화면에 제대로 쓰이는지 검증됨.
