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

## 2026-09-01 · P2-S5-T1~T4 — 스트리밍 딥링크

**Task**: [P2-S5](../phase-2-core-app.md#s5-스트리밍-딥링크-srs-31-p0)
**한 일**:
- P2-S5-T1: `lib/streaming/deepLink.ts` — 플랫폼별 앱 스킴을 만들고(Apple Music은 `appleMusicUrl`의 `https://`를 `music://`로 치환, Spotify는 `spotify:track:{spotifyId}`, YouTube는 `youtube://watch?v={youtubeId}`), `Linking.canOpenURL`로 앱 설치 여부를 확인해 되면 앱 스킴, 안 되면(또는 스킴 자체가 없으면) 웹 URL로 폴백하는 `openStreamingLink()` 구현. iOS에서 커스텀 스킴 감지가 되려면 `Info.plist`의 `LSApplicationQueriesSchemes`에 스킴을 등록해야 해서 `app.json`의 `ios.infoPlist`에 `["music", "spotify", "youtube"]` 추가.
- P2-S5-T2: `components/streaming/{StreamingButton,StreamingButtons}.tsx` — `@ongod/ui-tokens`의 `streaming` 브랜드 컬러(P2-S2-T3에서 이미 정의됨)를 원형 버튼 배경/아이콘 색으로 그대로 씀. 아이콘은 `@expo/vector-icons`의 `MaterialCommunityIcons`(`apple`/`spotify`/`youtube` 브랜드 글리프 보유, P2-S3~S4에서 쓴 `Ionicons`엔 브랜드 로고가 없어서 이번에 새로 채택) 사용.
- P2-S5-T3: `hasStreamingLink()`로 앱 스킴도 웹 URL도 둘 다 없는 플랫폼은 버튼 자체를 렌더링하지 않음(비활성 상태로 보여주는 대신 완전히 숨김).
- P2-S5-T4: `phase-2-core-app.md`에 이미 기록된 MVP 결정("3개 동시 표시로 단순화")을 그대로 따름 — `StreamingButtons`가 링크 있는 플랫폼을 필터링해 한 줄로 다 보여줌, 기기 설치 앱 기반 자동 정렬 같은 추가 로직은 넣지 않음.
- `DailyCard`에 `StreamingButtons`를 소개 텍스트와 "가사 보기" 버튼 사이에 삽입.
**왜 이렇게**:
- 앱 스킴 우선 로직을 `try/catch`로 감쌈 — `canOpenURL`/`openURL` 자체가 (플랫폼 차이 등으로) 던지더라도 무조건 웹 URL로 폴백되게 해서, 스트리밍 버튼이 "눌러도 아무 일도 안 일어나는" 상태가 되는 걸 막음.
- Android의 패키지 가시성(`<queries>`, API 30+)은 이번에 건드리지 않음 — Expo 관리형 워크플로에서 raw AndroidManifest `<queries>`를 추가하려면 커스텀 config plugin이 필요한데, 이 환경엔 Android 에뮬레이터가 없어 검증이 불가능해서 확인 안 된 설정을 넣기보다 명시적으로 미룸(아래 "막힌 점" 참고). `canOpenURL`이 Android에서 false를 반환해도 웹 폴백은 정상 동작하므로 기능이 깨지진 않음.
**변경 파일**: `apps/mobile/lib/streaming/deepLink.ts`(신규), `apps/mobile/components/streaming/{StreamingButton,StreamingButtons}.tsx`(신규), `apps/mobile/components/daily-card/DailyCard.tsx`, `apps/mobile/app.json`(`ios.infoPlist.LSApplicationQueriesSchemes`)
**검증**:
- `pnpm turbo run typecheck lint test` — 저장소 전체 19개 태스크 통과.
- iOS 시뮬레이터에서 실제 dev DB 데이터로 확인: "Go Down Moses"는 YouTube 링크만 있고 Apple Music/Spotify는 없는 실제 케이스라 P2-S5-T3(링크 누락 플랫폼 숨김)를 별도 조작 없이 그대로 검증함 — 빨간 YouTube 버튼 하나만 렌더링됨. 버튼을 탭하니 Expo Go 안에서 Safari(인앱 브라우저)가 열리며 해당 YouTube 영상 페이지로 정상 이동 — Expo Go는 `music://`/`spotify:`/`youtube://` 같은 커스텀 스킴을 자체 `Info.plist`에 선언 안 해서(관리형 워크플로 특성상 우리 `app.json`의 `LSApplicationQueriesSchemes`가 Expo Go엔 반영 안 됨) `canOpenURL`이 항상 false → 웹 폴백 경로가 탄 것. 앱 스킴이 실제로 먼저 시도되는 것 자체는 검증 못했지만, 폴백 로직과 URL 조합은 정확함을 확인.
**막힌 점 / 다음 할 일**:
- 앱 스킴 우선(`music://`/`spotify:`/`youtube://`) 분기는 Expo Go 특성상 이 환경에서 끝까지 검증 불가 — EAS 개발 빌드(dev client)로 우리 `app.json`의 `LSApplicationQueriesSchemes`가 실제 반영된 앱에서 재검증 필요(EAS 빌드는 사람 계정 필요, `docs/human-actions.md` 참고).
- Android `<queries>` 매니페스트 설정은 이번엔 건드리지 않음 — Android 빌드/에뮬레이터 검증 가능해지면 커스텀 config plugin으로 추가 검토.
- 시뮬레이터 좌표 이슈(전 Task 로그 참고)가 이번에도 반복됨 — 스트리밍 버튼 탭 위치를 두 번 잘못 짚었다가 `xcrun simctl io booted screenshot` 네이티브 캡처 + 색상 매칭으로 정확한 좌표를 찾음(빨간 원형 버튼이라 색 매칭이 쉬웠음).
- Phase 2 남은 Task는 P2-S6(인증)과 P2-S7(성능·안정화). P2-S6은 Apple/Google OAuth 키 발급(🧑, `human-actions.md` P2-S6-T0a/T0b)이 먼저 필요 — 키 오기 전까지 게스트 모드부터 진행 가능.

## 2026-09-01 · P2-S6 — 인증(Apple/구글 로그인 + 게스트 모드)

**Task**: [P2-S6](../phase-2-core-app.md#s6-인증-srs-profiles-applegoogle)
**한 일**:
- Google Cloud에서 발급받은 Web/iOS 클라이언트 ID·secret을 루트 `.env`(gitignore됨)에 저장, `.env.example`·`packages/config/src/env.ts` 스키마에 optional 필드로 반영.
- `lib/auth/signIn.ts` — Google은 `supabase.auth.signInWithOAuth` + `expo-web-browser`(`openAuthSessionAsync`)로 시스템 브라우저 기반 OAuth, Apple은 `expo-apple-authentication`(네이티브 버튼) → `signInWithIdToken`. 왜 방식이 다른지는 파일 안 주석에 남김(Expo Go 검증 가능 여부 차이).
- `lib/auth/AuthProvider.tsx` — `supabase.auth.onAuthStateChange` 구독 + `getSession()` 초기 복원을 컨텍스트로 노출하는 `useAuth()` 훅. `app/_layout.tsx`에 최상위로 장착.
- `app/profile.tsx` — 로그인 화면(모달, `Stack.Screen options={{presentation:"modal"}}`). 게스트도 계속 쓸 수 있다는 안내 문구, Apple 네이티브 버튼(iOS만), Google 버튼, 로그인 상태면 이메일/이름 + 로그아웃. `DailyCard` 우상단에 사람 아이콘으로 진입점 추가(P2-S6-T4/T5).
- `supabase/migrations/20260901120000_handle_new_user_profile.sql` — `auth.users` insert 시 `profiles` 자동 생성 트리거(P2-S6-T3). **아직 dev DB에 미적용** — [handoff.md](./handoff.md) 참고.
- `app.json`에 `expo-apple-authentication` 플러그인 추가.
**왜 이렇게**:
- Google은 브라우저 기반 OAuth를 택함 — Apple/Google 둘 다 원래는 네이티브 SDK(`@react-native-google-signin`, `expo-apple-authentication`)가 정석이지만, 네이티브 모듈은 EAS 빌드 전(지금은 Expo Go만 있음) 검증이 아예 불가능함. Google Cloud OAuth 클라이언트를 이미 웹+iOS 두 개 받아둔 김에, Supabase가 공식 지원하는 브라우저 흐름으로 짜서 **지금 이 세션에서 바로 끝까지 검증 가능**하게 했음(아래 검증 항목 참고). Apple은 브라우저 흐름으로 대체하면 Services ID·private key(.p8)·도메인 검증 같은 훨씬 무거운 추가 설정이 필요해져서, 대신 네이티브 흐름 그대로 코드만 작성하고 라이브 검증은 EAS 빌드 이후로 미룸 — Apple 쪽 Supabase 설정도 "활성화 + 허용 Client ID(`com.ongod.app`) 등록"만 하면 되는 더 가벼운 경로라 이쪽이 낫다고 판단.
- `profiles` 자동 생성은 앱 코드가 아니라 DB 트리거로 처리 — 클라이언트가 "로그인 성공 후 insert" 스텝을 깜빡해도 항상 보장되고, 표준적으로 널리 쓰이는 Supabase 레시피라 별도 ADR 없이 진행(전술적 결정).
**변경 파일**: `apps/mobile/lib/auth/{AuthProvider.tsx,signIn.ts}`(신규), `apps/mobile/app/profile.tsx`(신규), `apps/mobile/app/_layout.tsx`, `apps/mobile/components/daily-card/DailyCard.tsx`, `apps/mobile/app.json`, `apps/mobile/package.json`(`expo-web-browser`/`expo-auth-session`/`expo-apple-authentication`/`expo-crypto`), `supabase/migrations/20260901120000_handle_new_user_profile.sql`(신규), 루트 `.env`/`.env.example`, `packages/config/src/env.ts`
**검증**:
- `pnpm turbo run typecheck lint test --filter='!@ongod/admin'` — 17/17 통과(아래 "막힌 점"의 admin 이슈는 이 작업과 무관해서 제외).
- iOS 시뮬레이터에서 실제 확인: 프로필 아이콘 → 모달 진입 → 게스트 안내 문구·Apple/Google 버튼 정상 렌더링.
  - **Google**: 버튼 탭 → iOS 시스템 `ASWebAuthenticationSession` 프롬프트("Expo가 supabase.co를 사용하여 로그인하려고 합니다") 정상 표시 → 계속 진행하면 실제 dev Supabase(`bauchkybtccrclasheqf.supabase.co`)로 요청이 가서 `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}` 응답 확인 — 이건 **예상된 결과**(Supabase에서 Google 프로바이더를 아직 안 켰음)이자 동시에 클라이언트→Supabase 전체 파이프라인이 정확히 작동한다는 증거임.
  - **Apple**: 버튼 탭 → 실제 "Apple로 로그인" 시스템 다이얼로그가 뜸(사용자 실제 Apple ID 기준). 다만 다이얼로그 문구가 "'Expo Go'의 계정을 생성하십시오"로 떠서, 이 인증이 우리 앱(`com.ongod.app`)이 아니라 **Expo Go 자신의 앱 신분**으로 이루어진다는 걸 확인함 — 즉 여기서 로그인을 완료해도 나오는 identityToken의 audience가 Expo Go 것이라 Supabase가 거부할 것이 뻔하고, 실제 사용자의 개인 Apple ID로 의미 없는 인증을 진행시키는 게 되어 **다이얼로그를 취소하고 진행 안 함**. 코드가 네이티브 흐름을 정확히 트리거한다는 것까지만 확인.
  - 게스트 모드: 로그인 화면 닫아도 Daily Card·가사 열람 전부 그대로 동작 확인(비로그인 상태 아무 영향 없음).
**막힌 점 / 다음 할 일**:
- **Supabase Auth 설정 + DB 마이그레이션 적용에 PAT 필요** — 사람에게 요청함([human-actions.md](../human-actions.md) "P2-S6 후속"). 받으면: (1) Google 프로바이더 활성화(Web Client ID·secret 입력), (2) Apple 프로바이더 활성화 + 허용 Client ID에 `com.ongod.app` 추가, (3) `20260901120000_handle_new_user_profile.sql` 적용, (4) Google 로그인 종단 재검증(실제 계정 생성 + `profiles` 자동 생성 확인).
- **Apple 로그인 실제 검증은 EAS 개발 빌드 필요** — Expo Go 구조적 한계라 지금은 불가능. Apple Developer의 Sign in with Apple capability는 사람이 켰는지 아직 확인 안 됨(`human-actions.md` P2-S6-T0a).
- **중요 발견(내 작업과 무관하지만 기록 필요)**: `pnpm turbo run typecheck` 전체 실행 중 `@ongod/admin`이 실패하는 걸 발견함 — pnpm hoisted 레이아웃에서 `next`가 루트로 완전히 호이스팅되면서 admin의 React 19 타입과 루트의(mobile용) React 18 타입이 한 컴파일에 섞이는 문제로 보임(ADR-0005 이후 잠재해있다가 이번에 패키지 설치로 캐시 무효화되며 처음 드러난 듯). 어설픈 수정 시도는 되돌리고 정확한 진단만 [handoff.md](./handoff.md)에 남김 — admin/Next.js는 backend 트랙 소관이라 내가 깊이 고치지 않음. **`apps/mobile`/`packages/*`는 이 문제와 무관하게 전부 정상**(위 검증 항목 참고).
- 시뮬레이터의 `supabase` CLI가 OnGod와 무관한 다른 계정/프로젝트(`mission-talk`, `oghdy's Project`)에 로그인돼 있는 걸 발견함 — OnGod 마이그레이션 적용에 이 세션을 쓰면 안 됨(다른 프로젝트 건드릴 위험). PAT 받으면 Management API로 우회하면 되니 문제는 없음.
- Google 프로바이더가 켜지면 다음 세션에서 바로 실제 로그인 종단 테스트 가능한 상태까지 코드는 다 준비됨.

## 2026-09-01 · P2-S6 후속 — Supabase PAT로 프로바이더 활성화 + 마이그레이션 적용

**Task**: [P2-S6](../phase-2-core-app.md#s6-인증-srs-profiles-applegoogle)
**한 일**: 사람에게 받은 임시 Supabase Personal Access Token으로 Management API를 직접 호출해서:
1. `PATCH /v1/projects/{ref}/config/auth`로 Google 프로바이더 활성화(`external_google_client_id`/`external_google_secret`을 `.env`의 Web 클라이언트 값으로 설정).
2. 같은 엔드포인트로 Apple 프로바이더 활성화(`external_apple_client_id=com.ongod.app`, 네이티브 id_token 플로우라 secret은 불필요).
3. `POST /v1/projects/{ref}/database/query`로 `20260901120000_handle_new_user_profile.sql`을 dev DB에 실제 실행하고, `supabase_migrations.schema_migrations`에 버전(`20260901120000`)·이름(`handle_new_user_profile`)을 수동으로 등록해 기존 마이그레이션 이력과 일관되게 맞춤.
4. 토큰은 각 명령의 셸 변수로만 쓰고 실행 직후 `unset`, 어떤 파일에도 저장하지 않음(정책대로).
**왜 이렇게**: PATCH 전에 먼저 `GET .../config/auth`로 실제 필드 이름(`external_google_enabled` 등)을 확인하고 진행함 — 이름을 추측해서 잘못된 필드로 조용히 실패하는 걸 피하려는 목적. 마이그레이션은 파일만 실행하지 않고 이력 테이블에도 직접 기록해서, 나중에 backend가 `supabase db push`를 쓸 때 "이미 적용된 마이그레이션"으로 정상 인식되게 함(중복 적용 에러 방지).
**변경 파일**: 없음(전부 Supabase 프로젝트 설정/DB 상태 변경이라 저장소 파일 변경 없음) — 문서만 갱신(`phase-2-core-app.md`, `human-actions.md`, `handoff.md`).
**검증**:
- `GET /v1/projects/{ref}/config/auth` 재조회로 `external_google_enabled: true`, `external_apple_enabled: true`, `external_apple_client_id: "com.ongod.app"` 확인.
- `select tgname, tgrelid::regclass from pg_trigger where tgname = 'on_auth_user_created'`로 트리거가 `auth.users`에 실제로 걸려있는 것 확인.
- iOS 시뮬레이터에서 Google 로그인 버튼 재테스트: 이전엔 Supabase가 `"provider not enabled"`로 막았는데, 이번엔 **Google의 실제 로그인 화면(`accounts.google.com`)까지 도달** — Supabase 단계는 완전히 통과함을 확인. 다만 Google이 `400 오류: redirect_uri_mismatch`로 막아서 실제 로그인 완료까지는 못 감.
**막힌 점 / 다음 할 일**:
- `redirect_uri_mismatch`는 Google Cloud Console의 웹 OAuth 클라이언트에 등록된 "승인된 리디렉션 URI"가 Supabase가 실제로 보내는 값(`https://bauchkybtccrclasheqf.supabase.co/auth/v1/callback`)과 정확히 일치하지 않을 때 나는 에러 — Google Cloud 쪽 설정이라 내가 직접 못 고침(대시보드 UI 조작), 사람에게 재확인 요청함([human-actions.md](../human-actions.md) "P2-S6 후속2"). 고쳐주면 바로 재검증 가능.
- `external_google_additional_client_ids`(iOS 클라이언트 ID를 추가 허용 audience로 등록하는 필드)는 API로 두 번 시도했는데 계속 `null`로 남음 — 원인 불명(API 자체 한계일 수도, 다른 포맷을 요구할 수도 있음). 지금 구현(브라우저 기반 OAuth)에는 필요 없는 필드라 당장 안 막히지만, 나중에 네이티브 Google Sign-In SDK로 바꿀 때는 이 필드를 대시보드에서 직접 넣어야 할 수도 있음 — 기록만 해두고 넘어감.
- Apple 로그인은 여전히 EAS 빌드 전이라 라이브 종단 검증 불가(이전 로그 참고).
- 다음 세션은 리디렉션 URI 확인 여부에 따라: 고쳐졌으면 Google 로그인 실제 완료 + `profiles` 자동 생성 확인까지, 아직이면 P2-S7로 넘어가는 것도 고려.

## 2026-09-01 · P2-S6 재검증 — Google 로그인 redirect_uri_mismatch 원인 발견·수정

**Task**: [P2-S6-T2](../phase-2-core-app.md#s6-인증-srs-profiles-applegoogle)
**한 일**: 사람이 Google Cloud Console에 리디렉션 URI를 등록했다고 확인해줘서 재검증했는데도 여전히 `redirect_uri_mismatch`가 나서, 시뮬레이터 조작 대신 `curl`로 Supabase의 `/auth/v1/authorize?provider=google...` 엔드포인트를 직접 호출해 실제 302 리다이렉트의 `Location` 헤더를 까봤다. 그 결과 Google로 보내지는 `client_id`가 **iOS 클라이언트 ID**로 돼있는 걸 발견 — 애초에 Supabase Auth 프로바이더를 켤 때 내가 `external_google_client_id`에 Web이 아니라 iOS 클라이언트 ID를 넣는 실수를 했던 것(사람이 등록한 리디렉션 URI는 Web 클라이언트에만 있으니 애초에 iOS 클라이언트 ID로 요청이 나가면 무조건 불일치가 남). Management API로 `external_google_client_id`를 Web 클라이언트 ID로 다시 고치고, 같은 `curl` 방법으로 실제 리다이렉트 URL의 `client_id`가 바뀐 것까지 확인 후 시뮬레이터에서 재검증.
**왜 이렇게**: 시뮬레이터를 반복 조작해서 좌표 찍고 스크린샷 찍는 방식으로 디버깅하면 "이번엔 어디서 막혔는지"를 매번 화면 텍스트로만 추측해야 해서 느리고 부정확함. Supabase의 OAuth 시작 엔드포인트는 그냥 302 리다이렉트를 돌려주는 공개 엔드포인트라(인증 불필요) `curl`로 직접 쳐보면 실제 파라미터(client_id, redirect_uri)를 한 번에 정확히 볼 수 있음 — 그래서 문제가 "사람이 등록을 잘못했다"가 아니라 "내가 Supabase 설정을 잘못했다"라는 걸 빠르게 특정할 수 있었음.
**변경 파일**: 없음(Supabase 프로젝트 설정만 PATCH) — 문서 갱신만.
**검증**:
- `curl`로 authorize 리다이렉트 재확인: `client_id`가 Web 클라이언트 ID로 정확히 바뀜, `redirect_uri`는 그대로 `https://bauchkybtccrclasheqf.supabase.co/auth/v1/callback`.
- iOS 시뮬레이터에서 Google 버튼 재테스트: 이전엔 `redirect_uri_mismatch`로 막히던 게, 이번엔 **Google의 실제 로그인 폼("이메일 또는 휴대전화" 입력창)까지 정상 도달**. 앱→Supabase→Google 파이프라인 전체가 끝까지 검증됨.
- 실제 이메일/비밀번호 입력해서 로그인을 완료하는 것까지는 진행 안 함 — 사용자 본인의 실제 Google 계정 자격증명이라 내가 대신 입력하지 않는 게 맞다고 판단(안전 정책상 비밀번호 입력은 항상 금지 사항).
**막힌 점 / 다음 할 일**:
- 사람이 리디렉션 URI를 등록한 것 자체는 처음부터 문제 없었음 — 괜히 재확인을 요청했던 셈이라 `human-actions.md`에 정정 기록 남김(내 실수였다고 명시).
- 실제 로그인 완료(비밀번호 입력) + `profiles` 자동 생성 확인은 사용자가 실제로 한 번 로그인해보면 더 확실히 검증됨 — 원하면 다음에 같이 확인 가능.
- Apple 로그인은 여전히 EAS 빌드 전이라 라이브 검증 불가(변동 없음).
- P2-S6은 사실상 마무리 단계 — 남은 건 Apple Developer capability 확인(P2-S6-T0a, 사람 몫)과 EAS 빌드 이후 Apple 라이브 검증뿐. P2-S7(성능·안정화)로 넘어갈 준비 됨.

## 2026-09-06 · P2-S7-T1~T5 — 성능·안정화

**Task**: [P2-S7](../phase-2-core-app.md#s7-성능안정화-srs-42)
**한 일**:
- P2-S7-T1: `lib/perf/timing.ts` 신규 — JS 번들 evaluate 시점(`_layout.tsx` 최상단 import)을 기준점 삼아 `app/index.tsx`에서 오늘의 카드 콘텐츠가 처음 그려지는 시점까지 걸린 시간을 콘솔에 로그. 실제 iOS 시뮬레이터에서 4번 독립 측정(완전히 새로 리로드) 결과 297~384ms — SRS 4.2 목표(2000ms)의 5분의 1도 안 걸림. 별도 최적화 코드는 추가 안 함(이미 여유 있는데 손대면 괜히 복잡도만 늘어남).
- P2-S7-T2: `curl -I`로 실제 앨범 커버 파일 응답 헤더 확인 — `content-type: image/webp`(포맷 확인됨), `server: cloudflare` + `cf-ray` 헤더(CDN 경유 확인됨). 근데 `cache-control: no-cache`라 엣지 캐싱이 실질적으로 꺼져있는 걸 발견 — 이건 프론트 코드가 아니라 백엔드 업로드 파이프라인에서 고칠 부분이라 `handoff.md`에 남김.
- P2-S7-T3: `@sentry/react-native` 설치, `lib/sentry.ts`에서 DSN 없으면(`EXPO_PUBLIC_SENTRY_DSN` 미설정) 초기화를 건너뛰도록 방어적으로 작성 — Sentry 계정이 아직 없어도 이 커밋이 앱을 안 깨뜨림. `app/_layout.tsx`에서 `Sentry.wrap(RootLayout)`으로 루트를 감싸 크래시/에러를 자동 캡처하게 준비만 해둠.
- P2-S7-T4: `lib/analytics/track.ts` — `daily_card_viewed`(오늘 카드 처음 보임), `lyrics_viewed`(가사 탭 진입/전환), `streaming_link_opened`(스트리밍 버튼), `login_attempted`/`login_succeeded`(Apple/Google), `logout` 6개 이벤트. 지금은 콘솔 로그만 남기고, 실제 분석 도구가 정해지면 이 파일 안의 `track()` 함수만 바꾸면 호출부는 안 건드려도 됨.
- P2-S7-T5: 세 가지 확인·조치.
  1. 폰트 스케일: `components/ui/Text.tsx`가 `allowFontScaling`을 건드리지 않아서(기본값 `true`) 시스템 글자 크기 설정이 그대로 반영됨 — 코드 변경 없음, 확인만.
  2. 대비: `packages/ui-tokens`의 다크 팔레트 전체를 WCAG 2.x 공식으로 실제 계산해보니 `textTertiary`(#6E6E73)가 배경 대비 3.88:1로 본문 텍스트 기준(4.5:1) 미달 — "번역 노트"/"가사 출처" 같은 실제로 읽는 캡션 텍스트에 쓰이고 있어서 문제였음. `#84848A`(5.29:1)로 교체하고, 앞으로 이런 회귀를 못 잡는 일이 없게 `colors.test.ts`에 WCAG 대비비 계산 테스트를 추가함(본문 텍스트 3종 전부 4.5:1 이상인지 자동 검증).
  3. 스크린리더: 인터랙티브 요소 전부에 `accessibilityRole`/`accessibilityLabel`(+ 필요한 곳엔 `accessibilityState`) 부여 — 스트리밍 버튼, Tab, Button(공통 컴포넌트), 프로필/가사보기/뒤로가기/닫기 아이콘 버튼, 가사 출처 링크, LoadingView.
**왜 이렇게**:
- 성능 계측은 별도 APM 라이브러리 없이 `Date.now()` 델타 + 콘솔 로그로 처리 — SRS가 요구하는 건 "2초 이내"라는 하나의 숫자 검증이지 상시 모니터링 인프라가 아니라서, 지금 필요한 것보다 무거운 도구를 들이지 않음(YAGNI).
- Sentry/분석 도구 둘 다 "SDK/코드는 내가, 계정·키는 사람" 패턴을 그대로 따름(`docs/phase-2-core-app.md`에 이미 이렇게 정의돼 있었음) — DSN 없이도 안전하게 동작하도록 만들어서 사람이 계정을 언제 만들든 이 커밋이 블로킹하지 않게 함.
- 대비 수정은 값만 바꾸고 끝내지 않고 회귀 테스트를 추가함 — 나중에 누군가(나 자신 포함) 팔레트를 다시 손대다 대비를 깨뜨려도 `pnpm test`가 바로 잡아주게.
**변경 파일**: `apps/mobile/lib/perf/timing.ts`(신규), `apps/mobile/lib/sentry.ts`(신규), `apps/mobile/lib/analytics/track.ts`(신규), `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`, `apps/mobile/app/lyrics/[songId].tsx`, `apps/mobile/app/profile.tsx`, `apps/mobile/components/daily-card/DailyCard.tsx`, `apps/mobile/components/streaming/StreamingButton.tsx`, `apps/mobile/components/ui/{Button,Tab}.tsx`, `apps/mobile/components/state/LoadingView.tsx`, `apps/mobile/lib/auth/signIn.ts`, `apps/mobile/lib/env.ts`, `apps/mobile/.env.example`, `apps/mobile/app.json`(`@sentry/react-native` 플러그인), `apps/mobile/package.json`, `packages/ui-tokens/src/colors.ts`, `packages/ui-tokens/src/colors.test.ts`
**검증**:
- `pnpm turbo run typecheck lint test --filter='!@ongod/admin'` — 17/17 통과(admin 이슈는 무관, 기존 handoff 기록 참고).
- `packages/ui-tokens` 신규 대비 테스트 통과(`textPrimary`/`textSecondary`/`textTertiary` 전부 4.5:1 이상).
- iOS 시뮬레이터 실제 확인: 성능 로그 4회 측정(297~384ms), Sentry가 DSN 없이도 앱을 안 깨뜨리고 조용히 건너뜀(`[sentry] EXPO_PUBLIC_SENTRY_DSN이 없어서 초기화를 건너뜀` 로그 확인, `Sentry.wrap`이 `Sentry.init` 전에 불렸다는 벤인 경고만 뜸 — DSN 생기면 사라짐), `streaming_link_opened`/`lyrics_viewed` 이벤트가 실제 곡 데이터로 정확히 기록됨, "가사 출처" 캡션 텍스트가 육안으로도 이전보다 밝아진 것 확인.
**막힌 점 / 다음 할 일**:
- Sentry DSN, 분석 도구 키 — 둘 다 사람 몫으로 `human-actions.md`에 남김(둘 다 없어도 앱은 정상 동작).
- 이미지 CDN 캐싱 헤더(`cache-control: no-cache`) 이슈는 backend의 Storage 업로드 코드를 고쳐야 해서 직접 안 고치고 `handoff.md`에 남김.
- login_attempted/succeeded 트래킹은 코드는 넣었지만 이번엔 실제 로그인까지 다시 재현하지 않음(P2-S6에서 이미 Google OAuth 파이프라인 자체는 검증했음) — 나중에 실제 로그인 테스트할 때 이 이벤트도 같이 확인하면 됨.
- Phase 2 전체 Task(S1~S7) 완료. 남은 건 사람 몫(Apple capability 확인, Sentry/분석 도구, EAS 빌드)과 Phase 3(위젯)뿐.

## 2026-09-06 · EAS 프로젝트 연결

**Task**: [P0-S6-T3](../phase-0-foundation.md) (사람 몫 항목, `human-actions.md` 참고 — Apple/Google 로그인·스트리밍 앱스킴 라이브 검증의 선행 조건이라 이번에 같이 처리)
**한 일**: 사람이 Expo 계정(`doyis`) 생성 후 터미널에서 `npx eas-cli login`으로 로그인 완료해줘서, 이어서 `npx eas-cli init --account doyis --non-interactive`로 실제 EAS 프로젝트를 생성·연결함. `app.json`에 `extra.eas.projectId`와 `owner: "doyis"`가 자동으로 들어감.
**왜 이렇게**: `eas login`은 계정 비밀번호가 필요해서 내가 대신 할 수 없는 부분이라 사람에게 그 한 단계만 요청하고, 로그인 이후(인증 토큰이 이 컴퓨터에 저장된 뒤)부터는 내가 이어서 처리함 — 안전 정책(비밀번호 직접 입력 금지)과 효율을 같이 챙긴 구조.
**변경 파일**: `apps/mobile/app.json`(`extra.eas.projectId`, `owner` 추가)
**검증**: `npx eas-cli whoami`로 로그인 계정 확인, `pnpm --filter @ongod/mobile typecheck`/`lint` 통과 확인.
**막힌 점 / 다음 할 일**:
- 계정이 개인(`doyis`)과 팀(`doyiss-team`) 두 개가 있어서 개인 계정으로 진행함 — 나중에 팀으로 옮기고 싶다면 말씀해달라고 안내 필요.
- 이제 실제 `eas build --profile development --platform ios`로 개발 빌드를 만들 수 있는 상태 — 이건 Apple Developer 인증(빌드 서명)이 필요할 수 있어 사람 확인 후 진행하는 게 안전. 다음 세션에서 빌드 진행 여부 확인 필요.

## 2026-09-07 · P0-S6-T6b — ADR-0006 링커 전환 후 모바일 기동 검증 + 이중 React 회귀 수정

**Task**: [P0-S6-T6b](../phase-0-foundation.md#s6-cicd-기초) — backend가 [handoff](./handoff.md)로 넘긴 "링커 바꿨으니 `expo start` 한 번 돌려봐 달라" 요청 처리
**한 일**:
- 지시대로 `rm -rf node_modules apps/*/node_modules packages/*/node_modules && pnpm install` (2.9초) 후 `expo start` → **앱이 화면을 아예 못 그리고 에러 오버레이만 떴다.** `Objects are not valid as a React child (found: object with keys {$$typeof, type, key, props, _owner, _store})` — 한 번들에 React 인스턴스가 둘일 때 나는 증상.
- Metro dev 번들(`?dev=true&minify=false`)을 직접 받아 모듈 경로를 세어보니 `react@18.3.1`과 **`react@19.2.8`이 같이** 들어있었고, 19를 물고 있는 게 `expo-router`(거의 전 모듈)·`expo-modules-core`·`@expo/vector-icons`·`expo-apple-authentication`·`@expo/metro-runtime`(= 에러 오버레이 자신, 그래서 에러를 못 보여주고 자기가 또 죽었다)이었다.
- 원인: ADR-0006이 루트 호이스팅될 `@types/react`만 18로 고정하고 **런타임 `react`는 고정하지 않아서**, `shamefully-hoist`가 루트 `node_modules/react`에 admin용 19를 올림. react를 peerDependency로 선언 안 한 expo 계열 패키지들이 위로 걸어 올라가 그 19를 잡았다. `react-native` 본체와 앱 코드는 18을 쓰니 렌더러와 엘리먼트 생성 쪽이 갈라짐.
- 수정: 루트 `package.json` `devDependencies`에 `"react": "18.3.1"`, `"react-dom": "18.3.1"` 추가 — ADR-0006이 `@types/react`에 쓴 것과 **완전히 같은 장치**를 런타임 사본에도 적용. `react-dom`까지 넣은 건 `react`만 고정하면 루트 `react-dom`이 19로 남아 매 설치마다 peer 불일치 경고가 뜨기 때문(지금 mobile 번들에 `react-dom`은 0개라 실피해는 없지만 루트를 일관되게 유지).
- [ADR-0007](../decisions/0007-root-react-runtime-pin.md) 작성, ADR-0006 상단에 보정 포인터 추가, OVERVIEW ADR 목록 갱신.
**왜 이렇게**:
- 시뮬레이터 화면만 보고 추측하지 않고 **번들 산출물을 직접 받아 모듈 경로를 셌다.** "이중 React 같다"는 심증에서 "정확히 이 패키지들이 19를 잡는다"는 물증으로 넘어가야 수정이 한 번에 끝나고, 무엇보다 *어떤 종류의 수정이 맞는지*(패키지별 땜질 vs 루트 버전 고정)가 그 목록을 봐야 결정됨.
- 링커 설정은 원래 backend 트랙 소관이라 넘길까 했는데, (a) 깨진 것이 mobile 기동이라 내 트랙 문제고 (b) 수정이 ADR-0006이 이미 채택한 장치를 한 줄 더 쓰는 것뿐이라 새 구조 결정이 아니며 (c) 저장소를 앱이 안 켜지는 상태로 두고 넘기는 게 더 나쁘다고 판단해서 직접 고치고 ADR로 근거를 남겼다. admin 쪽 코드는 손대지 않음.
**변경 파일**: `package.json`(루트, `react`/`react-dom` 18 고정), `pnpm-lock.yaml`, `docs/decisions/0007-root-react-runtime-pin.md`(신규), `docs/decisions/0006-pnpm-isolated-public-hoist.md`(보정 포인터), `docs/OVERVIEW.md`, `docs/phase-0-foundation.md`, `docs/logs/handoff.md`
**검증**:
- 번들 실측: 수정 전 `react@19.2.8` 모듈 4개 + `react@18.3.1` 공존 → 수정 후 **`react@18.3.1` 하나만**, `react-dom` 0개.
- iOS 시뮬레이터(Expo Go, iPhone 16 Pro) 실제 확인: 에러 오버레이 사라짐. 오늘의 카드(제목·소개·Fraunces/Inter 폰트·YouTube 버튼) · 스와이프로 최근 픽 이동 · 가사 화면 진입 · 원문↔해석 탭 전환 · 뒤로가기 · 로그인 모달(Apple 네이티브 버튼 + Google 버튼 + 게스트 안내) 전부 정상. 콘솔 에러 0건(남은 건 DSN 없을 때 나오는 기존 Sentry 경고뿐).
- `[perf] today-screen-first-content: 372ms` — P2-S7-T1이 기록한 297~384ms 범위로 복귀.
- `pnpm turbo run typecheck lint test build --force --concurrency=1` **20/20 통과**(admin `next build` 포함).
- **오늘 픽이 없어 첫 화면이 빈 카드로 뜨는 건 정상 동작이다** — dev DB의 `daily_picks`에 2026-08-29 한 건만 있고 오늘(2026-09-07) 건이 없음. `app/index.tsx`가 오늘 픽이 없으면 안내 카드를 맨 앞에 끼우는 P2-S3-T5 설계대로이며, 스와이프하면 실제 카드가 나온다(확인함). 데이터 로딩 실패가 아님.
**막힌 점 / 다음 할 일**:
- **`react` 계열 버전을 올릴 때 봐야 할 곳이 세 곳 → 다섯 곳이 됐다**(ADR-0007 표 참고). backend에도 handoff로 남김.
- **`pnpm turbo run typecheck lint test build`를 동시 실행하면 `@ongod/admin:typecheck`가 간헐 실패한다** — 내 변경과 무관한 기존 레이스: admin `tsconfig.json`의 `include`가 `.next/types/**/*.ts`인데 같은 시각 `next build`가 그 디렉터리를 지웠다 다시 만들어서 `error TS6053: File '.next/types/app/layout.ts' not found`가 난다. `--concurrency=1`이면 20/20, `build` 없이 `typecheck lint test`만이면 19/19로 항상 통과함을 확인. backend가 20/20을 봤던 건 레이스를 이긴 것. admin/Next 소관이라 안 고치고 handoff로 넘김(고치려면 turbo `dependsOn`으로 admin typecheck를 build 뒤로 보내거나, `.next/types`를 include에서 빼는 방향).
- `npx expo export`로 이중 React를 검사하려던 방법은 **폐기**했다(ADR-0007에 이유 기록) — 기본은 Hermes 바이트코드라 grep 불가, `--no-bytecode`도 minify로 경로가 사라져 이중 React가 있어도 조용히 통과한다. 대신 "루트와 mobile의 `react` 버전이 같은지" 한 줄 검사를 CI 후보로 남김.
- Phase 2는 그대로 완료 상태. 다음은 Phase 3(위젯) 또는 EAS 개발 빌드(Apple 로그인·앱 스킴 라이브 검증).

## 2026-09-07 · P0-S6-T6c — 이중 React 회귀 방지 검사 CI 추가 + Android 검증

**Task**: [P0-S6-T6c](../phase-0-foundation.md#s6-cicd-기초) — P0-S6-T6b 후속(재발 방지 + 남은 검증 구멍 메우기)
**한 일**:
- `scripts/check-single-react.mjs` 신규 + `.github/workflows/ci.yml`에 스텝 추가. apps/mobile이 보는 react를 기준으로 삼고, ADR-0007에서 실제로 React 19를 집어왔던 패키지들(`expo-router`, `expo-modules-core`, `@expo/metro-runtime`, `@expo/vector-icons`, `expo-apple-authentication`, `react-native`, `expo`)이 각자 위치에서 react를 어떻게 해석하는지 Node 해석 규칙으로 확인한다.
- CI에 `pnpm build` 스텝도 추가. ADR-0006이 고쳤던 `next build` 깨짐(증상 2)을 기존 CI가 전혀 못 잡고 있었다.
- **Android 검증**(P0-S6-T6b에서 "장비 없음"으로 남겨뒀던 항목) — 실제로는 Android Studio·SDK·에뮬레이터·AVD 2개가 모두 갖춰져 있었다. `~/Library/Android/sdk`의 명령어들이 PATH에 없었을 뿐인데 미설치로 넘겨짚은 내 오판이었다. Pixel 2 / API 35 에뮬레이터로 종단 검증함.
**왜 이렇게**:
- **검사가 실제로 실패하는지를 양방향으로 확인했다.** 통과만 확인하고 넣으면 "절대 안 울리는 경보기"를 다는 것과 같다. 루트 `react` 핀을 일시적으로 제거해 ADR-0007 이전 상태를 재현했더니 exit 1로 실패하며 문제의 다섯 패키지를 정확히 지목했고(내가 번들을 손으로 뒤져 찾아낸 목록과 동일), 되돌린 뒤 다시 통과했다.
- 검사를 `pnpm install` **직후** 스텝에 뒀다 — lint/typecheck/test가 다 통과해버리는 종류의 문제라 뒤에 두면 늦고, 원인이 의존성 레이아웃이라 설치 직후가 가장 정확한 시점이다.
- CI `build`를 `typecheck`와 **별도 스텝**으로 뒀다 — 같은 turbo 실행에 넣으면 `next build`가 `.next/types`를 지웠다 만드는 동안 admin typecheck가 `TS6053`으로 깨진다(P0-S6-T6b에서 발견한 레이스). 스텝을 나누면 순차 실행이라 레이스 자체가 성립하지 않는다. env 없이도 `next build`가 되는 것을 격리된 환경(`env -i`)에서 확인하고 넣었다.
**변경 파일**: `scripts/check-single-react.mjs`(신규), `.github/workflows/ci.yml`
**검증**:
- 검사 양방향: 정상 상태 → `✓ React 사본 1개 (react@18.3.1)` exit 0 / 루트 핀 제거 재현 → exit 1 + 다섯 패키지 지목. 확인 후 `package.json`·`pnpm-lock.yaml` 원상복구(`git diff` 없음).
- CI 순서 그대로 로컬 재현: React 검사 → lint → typecheck → test → build 전부 통과.
- **Android(Pixel 2 / API 35 에뮬레이터, Expo Go)**: Metro Android 번들 React 사본 **1개**(`react@18.3.1`, `react-dom` 0개) — iOS와 동일. 앱 실제 기동해서 오늘 카드(제목·소개·Fraunces/Inter 폰트·YouTube 버튼·프로필 아이콘) · 스와이프 · 가사 화면 진입 전부 정상. 콘솔 에러 0건(기존 Sentry DSN 경고만). `[perf] today-screen-first-content: 1030ms`, `[analytics] lyrics_viewed` 정상 기록.
**막힌 점 / 다음 할 일**:
- Android 첫 렌더 1030ms는 iOS(372ms)보다 느리지만 SRS 4.2 목표(2000ms) 안이고, 에뮬레이터 + 콜드 스타트 조건이라 그대로 둠. 실기기 측정은 사람 몫.
- Android는 Expo Go로만 확인했다 — 스트리밍 앱 스킴(`youtube://` 등)의 Android 패키지 가시성(`<queries>`, P2-S5 로그 참고)은 여전히 미검증. EAS 개발 빌드 이후 과제.
- 남은 것: admin typecheck `.next/types` 레이스(로컬 한정, backend 트랙), React 18/19 공존 부채(Expo SDK 53+ 업그레이드로 해소).

## 2026-09-08 · P0-S7-T1~T7 — Expo SDK 52 → 57 업그레이드 (React 19 통일, ADR-0006·0007 부채 청산)

**Task**: [P0-S7](../phase-0-foundation.md#s7-런타임-업그레이드-expo-sdk-57--react-19-통일)
**한 일**:
- **P0-S7-T1 사전 조사**: SDK 52가 최신(57)보다 5개 메이저 뒤처져 있음을 확인. npm 레지스트리와 각 SDK의 `bundledNativeModules.json`을 직접 조회해 SDK↔RN↔React↔expo-router 매트릭스를 만들고, 우리 의존성 20개 중 19개가 바뀜을 대조. 스크래치 디렉터리에 SDK 57 조합으로 `package.json`을 만들어 **실제 설치를 돌려 충돌 0을 확인**한 뒤 착수(추측으로 시작하지 않기 위해).
- **P0-S7-T2/T3**: `apps/mobile` 의존성을 SDK 57로 일괄 상승. expo-router 57이 요구하는 `react-native-reanimated`·`react-native-worklets`·`react-native-gesture-handler`·`react-dom`을 신규 추가. `@expo/metro-runtime`은 peer라 락파일에 SDK 52 시절 4.0.1이 굳어 있어 명시적으로 올림.
- **P0-S7-T4 (핵심)**: 루트 `package.json`의 React 18 고정 3줄과 `pnpm-workspace.yaml`의 `packageExtensions`(next에 React 19 타입 주입)를 **전부 제거**. 대신 `pnpm-workspace.yaml`에 `overrides`로 react/react-dom/@types/react(-dom) 버전을 한 곳에서 강제. **관리 지점 다섯 곳 → 한 곳.**
- **P0-S7-T5 코드 마이그레이션**: 5개 메이저를 건너뛰었는데 수정은 두 곳뿐. (1) `StyleSheet.absoluteFillObject` 제거(RN 0.86) → `absoluteFill`로 교체 3곳. (2) **expo-router 57에서 `<Stack>`의 자식 선언이 라우트 목록이 되는 변경** → 아래 참고.
- **P0-S7-T6**: iOS·Android 양쪽 Expo Go 57.0.9로 종단 검증.
- **P0-S7-T7**: [ADR-0008](../decisions/0008-expo-sdk-57-react-19.md) 작성, ADR-0006·0007을 Superseded로 표시, OVERVIEW 갱신, handoff 통지.
**왜 이렇게**:
- **52→57 직행을 택했다.** Expo 공식 권장은 한 SDK씩이지만, 조사에서 (a) 신 아키텍처가 이미 켜져 있고(`newArchEnabled: true` + 런타임 `Bridgeless mode is enabled`) (b) 네이티브 폴더가 아예 없고(관리형) (c) 공유 패키지가 React를 전혀 안 쓰고 (d) 앱이 34파일에 expo-router API를 얕게만 쓰고 (e) 의존성 조합이 실제로 해결됨을 확인했으므로, 다섯 번의 재설치·검증 사이클이 이득보다 비용이 크다고 판단. 브랜치(`frontend/expo-sdk-57`)에서 진행하고 실패 시 SDK 54 경유로 후퇴할 계획이었으나 후퇴 없이 완료.
- **`overrides`를 쓴 이유**: 메이저가 19로 통일돼도 mobile은 Expo가 정한 `19.2.3`, admin은 `^19.0.0`(→19.2.8)이라 **두 사본이 생긴다**. 업그레이드 직후 실제로 그 상태를 관측했다. 메이저가 같아도 인스턴스가 둘이면 ADR-0007과 똑같이 깨지므로, "운 좋게 안 겹치는" 상태로 두지 않고 한 곳에서 못 박았다.
- **TypeScript 6.0 권장은 따르지 않았다.** `expo install --check`가 `~6.0.3`을 권하지만 TS는 admin·packages가 함께 쓰는 저장소 전체 의존성이라, SDK 업그레이드에 끼워 넣으면 범위가 흐려지고 백엔드 트랙에 예고 없이 파급된다. 5.9.3으로 20/20 통과함을 확인하고 별건으로 분리(handoff에 남김).
**변경 파일**: `apps/mobile/package.json`, `apps/mobile/app/_layout.tsx`, `apps/mobile/components/daily-card/DailyCard.tsx`, `pnpm-workspace.yaml`, `package.json`(루트), `pnpm-lock.yaml`, `docs/decisions/0008-expo-sdk-57-react-19.md`(신규), `docs/decisions/{0006,0007}-*.md`(Superseded 표시), `docs/OVERVIEW.md`, `docs/phase-0-foundation.md`, `docs/logs/handoff.md`
**검증**:
- **React 사본**: 깨끗이 재설치 후 저장소 전체에 `react@19.2.3` **하나만** 존재(`node_modules/.pnpm` 실측). `scripts/check-single-react.mjs` 통과.
- `pnpm turbo run typecheck lint test build --force --concurrency=1` **20/20**(admin `next build` 포함). `packageExtensions`를 지웠는데도 admin 타입체크가 통과 — ADR-0006 장치가 정말로 불필요해졌음을 확인.
- **iOS**(Expo Go 57.0.9, iPhone 16 Pro): 오늘 카드(폰트·그라디언트·YouTube 버튼) · 스와이프 · 가사 원문/해석 탭 · 뒤로가기 정상. 첫 렌더 531~884ms.
- **Android**(Expo Go 57.0.9, Pixel 2 / API 35): 위와 동일 + `/profile` 딥링크 모달 정상. 첫 렌더 921~936ms.
- 양쪽 콘솔 에러 0건(기존 Sentry DSN 미설정 경고만).
**막힌 점 / 다음 할 일**:
- **Android 전용 회귀를 하나 만들었다가 잡았다 — 기록해둘 가치가 있다.** 기존 `_layout.tsx`는 모달 옵션만 주려고 `<Stack>` 안에 `<Stack.Screen name="profile">` 하나만 뒀는데, expo-router 57에서는 **자식을 선언하면 그것이 라우트 목록**이 되어 `profile`이 첫 화면이 됐다. **Android에서 `index.tsx`가 한 번도 렌더되지 않고** 앱을 열면 곧장 로그인 화면이 떴다. iOS에서는 증상이 없어서 iOS만 봤으면 놓쳤을 것이다. 타입체크·lint·테스트·`next build` 전부 통과했다.
  - 진단은 스크린샷이 아니라 **로그로 확정**했다: `app/index.tsx`가 남기는 `[perf] today-screen-first-content` 줄이 SDK 52 Android와 SDK 57 iOS에는 있는데 SDK 57 Android에만 없었다. Expo Go 데이터를 완전히 지우고(`pm clear`) 재실행해도 동일해 네비게이션 상태 복원이 아님을 확인했고, 자식 선언을 빼자 바로 렌더되는 것으로 원인을 격리했다.
  - 수정: 라우트를 전부 명시하고 `index`를 맨 앞에. 딥링크로 하위 라우트에 바로 진입해도 뒤로가기 스택이 index부터 쌓이도록 `unstable_settings.initialRouteName`도 선언.
- **TypeScript 6.0**은 미적용(위 "왜 이렇게" 참고) — 저장소 전체 영향이라 backend와 합의 후 별도 Task로.
- **`react-native-web`**은 넣지 않았다(SDK 57 템플릿엔 있음). 웹 타깃이 아니라 필요할 때 추가.
- 이제 Phase 3(위젯) 착수 조건이 갖춰졌다 — `expo prebuild`로 네이티브 프로젝트를 생성해도 최신 RN 기준이라 나중에 재조정할 일이 없다. 🧑 실기기 Expo Go 테스트도 이제 가능(App Store 최신 Expo Go = SDK 57).
