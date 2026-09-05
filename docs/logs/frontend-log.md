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

## 2026-09-01 · P2-S3-T1~T5 — Daily Card 화면

**Task**: [P2-S3](../phase-2-core-app.md#s3-daily-card-화면-srs-31-p0)
**한 일**:
- P2-S3-T1/T2: `apps/mobile/components/daily-card/DailyCard.tsx` — 풀스크린 앨범커버 + 곡명(Fraunces 디스플레이 폰트)·아티스트·발매연도(있을 때만) + `song_info.description_ko` 소개 텍스트. `expo-linear-gradient`로 하단에 그라디언트를 깔아 텍스트 가독성 확보(SRS 4.1 "Spotify Now Playing 참고 몰입형 레이아웃").
- P2-S3-T3: `expo-image`로 앨범 커버 로딩 — `placeholder`에 `album_cover_thumbnail_url`(위젯용 축소판, ADR-0003)을 지정해 블러업 효과, `contentFit="cover"` + `transition={300}`. 앨범커버 자체가 없는 곡(Apple Music 키 미발급— handoff 참고)은 `Ionicons`(`@expo/vector-icons`, 이번에 처음 실사용 — 아이콘 세트로 Ionicons 채택) 음표 아이콘 placeholder로 대체.
- P2-S3-T4: `hooks/useRecentPicks.ts` 신규 — 오늘 이하 날짜의 발행된 픽을 최신순으로 최대 14개 조회(`daily_picks`+`songs`+`song_info` 중첩 조인). `app/index.tsx`를 가로 `FlatList`(`pagingEnabled`) 페이저로 재작성해서 스와이프로 최근 곡까지 넘겨볼 수 있게 함(MVP 범위 — 날짜 아카이브 달력 뷰는 P1).
- P2-S3-T5: 최신 픽의 `pick_date`가 오늘(KST)이 아니면(=오늘 픽 없음) 페이저 맨 앞에 `EmptyView` 안내 카드를 끼워 넣는다 — 에러가 아니라 "아직 없음"이고, 스와이프하면 최근 곡은 계속 볼 수 있음.
- `daily_picks`+`songs`+`song_info` 조인·매핑 로직을 `lib/supabase/mapPick.ts`로 추출해 `useTodayPick`(P2-S1-T4)과 `useRecentPicks`가 공유하게 함. `useTodayPick`도 이 참에 `song_info`까지 같이 가져오도록 쿼리를 넓힘.
**왜 이렇게**:
- Daily Card 화면은 스와이프 브라우징이 필요해서 `useTodayPick`(오늘 하나만) 대신 `useRecentPicks`(목록)를 씀. `useTodayPick`은 지우지 않고 남겨둠 — Phase 3 위젯처럼 "오늘 픽 하나만" 필요한 곳에서 목록 전체를 안 가져와도 되는 더 가벼운 선택지로 유효함.
- 스와이프는 별도 라이브러리(`react-native-pager-view`, `reanimated` 등) 없이 RN 내장 `FlatList`의 `pagingEnabled`만 사용 — MVP 범위(최근 곡까지, 제스처 튜닝 불필요)에는 이걸로 충분해서 의존성을 안 늘림.
- 블러업 placeholder는 새 이미지 생성 없이 이미 있는 `album_cover_thumbnail_url`(위젯용으로 이미 만들어 둔 축소판)을 재사용 — 별도 blurhash 계산이나 컬럼 추가가 필요 없었음.
**변경 파일**: `apps/mobile/components/daily-card/DailyCard.tsx`(신규), `apps/mobile/hooks/useRecentPicks.ts`(신규), `apps/mobile/hooks/useTodayPick.ts`(song_info 포함하도록 확장), `apps/mobile/lib/supabase/mapPick.ts`(신규, 공유 매퍼), `apps/mobile/lib/query/keys.ts`(`dailyPick.recent` 키 추가), `apps/mobile/app/index.tsx`(페이저로 재작성), `apps/mobile/package.json`(`expo-image`, `expo-linear-gradient`, `@expo/vector-icons`)
**검증**:
- `pnpm turbo run typecheck lint test` — 저장소 전체 19개 태스크 통과.
- iOS 시뮬레이터(iPhone 16 Pro Max, Expo Go)에서 실제 확인: 오늘(9/1 KST) 픽이 없어 첫 페이지는 `EmptyView`("오늘의 곡이 아직 준비되지 않았어요") 정상 표시 → 왼쪽으로 스와이프하면 dev DB의 실제 발행 픽("Go Down Moses" / Traditional, `pick_date=2026-08-29`)이 뜨는 것까지 확인. 앨범커버가 없어(Apple Music 키 미발급) 음표 아이콘 placeholder가 대신 나오고, `song_info.description_ko`의 실제 AI 생성 한국어 소개 텍스트가 그대로 렌더링됨. 마지막 페이지에서 한 번 더 스와이프해도 크래시 없이 그대로 멈춤(리스트 끝), 반대 방향 스와이프로 되돌아가는 것도 확인.
- 실제 앨범 이미지가 있는 곡에서 블러업 placeholder→풀이미지 전환이 눈에 보이는 모습은 아직 검증 못함(dev DB에 앨범커버 있는 발행 픽이 아직 없음) — Apple Music 키 발급되고 앨범커버 있는 곡이 발행되면 재확인 필요.
**막힌 점 / 다음 할 일**:
- 시뮬레이터가 세션 중간에 재부팅되어(iPhone 16 Pro → iPhone 16 Pro Max로 바뀜) 실기기 Apple 계정 확인 팝업이 떴음 — 사용자 실제 Apple ID 관련이라 손대지 않고 "지금 안 함"으로만 넘겼음(앱 동작과 무관).
- 다음 Task는 P2-S4(가사 뷰어) — `useSongLyrics`(P2-S1-T4에서 이미 만듦)를 처음 화면에 연결하게 됨.

## 2026-09-01 · P2-S4-T1~T5 — 가사 뷰어

**Task**: [P2-S4](../phase-2-core-app.md#s4-가사-뷰어-srs-31-p0)
**한 일**:
- 신규 라우트 `app/lyrics/[songId].tsx` 추가. `DailyCard`의 "가사 보기" 버튼(`Pressable` + `useRouter().push()`)에서 진입한다.
- P2-S4-T1: `Tab`(P2-S2에서 만든 컴포넌트) 재사용해 원문/해석 전환. 로컬 `useState`로 탭 상태 관리.
- P2-S4-T2: 뒤로가기 버튼 + 앨범 썸네일(`album_cover_thumbnail_url`, 없으면 음표 아이콘) + 곡명을 스크롤 안 되는 헤더 View로 분리하고, 가사 본문만 `ScrollView`에 넣어 스크롤해도 헤더가 고정되게 함.
- P2-S4-T3: `lyrics.translationNotes`를 "해석" 탭에서만, "번역 노트" 캡션 라벨과 함께 본문 아래 표시.
- P2-S4-T4(SRS 4.3): `lyrics.sourceUrl`에서 호스트명만 추출(`new URL(...).hostname`)해 "가사 출처: genius.com" 형태로 표시, 탭하면 `Linking.openURL`로 원문 열람 가능. 두 탭 모두에서 항상 노출(저작권 표기는 탭과 무관하게 필요).
- P2-S4-T5: 성능은 별도 가상화 없이 기본 `ScrollView` + 단일 `Text`로 처리(가사가 리스트가 아니라 연속 텍스트라 `FlatList` 가상화가 필요한 상황이 아님 — 과한 최적화 안 함). 빈 상태는 3단계로 구분: (1) `lyrics` row 자체가 없음 → "가사가 아직 준비되지 않았어요" 전체 화면 안내, (2) row는 있지만 현재 탭 필드(원문 또는 해석)만 없음 → 탭 안에서 "원문 가사가 아직 없어요"/"한국어 해석이 아직 없어요", (3) 곡 자체를 못 찾음(`useSong`이 null) → "곡 정보를 찾을 수 없어요".
- 곡 메타(제목·아티스트·썸네일)만 필요한 화면을 위해 `hooks/useSong.ts` 신규 추가.
**왜 이렇게**:
- `DailyCard`에서 이미 곡 전체 데이터를 들고 있지만, 라우트 파라미터로 제목·썸네일 URL 같은 걸 문자열 인코딩해서 넘기는 대신 `useSong(songId)`로 다시 조회하는 쪽을 택함 — 한글 제목·긴 URL을 쿼리 파라미터에 안전하게 인코딩하는 것보다 단순하고, TanStack Query 캐시가 있으면 사실상 즉시 반환되어 비용도 작음.
- 아이콘 세트는 P2-S3에서 이미 채택한 Ionicons를 그대로 씀(뒤로가기 화살표, 썸네일 없을 때 음표).
**변경 파일**: `apps/mobile/app/lyrics/[songId].tsx`(신규), `apps/mobile/hooks/useSong.ts`(신규), `apps/mobile/lib/query/keys.ts`(`song.byId` 키 추가), `apps/mobile/components/daily-card/DailyCard.tsx`(가사 보기 버튼 추가)
**검증**:
- `pnpm turbo run typecheck lint test` — 저장소 전체 19개 태스크 통과.
- iOS 시뮬레이터(iPhone 16 Pro Max, Expo Go)에서 실제 dev DB 데이터("Go Down Moses" 가사, 원문 750자/해석 471자/번역노트 포함)로 end-to-end 확인: 가사 보기 버튼 → 라우트 진입 → 원문 탭 기본 표시 → 스크롤해도 헤더(뒤로가기+썸네일+곡명) 고정됨 확인 → 해석 탭 전환 시 한국어 번역 정상 표시 → 스크롤 끝까지 내리면 "번역 노트" 라벨+본문, 그 아래 "가사 출처: genius.com" 표시 확인 → 뒤로가기로 Daily Card 화면 복귀 확인.
- 빈 가사(주 3단계 케이스)는 dev DB에 해당하는 곡이 없어 코드로만 구현, 실제 화면 확인은 아직 못함 — 다른 곡 데이터가 생기면 재확인 필요.
**막힌 점 / 다음 할 일**:
- 시뮬레이터 좌표계 문제로 한참 헤맴: 이 tool의 스크린샷은 실제로 표시되는 이미지(약 921×2000)와 시뮬레이터 네이티브 해상도(1320×2868, 3배)가 다르고, 탭 좌표는 point 단위(440×956, 네이티브의 1/3)를 써야 하는데 스크린샷에서 눈대중으로 좌표를 읽어 변환하다 보니 버튼 위치를 두 번이나 잘못 짚었음. 결국 `xcrun simctl io booted screenshot`으로 직접 네이티브 스크린샷을 뽑고 Python으로 버튼의 정확한 픽셀 bounding box를 찾아서 좌표를 계산하니 맞았음. 그 와중에 "Link가 존재하지 않는다"는 별개의 Fast Refresh 스테일 버그도 만나서(import를 제거했는데 이전 모듈 그래프가 안 지워짐) `expo start --clear`로 완전 재시작이 필요했음 — 둘 다 이번 세션 한정 디버깅 이슈였고 코드 결함은 아님.
- 다음 Task는 P2-S5(스트리밍 딥링크) — `packages/ui-tokens`의 `streaming` 브랜드 컬러(P2-S2-T3)를 처음 실제로 쓰게 됨.
