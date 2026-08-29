# Backend 작업 로그

> 백엔드 트랙(Supabase/DB/어드민 서버/외부 API 연동/파이프라인)에서 진행한 작업을
> **시간순으로 append**한다. 가장 최근 항목이 맨 아래에 오도록 계속 추가한다.
> 이 파일은 절대 과거 항목을 지우거나 고쳐 쓰지 않는다 — 기록이 곧 역사다.

## 작성 규칙

- Task 하나를 완료할 때마다 아래 템플릿으로 항목 하나를 추가한다.
- 완료 후 해당 Task의 `docs/phase-N-*.md` 체크박스를 `[x]`로 바꾸고 이 항목 앵커를 링크한다.
- 다른 트랙(프론트)에 영향을 주는 변경이면 반드시 [`handoff.md`](./handoff.md)에도 남긴다.
- 되돌리기 어려운 구조적 결정을 내렸다면 `docs/decisions/000N-*.md`로 ADR을 추가한다.

## 템플릿

```markdown
## YYYY-MM-DD · P#-S#-T# — 한 줄 제목

**Task**: [P#-S#-T#](../phase-N-*.md#관련-섹션)
**한 일**: 무엇을 구현/변경했는지
**왜 이렇게**: 선택한 방식과 이유 (대안이 있었다면 간단히)
**변경 파일**: `packages/...`, `apps/...`
**검증**: 어떻게 확인했는지 (테스트 명령, 수동 확인 등)
**막힌 점 / 다음 할 일**: 있으면 기록, 없으면 생략
```

---

## 2026-08-28 · P0-S2-T1~T8 — Supabase dev/prod 프로젝트 생성 및 스키마 적용

**Task**: [P0-S2-T1~T8](../phase-0-foundation.md#s2-supabase-프로젝트--db-스키마)
**한 일**:
- Supabase CLI(Personal Access Token 방식, 비-TTY 환경이라 브라우저 로그인 불가)로 `ongod` 계정 안에 `ongod-dev`(ref `bauchkybtccrclasheqf`), `ongod-prod`(ref `oxslyyjrapkhsjltnevt`) 프로젝트 생성 (서울 리전, Free 플랜)
- `supabase init`으로 `supabase/migrations/` 구조 생성
- 마이그레이션 5개 작성 및 dev·prod 양쪽에 `supabase db push`로 적용:
  1. `init_schema.sql` — SRS 7.2의 7개 테이블(profiles/songs/lyrics/song_info/daily_picks/user_favorites/push_subscriptions)
  2. `indexes_triggers.sql` — 인덱스 4개 + `update_updated_at` 트리거
  3. `rls_policies.sql` — RLS (ADR-0001: 운영 테이블 쓰기 정책 없음 = anon 차단, 유저 테이블은 본인 행만)
  4. `constraints.sql` — `daily_picks.status` CHECK, `songs.album_cover_source_url` 컬럼 (ADR-0003)
  5. `pipeline_runs.sql` — 파이프라인 상태 추적 테이블 (ADR-0002)
- `.env`(gitignored, 로컬 전용) + `.env.example`(커밋됨, 값 비움)에 dev/prod URL·anon key·service_role key 정리

**왜 이렇게**:
- 처음 원래 계정(`oghdy`)에서 시도했으나 Free 플랜 활성 프로젝트 한도(2개)에 걸림. 무료 한도가 **조직이 아니라 계정 전체 기준**임을 실제 API 에러로 확인 (새 조직 생성으로 우회 시도했으나 실패). 기존 2개 프로젝트(`mission-talk`, `oghdy's Project`)가 실사용 중이라 pause 불가, Pro 업그레이드는 프로젝트 개수만큼 Compute 비용이 붙는 구조($25 기본료 + 프로젝트당 $10)라 비합리적 → 사용자가 완전히 새로운 Supabase 계정을 만들어 해결
- DB 비밀번호는 각각 랜덤 24자 생성 (`openssl rand`), 파일에 하드코딩하지 않고 `/tmp`에만 보관

**변경 파일**: `supabase/migrations/*.sql`, `supabase/config.toml`, `.env`(비커밋), `.env.example`

**검증**: `supabase db push` 성공 응답 확인 (dev·prod 각각 5개 마이그레이션 전부 적용), `supabase projects api-keys`로 키 조회 성공

**막힌 점 / 다음 할 일**:
- Free 플랜 quota가 계정 전체 기준이라는 점은 문서화 가치가 있어 추후 `docs/decisions/`에 짧은 ADR로 남길지 검토
- P0-S2-T7 (seed 스크립트) 아직 안 함 — 다음 세션에서 진행
- P0-S3-T1 (DB 타입 자동 생성)로 이어서 진행 가능한 상태

## 2026-08-28 · P0-S1-T1~T7 — 모노레포 스캐폴딩(pnpm + Turborepo) + apps/ + packages/config

**Task**: [P0-S1-T1~T7](../phase-0-foundation.md#s1-모노레포-구조-설계)
**한 일**:
- pnpm 미설치 상태였음 → `npm install -g pnpm`으로 설치 (corepack 없는 환경)
- 루트 `package.json`·`pnpm-workspace.yaml`(`apps/*`, `packages/*`)·`turbo.json` 작성 (`build/lint/typecheck/test` 태스크, `dev`는 non-cache/persistent)
- `packages/config`: `tsconfig.base.json`(strict, noUncheckedIndexedAccess 등), `eslint.config.js`(flat config, `@typescript-eslint` + `eslint-config-prettier`), `prettier.config.js` — 다른 패키지가 `require("@ongod/config/eslint.config.js")`로 확장
- `apps/admin`(Next.js 15 App Router): 최소 `app/layout.tsx` + `app/page.tsx`, `@ongod/config`의 tsconfig/eslint 확장. `pnpm build` 정상 (정적 페이지 4개 생성 확인)
- `apps/mobile`(Expo 52 / RN 0.76 / React 18.3): 최소 `App.tsx` + `index.ts`만 있는 껍데기. **프론트 트랙 몫이라 UI/구조는 건드리지 않음** — `tsc --noEmit`, `eslint .` 통과만 확인
- 루트 `pnpm build`/`lint`/`typecheck`를 turbo로 실행해 파이프라인 전체 동작 확인
- `packages/README.md`에 패키지 간 의존 규칙 문서화 (단방향 의존, `core`는 아무것도 import 안 함 등)
- Turborepo 익명 텔레메트리 `turbo telemetry disable`로 끔 (개인정보 최소 수집 원칙)

**왜 이렇게**:
- `packages/ui-tokens`는 Task 목록(S1~S6) 어디에도 명시적 산출물로 없어서 이번엔 생성하지 않음 — Phase 2 UI 작업 시작할 때(프론트 트랙) 필요하면 그때 추가하는 게 낫다고 판단 (지금 만들면 내용 없는 빈 패키지만 남음)
- `apps/mobile`은 네이티브 빌드(Xcode/Android SDK)까지는 확인하지 않음 — 이 세션 환경에 없고, 애초에 실기기/네이티브 빌드는 사람 몫(🧑)이라 CLAUDE.md 원칙과도 맞음. 대신 `tsc`+`eslint`로 구조적 정합성만 확인
- `@types/react` 버전을 mobile에서 `~18.3.12`로 고정 — Expo 52가 React 18.3.1 기반이라 `react-native`가 요구하는 피어 의존성과 맞춤 (처음 `^19`로 넣었다가 peer warning 발견 후 수정)
- ESLint 9 flat config 채택 (legacy `.eslintrc` 대신) — 2026년 시점 ESLint 신규 프로젝트 기본값이고, `packages/config`에서 배열을 export/spread하는 방식이 여러 앱에 걸쳐 합성하기 더 단순함

**변경 파일**: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json`, `packages/config/**`, `packages/README.md`, `apps/admin/**`, `apps/mobile/**`, `pnpm-lock.yaml`

**검증**:
- `pnpm install` 성공 (peer dependency 경고 없음, 906개 패키지)
- `pnpm --filter @ongod/admin build` → Next.js 정적 빌드 성공
- `pnpm --filter @ongod/admin typecheck` / `lint` → 통과 (next-env.d.ts는 eslint ignore 처리)
- `pnpm --filter @ongod/mobile typecheck` / `lint` → 통과
- 루트 `pnpm build` / `pnpm lint` / `pnpm typecheck` (turbo 오케스트레이션) → 전부 통과

**막힌 점 / 다음 할 일**:
- `apps/admin` eslint에 Next.js 전용 규칙(`eslint-config-next`)이 아직 없음 — `next build`가 경고로 알려줌. 지금은 기능에 지장 없어 보류, 필요해지면 추가
- 다음: P0-S3 (공유 패키지 — `packages/db` 타입 생성/클라이언트, `packages/core` 도메인 타입)로 이어서 진행

## 2026-08-28 · P0-S3-T1~T5 — packages/db + packages/core 도메인 타입·공유 유틸

**Task**: [P0-S3-T1~T5](../phase-0-foundation.md#s3-공유-패키지-타입설정유틸)
**한 일**:
- `packages/db/scripts/gen-types.sh`: dev/prod 선택 가능한 `supabase gen types` 래퍼. `.env`의 project ref + DB 비밀번호로 Supavisor 풀러(`aws-0-ap-northeast-2.pooler.supabase.com:5432`) URL을 구성해 실행. DB 비밀번호는 `.env`에 없으면 `/tmp/ongod_{dev|prod}_dbpw.txt`(P0-S2에서 저장해둔 파일)로 폴백
- **막힘**: 이 환경에 Docker/Podman이 없어서 `supabase gen types typescript --db-url ...`가 `LegacyContainerRuntimeNotFoundError`로 실패함 (v2.115 CLI가 introspection에 로컬 컨테이너를 씀). Docker 설치는 시스템 변경이라 임의로 하지 않음 → 대신 `supabase/migrations/*.sql` 5개 파일을 근거로 `packages/db/src/types/database.ts`를 실제 CLI 출력과 동일한 셰이프로 손으로 작성 (`Database`/`Tables<T>`/`TablesInsert<T>`/`TablesUpdate<T>`, 파일 상단에 이 사정과 재생성 방법을 주석으로 남김)
- `packages/db/src/client.ts`: `createAnonClient`/`createServiceRoleClient` 팩토리 (service-role은 `autoRefreshToken:false, persistSession:false`)
- `packages/core/src/domain/types.ts`: `Profile`/`Song`/`Lyrics`/`SongInfo`/`DailyPick`(+`DailyPickStatus`)/`UserFavorite`/`PushSubscription`/`PipelineRun`(+`PipelineRunStatus`) — camelCase, DB CHECK 제약과 맞춘 literal union
- `packages/db/src/mappers.ts`: DB row → 위 도메인 타입 변환 함수 8개. `daily_picks.status`/`pipeline_runs.status`는 허용값 밖이면 예외를 던지는 런타임 검증 포함 (DB CHECK가 깨졌다는 신호이므로 조용히 캐스팅하지 않음)
- `packages/core/src/date/kst.ts`: `toKstDateString`/`kstMidnightToUtc`/`isSameKstDay` — Daily Pick이 KST 자정 기준으로 바뀌는 로직에 쓸 순수 함수
- 두 패키지 모두 vitest 셋업 (`test` 스크립트 + `vitest.config.ts`), core 7개·db(mappers) 4개 테스트 작성
- `pnpm-workspace.yaml`에 `onlyBuiltDependencies: [esbuild]` 추가 (vitest 의존성인 esbuild의 postinstall이 기본 차단되길래 명시적으로 허용)

**왜 이렇게**:
- DB row→도메인 변환 함수(`P0-S3-T3`)를 계획 문서 표현과 달리 `packages/core`가 아니라 `packages/db`에 둠. `docs/OVERVIEW.md`의 의존 다이어그램과 이번에 작성한 `packages/README.md` 규칙 모두 "`core`는 아무것도 import하지 않는다 / `db → core` 단방향"이라, core가 db의 Row 타입을 import해야 하는 변환 함수를 core에 두면 그 규칙과 바로 충돌함. db는 core를 의존성으로 추가해도 자연스러워서 (`@ongod/db`가 `@ongod/core`를 dependencies에 추가) 여기로 옮김 — 사소한 배치 선택이라 ADR 없이 로그로만 남김
- `assertOneOf`로 status 값을 런타임에 검증: CHECK 제약이 있으니 이론상 항상 안전하지만, 마이그레이션 실수나 수동 SQL로 어긋난 값이 들어오면 조용히 잘못된 타입으로 캐스팅되는 것보다 바로 터지는 게 디버깅에 낫다고 판단 (경계 레이어에서의 방어적 검증 — 설계 원칙 5)
- `is_verified`/`is_active`는 DB에서 nullable(default는 있지만 NOT NULL 아님)이라 Row 타입엔 `boolean | null`, 도메인 타입에선 `?? 기본값`으로 non-null 처리 — 앱 코드에서 매번 null 체크하지 않게

**변경 파일**: `packages/db/**`, `packages/core/**`, `pnpm-workspace.yaml`, `package.json`

**검증**:
- `pnpm --filter @ongod/db typecheck/lint/test` 전부 통과 (4 tests)
- `pnpm --filter @ongod/core typecheck/lint/test` 전부 통과 (7 tests)
- 루트 `pnpm build/lint/typecheck/test` (turbo 오케스트레이션) 전부 통과

**막힌 점 / 다음 할 일**:
- `packages/db/src/types/database.ts`는 손으로 작성한 것이라 스키마가 바뀌면 자동으로 안 따라감 — 새 마이그레이션 작성 시 이 파일도 같이 고쳐야 한다는 걸 잊지 말 것 (또는 Docker 설치 후 `gen:types`로 교체)
- 다음: P0-S4 (외부 서비스 추상화 레이어 인터페이스)

## 2026-08-28 · P0-S4-T1~T5 — packages/integrations 외부 서비스 추상화 레이어

**Task**: [P0-S4-T1~T5](../phase-0-foundation.md#s4-외부-서비스-추상화-레이어)
**한 일**:
- `src/providers.ts`: `MetadataProvider`(Apple Music/Spotify/YouTube가 구현 예정)·`LyricsProvider`(Genius)·`TranslationProvider`(Claude, `translateLyrics`+`generateSongInfo` 두 메서드) 인터페이스. 전부 `NamedProvider`(`.name`)를 확장
- `src/http-client.ts`: `createHttpClient({ provider, baseUrl, timeoutMs, maxRetries, retryDelayMs, requestsPerSecond })` — `fetch` 기반, `AbortController`로 타임아웃, 지수 백오프 재시도(재시도 가능한 에러만), 초당 요청 수 제한, JSON 파싱까지 처리
- `src/errors.ts`: `IntegrationError`(`code`/`provider`/`retryable`/`cause`) + `codeFromHttpStatus` (401/403→UNAUTHORIZED, 404→NOT_FOUND, 429→RATE_LIMITED, 5xx→NETWORK_ERROR). `retryable`은 code로부터 기본 추론(TIMEOUT/RATE_LIMITED/NETWORK_ERROR만 true)하되 명시적으로 덮어쓸 수 있음
- `src/registry.ts`: `createProviderRegistry<T extends NamedProvider>(providers)` — provider 3종 인터페이스가 전부 `.name`을 가지므로 제네릭 하나로 통일. 미등록 이름 조회 시 재시도 불가능한 `NOT_FOUND` IntegrationError
- `src/testing/`: `createStubMetadataProvider`/`createStubLyricsProvider`/`createStubTranslationProvider` — Phase 1 실제 어댑터가 나오기 전 오케스트레이터를 테스트할 수 있는 스텁. `@ongod/integrations/testing` 서브패스로만 노출(프로덕션 코드가 실수로 import 못 하게)
- vitest 30개 테스트: `errors`(11) — status 매핑·retryable 기본값, `registry`(3), `http-client`(6, `vi.stubGlobal("fetch", ...)`로 재시도/타임아웃 정규화/query 직렬화 검증) — 총 packages 4개 vitest 스위트 합쳐 31개(core 7 + db 4 + integrations 20)

**왜 이렇게**:
- `TranslationProvider`를 `translateLyrics`/`generateSongInfo` 두 메서드로 나눔 — Phase 1 문서(P1-S3-T2~T4)가 "가사 해석", "곡 소개+역사적 맥락", "성경구절(선택)"을 별개 프롬프트로 계획하고 있어서, 인터페이스 단계에서부터 책임을 나눠두는 게 나중에 구현 어댑터가 프롬프트별로 재시도/캐싱을 다르게 가져가기 쉬움. 성경구절은 `generateSongInfo` 결과의 optional 필드로 흡수(별도 메서드까지는 과함)
- provider별 레지스트리 클래스를 3개 안 만들고 제네릭 `createProviderRegistry<T extends NamedProvider>` 하나로 — 인터페이스 3종이 이미 구조적으로 동일(`.name` + 메서드들)이라 반복 불필요
- HTTP 클라이언트는 axios 등 외부 라이브러리 대신 Node 20+ 내장 `fetch`/`AbortController`만 사용 — Edge Function(Deno) 배포까지 고려하면 의존성 적을수록 유리

**변경 파일**: `packages/integrations/**`

**검증**: `pnpm --filter @ongod/integrations typecheck/lint/test` 전부 통과 (20 tests). 루트 `pnpm build/lint/typecheck/test` 전부 통과

**막힌 점 / 다음 할 일**:
- 실제 Apple Music/Spotify/YouTube/Genius/Claude 어댑터 구현은 P1-S2/S3 몫 (API 키 발급 먼저 필요 — 🧑)
- 다음: P0-S5 (env 스키마 검증 — zod)

## 2026-08-28 · P0-S5-T1~T3 — env 스키마 검증 + 시크릿 분리 정책

**Task**: [P0-S5-T1~T3](../phase-0-foundation.md#s5-환경시크릿-관리)
**한 일**:
- `packages/config/src/env.ts`: zod로 `.env` 스키마 정의 + `loadEnv(source?)`. Supabase dev/prod 8개 필드(project ref/url/anon/service-role)는 필수, DB 비밀번호와 Phase 1 외부 API 키 7개(Apple/Spotify/YouTube/Genius/Anthropic)는 optional. 검증 실패 시 어떤 필드가 왜 실패했는지 사람이 읽을 수 있는 메시지로 던짐
- `packages/config`를 정적 설정 파일 전용 패키지에서 실행 코드도 가진 패키지로 확장 (`src/`, `tsconfig.json`, `vitest.config.ts` 추가, `package.json`의 `main`/`types`를 `./src/index.ts`로). 기존 `tsconfig.base.json`/`eslint.config.js`/`prettier.config.js` subpath는 그대로 동작 (package.json에 `exports` 필드가 없어서 plain path 해석 그대로 유지됨 — 새로 추가할 때 실수로 `exports` 넣으면 기존 subpath들이 다 깨지니 주의)
- `docs/secrets-policy.md`: 로컬(.env)/Supabase Edge Function secrets/Vercel(admin)/EAS(mobile) 4곳에 시크릿을 어떻게 나눠 넣는지, 실제 명령어 예시까지 포함해 문서화. `OVERVIEW.md` 문서 목록에 링크 추가
- `.env.example`은 P0-S2에서 이미 작성돼 있어서 `env.ts` 스키마 필드와 1:1 대응하는지만 확인 (일치함, 새로 안 건드림)
- vitest 4개 테스트 (필수 필드 통과, optional 필드 없어도 통과, 누락 시 필드명 포함한 에러, URL 형식 검증)

**왜 이렇게**:
- `loadEnv()`를 아직 `apps/admin`/`apps/mobile` 부팅 경로에 연결하지 않음 — Next.js/Expo는 monorepo 루트가 아니라 각 앱 자신의 디렉터리에서 `.env`를 읽는 게 기본 동작이라, 지금 이 루트 `.env`를 그대로 각 앱에 연결하면 오히려 오해를 부를 수 있음. 두 앱이 실제로 시크릿을 쓰기 시작하는 시점(admin은 P1-S1-T4 service-role 경계 확립, mobile은 Supabase 연결 붙일 때)에 각 앱의 env 로딩 방식(Next `.env.local` vs Expo `EXPO_PUBLIC_*`)에 맞춰 다시 판단하는 게 맞다고 봄 — 지금은 재사용 가능한 검증 로직만 준비
- `packages/config`에 `src/`를 추가하는 대신 새 `packages/env` 패키지를 만들 수도 있었지만, `OVERVIEW.md` 아키텍처 다이어그램에 이미 있는 5개 패키지 범위를 넘기지 않는 쪽을 택함 — "공유 설정(eslint, tsconfig, **상수**)"이라는 config의 정의에 env 스키마도 자연스럽게 들어감

**변경 파일**: `packages/config/**`, `docs/secrets-policy.md`, `docs/OVERVIEW.md`

**검증**: `pnpm --filter @ongod/config typecheck/lint/test` 전부 통과 (4 tests). 루트 `pnpm build/lint/typecheck/test` 전부 통과 (packages 4개 vitest 스위트 합쳐 35 tests: core 7 + db 4 + integrations 20 + config 4)

**막힌 점 / 다음 할 일**:
- P0-S5-T4는 Supabase 부분만 완료 상태 (P0-S2에서 이미 됨). Phase 1 외부 API 키 발급은 P1-S2-T0*/P1-S3-T0에서 사람이 할 일 — 지금 추가로 할 거 없음
- 다음: P0-S6 (CI/CD — GitHub Actions lint/typecheck/test, 브랜치 전략 문서화)

## 2026-08-28 · P0-S6-T1~T5 — CI/CD 기초

**Task**: [P0-S6-T1~T5](../phase-0-foundation.md#s6-cicd-기초)
**한 일**:
- `.github/workflows/ci.yml`: PR + `main` push마다 `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm test` (turbo 오케스트레이션). pnpm/action-setup + actions/setup-node(캐시 pnpm) 사용
- `.github/workflows/supabase-migrations.yml`: `supabase/migrations/**` 변경된 PR에서만 트리거. `supabase/setup-cli` → `supabase start`(로컬 Docker 스택) → `supabase db reset`(모든 마이그레이션을 처음부터 재적용, 하나라도 깨지면 실패) → `supabase stop`. dev/prod 프로젝트에는 전혀 접근 안 함, 완전 격리된 로컬 인스턴스라 시크릿 불필요
- `apps/mobile/eas.json`: development/preview/production 3개 빌드 프로파일
- `apps/admin/vercel.json`: 모노레포용 `installCommand`/`buildCommand` (`cd ../..`로 루트에서 pnpm/turbo 실행), `outputDirectory: .next`
- `docs/branching-and-commits.md`: `main` 직접 커밋 기본, 트랙 동시 작업 시에만 단명 브랜치, 커밋 메시지는 `<type>: <설명> (<Task ID>)` — 실제 기존 커밋 2개를 예시로 사용
- `docs/human-actions.md`의 Phase 0 체크리스트를 실제 완료 상태로 갱신 (Supabase 관련 항목 전부 완료 표시, EAS/Vercel은 내 쪽 준비물이 끝났다고 명시)

**왜 이렇게**:
- `supabase db reset` 방식을 택한 이유: 이 로컬 개발 환경엔 Docker가 없어 직접 검증 못 했지만(P0-S3 로그 참고), GitHub Actions `ubuntu-latest` 러너에는 Docker가 기본 설치돼 있어 CI에서는 문제없이 동작할 것으로 예상. dev/prod 프로젝트에 대해 `db push --dry-run`류를 쓰는 대신 완전히 격리된 로컬 스택을 쓰는 이유는 실수로 실제 프로젝트에 영향을 줄 가능성을 원천 차단하기 위함
- CI 워크플로는 `lint + typecheck + test`까지만 (task 문서 그대로) — `build`는 포함 안 함. 이유: Next.js 빌드가 나중에 `NEXT_PUBLIC_*` 환경변수를 실제로 요구하게 되면 GitHub Actions에 시크릿을 등록해야 하는데, 그건 Vercel 연결(P0-S6-T4, 🤝)과 같이 판단할 문제라 지금 미리 얹지 않음
- **이 워크플로 둘 다 실행 검증은 못 함** — 로컬에 GitHub Actions 실행 환경이 없고, 이 환경엔 Docker도 없어 `supabase start`를 직접 못 돌려봄. YAML 문법만 파서로 확인함(`python3 -c "import yaml; ..."`). 실제 PR을 하나 열어봐야 최종 확인됨 — 당신이 다음 PR을 만들 때 Actions 탭에서 결과를 봐주면 좋겠음

**변경 파일**: `.github/workflows/ci.yml`, `.github/workflows/supabase-migrations.yml`, `apps/mobile/eas.json`, `apps/admin/vercel.json`, `docs/branching-and-commits.md`, `docs/human-actions.md`, `docs/OVERVIEW.md`

**검증**:
- YAML 파싱 확인 (PyYAML `safe_load`)
- 워크플로가 실제로 돌아가는지는 미검증 (위 "막힌 점" 참고)
- 루트 `pnpm build/lint/typecheck/test` 계속 그린 (워크플로/설정 파일 추가라 코드 변경 없음)

**막힌 점 / 다음 할 일**:
- 두 워크플로 다 실제 GitHub Actions에서 첫 실행 확인 필요 (다음 PR/push 때)
- P0-S6-T3(EAS)·T4(Vercel)는 🤝 — 내 쪽 준비물(`eas.json`/`vercel.json`/시크릿 목록)은 끝났고, 계정 연결은 사람 몫
- **Phase 0 나머지**: P0-S2-T7(seed 스크립트)만 미완료. 그 외 S1·S3·S4·S5(T4 제외)·S6(T1/T2/T5)까지 전부 완료 — Phase 0 종료 기준 대부분 충족

## 2026-08-28 · P0-S3-T1 후속 — 손으로 쓴 DB 타입을 CLI 생성 타입으로 교체

**Task**: [P0-S3-T1](../phase-0-foundation.md#s3-공유-패키지-타입설정유틸)
**한 일**: `packages/db/src/types/database.ts`를 CLI가 실제 생성한 타입으로 전량 교체
**왜 이렇게**:
- 이전 로그(P0-S3-T1~T5)에서 "Docker가 없어서 손으로 옮겨 적었다"고 기록했는데, 이건 불필요한 우회였음이 밝혀짐. `supabase gen types typescript --project-id <ref>`는 **로컬 컨테이너 없이 클라우드에 연결된 프로젝트에서 직접** 타입을 생성한다 (Docker가 필요한 건 완전 오프라인 로컬 스택 `supabase start`를 쓸 때뿐). 설계 세션이 `ongod-dev`(ref `bauchkybtccrclasheqf`)에 대해 이 명령을 직접 실행해 확인
- 손으로 쓴 버전과 diff한 결과 스타일 차이가 아니라 **구조적 차이**가 있었음: `export interface Database` vs 실제 CLI의 `export type Database`, `__InternalSupabase.PostgrestVersion` 메타 필드 누락 등. `createClient<Database>()`에서 실제로 영향 줄 수 있는 부분이라 그대로 둘 수 없었음
**변경 파일**: `packages/db/src/types/database.ts` (전량 교체)
**검증**:
- `packages/db/src/client.ts`, `packages/db/src/index.ts`의 `Database`/`Tables`/`TablesInsert`/`TablesUpdate` 참조가 새 타입과 이름·형태 그대로 호환되는지 grep으로 확인
- `tsc --noEmit -p packages/db/tsconfig.json` 통과
**막힌 점 / 다음 할 일**: 없음. `docs/human-actions.md`의 "Docker 설치(선택)" 항목은 더 이상 해당 없어 제거함

## 2026-08-28 · P0-S2-T7 — seed 스크립트

**Task**: [P0-S2-T7](../phase-0-foundation.md#s2-supabase-프로젝트--db-스키마)
**한 일**:
- `packages/db/scripts/gen-types.sh`를 `--db-url`(Supavisor pooler + DB 비밀번호) 방식에서 `--project-id`(`SUPABASE_ACCESS_TOKEN`만 있으면 됨) 방식으로 단순화. 직전 로그(P0-S3-T1 후속)에서 확인된 대로 Docker/DB 비밀번호가 필요 없어졌으므로 스크립트도 그에 맞춤
- `supabase/seed.sql`: 흑인영가(Negro spiritual) 3곡(`Wade in the Water`/`Swing Low, Sweet Chariot`/`Go Down Moses`) 샘플. `songs`/`lyrics`/`song_info`/`daily_picks` 4개 테이블을 전부 채우고, `daily_picks.status`가 `published`(오늘·어제)·`scheduled`(내일)를 각각 하나씩 커버하게 해서 앱의 "오늘의 카드"와 어드민의 예약 발행 큐를 로컬에서 바로 확인 가능하게 함
- 원문 가사는 실제 텍스트 대신 "[개발용 샘플]" 표시가 붙은 더미 텍스트 — 저작권 있는 실제 가사를 시드 데이터에 넣지 않기 위함
- 고정 UUID(`11111111-...`, `22222222-...`, `33333333-...`) + `on conflict do nothing`으로 재실행해도 안전하게 작성

**왜 이렇게**:
- 이 환경엔 Docker가 없어 `supabase start`(로컬 스택)로 직접 검증은 못 함. 대신 로컬 Postgres.app(이 머신에 이미 설치돼 있었음)에 임시 DB(`ongod_seed_test`)를 만들어 `auth.users`/`auth.uid()`를 최소 스텁으로 흉내내고, 마이그레이션 5개 + `seed.sql`을 실제로 순서대로 적용해 검증함 — dev/prod 클라우드 프로젝트에는 전혀 손대지 않음. 검증 후 임시 DB는 즉시 삭제
- 이 방식으로 SQL 문법 오류, FK 제약 위반, 멱등성(재실행 시 중복 안 됨)까지 실제로 확인함 — CI의 `supabase-migrations.yml` 워크플로가 하는 것(`supabase start` + `supabase db reset`)과 사실상 동일한 검증을 로컬에서 대체 수행한 셈

**변경 파일**: `supabase/seed.sql`, `packages/db/scripts/gen-types.sh`

**검증**:
- 로컬 임시 Postgres DB에 마이그레이션 5개 + `seed.sql` 순서대로 적용 → 에러 없음
- `songs`/`daily_picks`/`song_info`/`lyrics`를 join한 쿼리로 3곡 전부 올바르게 연결됨을 확인 (Wade in the Water=오늘/published, Swing Low=어제/published, Go Down Moses=내일/scheduled, scripture_reference 포함)
- `seed.sql`을 같은 DB에 두 번째로 실행 → `INSERT 0 0`(중복 삽입 없음), `songs` 카운트 3개 그대로 → 멱등성 확인
- 임시 DB 삭제로 정리 완료

**막힌 점 / 다음 할 일**:
- **Phase 0 전부 완료** (S1~S6). 남은 건 전부 🧑/🤝: P0-S5-T4(Phase 1 API 키), P0-S6-T3(EAS 계정), P0-S6-T4(Vercel 연결)
- 다음 자연스러운 단계는 Phase 1(Content Pipeline) — 단, P1-S2-T0*/P1-S3-T0(외부 API 키 발급)가 먼저 필요함

## 2026-08-28 · P1-S1-T1~T4 — 어드민 로그인 + 보호 라우트 + service-role 경계

**Task**: [P1-S1-T1~T4](../phase-1-content-pipeline.md#s1-어드민-앱-기반)
**한 일**:
- `apps/admin/lib/env.ts`(`NEXT_PUBLIC_*`, 클라이언트 노출 가능) / `env.server.ts`(`server-only`, service-role·`ADMIN_EMAILS`)로 env를 분리. `ADMIN_EMAILS`는 콤마 구분 이메일 목록을 zod로 파싱해 배열로 변환
- `lib/supabase/server.ts`(Server Component/Action용, `@supabase/ssr`의 쿠키 기반 세션 클라이언트), `lib/supabase/middleware.ts`(요청마다 세션 갱신), `lib/supabase/service-role.ts`(`@ongod/db`의 `createServiceRoleClient` 재사용, `import "server-only"`로 감쌈)
- 루트 `middleware.ts`: 로그인 안 됐거나 `ADMIN_EMAILS`에 없는 이메일이면 `/login`으로 리다이렉트, 이미 인가된 상태로 `/login`에 오면 `/`로 리다이렉트
- `app/login/`: `signIn`/`signOut` Server Action(`actions.ts`) + `useActionState`로 에러를 보여주는 로그인 폼(`page.tsx`). 로그인 성공해도 `ADMIN_EMAILS`에 없으면 그 자리에서 다시 sign out시키고 에러 반환 — 미들웨어 리다이렉트 한 바퀴 도는 대신 즉시 명확한 메시지를 줌
- `lib/auth/require-admin.ts`: `app/(admin)/layout.tsx`에서 호출하는 재검증 헬퍼 — 미들웨어가 실수해도 안전하도록 이중 확인
- `app/(admin)/layout.tsx`: 사이드바 UI 셸(대시보드/곡 등록/검수 큐/예약 발행 — 뒤 3개는 아직 라우트 없어서 비활성 표시만) + 로그아웃 버튼. `app/(admin)/page.tsx`: 대시보드 placeholder. 기존 `app/page.tsx`는 대체돼서 삭제
- `apps/admin/.env.example`(커밋됨, 값 비움) + `apps/admin/.env.local`(gitignore, 루트 `.env`의 dev 값을 변환해 채움: `SUPABASE_DEV_URL`→`NEXT_PUBLIC_SUPABASE_URL` 등) + `.claude/launch.json`(admin dev 서버 preview 설정) 추가
- `docs/secrets-policy.md`에 `ADMIN_EMAILS` 항목과 "admin은 루트 `.env`를 안 읽는다" 설명 추가

**왜 이렇게**:
- **역할 검증 방식**: ADR-0001이 이미 "운영자는 단일/소수, DB role은 과설계"라고 결정해둠 → `profiles.role` 컬럼 같은 거 새로 안 만들고 env var allowlist로 구현. 공동 운영자가 늘어나면 ADR-0001이 예고한 대로 그때 `profiles.role`을 추가하면 됨
- **Server Action 기반 로그인**(client-side Supabase JS 안 씀): `signInWithPassword`를 서버에서 실행하면 쿠키 세팅까지 한 번에 끝나서 클라이언트에 별도 Supabase 클라이언트/상태관리가 필요 없음. `<form action={signIn}>`은 JS 없이도 동작하는 progressive enhancement
- **`server-only` 패키지로 경계 강제**: 주석/컨벤션이 아니라 빌드 타임에 강제되는 걸 원해서, `service-role.ts`에 `import "server-only"`를 넣음. **실제로 클라이언트 컴포넌트에서 import하도록 임시로 바꿔서 빌드가 진짜 실패하는지 검증**한 뒤 원상복구함 — "경계가 있다"는 주장을 코드 리뷰가 아니라 실제 실패로 확인
- **이중 검증**(middleware + `requireAdmin()`): Supabase 공식 Next.js 가이드가 강조하는 패턴. middleware의 matcher 설정을 잘못 건드리는 실수가 나중에 일어나도, 각 보호된 layout에서 다시 확인하니 뚫리지 않음
- **`ADMIN_EMAILS`에 `hadyon76@gmail.com`을 임시로 넣음**: 시스템에 등록된 사용자 이메일을 기본값으로 썼지만, 이게 Supabase Auth 로그인에 실제로 쓸 이메일인지는 확인 안 됐음 — P1-S1-T5(운영자 계정 생성) 진행 시 사람이 실제 로그인 이메일을 알려주면 그걸로 맞출 것

**변경 파일**: `apps/admin/**`(신규: `lib/`, `middleware.ts`, `app/login/`, `app/(admin)/`, `.env.example`; 수정: `package.json`; 삭제: `app/page.tsx`), `.claude/launch.json`, `docs/secrets-policy.md`

**검증**:
- `pnpm --filter @ongod/admin typecheck/lint/build` 전부 통과
- **`server-only` 경계 실제 파괴 테스트**: `app/login/page.tsx`(클라이언트 컴포넌트)에 `import "@/lib/supabase/service-role"`를 임시로 추가 → `next build`가 정확히 그 이유로 실패하는 것 확인(`You're importing a component that needs "server-only"...`) → 되돌리고 재빌드 성공 확인
- 브라우저로 직접 확인(`pnpm --filter @ongod/admin dev`, Browser 도구): `/` 접속 시 `/login`으로 자동 리다이렉트됨 확인 → 로그인 폼에 존재하지 않는 계정으로 제출 → "이메일 또는 비밀번호가 올바르지 않다" 에러가 화면에 뜨는 것까지 실제 dev Supabase 프로젝트와 통신해서 확인 (서버 로그에 `POST /login 200` 정상 응답)
- 로그인 **성공** 케이스는 실제 운영자 계정이 아직 없어서(P1-S1-T5, 사람 몫) 미검증 상태로 남음

**막힌 점 / 다음 할 일**:
- P1-S1-T5(최초 운영자 계정 생성)가 사람 몫으로 남아있음 — 계정 만들고 로그인 이메일 알려주면 `ADMIN_EMAILS` 맞추고 로그인 성공 케이스까지 마저 확인 가능
- 다음: P1-S2(외부 API 어댑터 실연동) — 여기부턴 API 키(Apple Music/Spotify/YouTube/Genius) 발급이 먼저 필요함. 인터페이스는 P0-S4에서 이미 정의해둔 상태(`@ongod/integrations`)

## 2026-08-28 · P1-S1-T5 후속 — ADMIN_EMAILS를 실제 로그인 이메일로 갱신

**Task**: [P1-S1-T5](../phase-1-content-pipeline.md#s1-어드민-앱-기반)
**한 일**: `apps/admin/.env.local`의 `ADMIN_EMAILS`를 임시값(`hadyon76@gmail.com`)에서 사람이 알려준 실제 테스트 로그인 이메일 `test@ongod.com`으로 교체
**왜 이렇게**: 사람이 Supabase Auth 로그인 전용으로 실제 사용하지 않는 테스트 이메일(`test@ongod.com`)을 쓰겠다고 함 — 도메인이 실재하지 않아도 Supabase 대시보드에서 "Add user"로 직접 만들면(가입 플로우 아님) 이메일 인증 없이 바로 쓸 수 있어서 문제 없음
**변경 파일**: `apps/admin/.env.local` (gitignored, 커밋 안 됨)
**막힌 점 / 다음 할 일**: 사람이 알려준 비밀번호("1234", 4자)는 Supabase Auth 기본 최소 길이(6자)보다 짧아서 대시보드가 계정 생성을 거부할 가능성이 큼 — 6자 이상으로 다시 받아야 함. 계정 생성 완료되면 로그인 성공 케이스까지 마저 확인 예정

## 2026-08-28 · P1-S2-T0b — Spotify 키 발급 보류

**Task**: [P1-S2-T0b](../phase-1-content-pipeline.md#s2-외부-api-어댑터-실연동)
**한 일**: Spotify API 키 발급을 보류하기로 결정, `phase-1-content-pipeline.md`/`human-actions.md`에 ⏸️ 표시
**왜 이렇게**: 사람이 Spotify 개발자 대시보드 진입 시도했으나 "Upgrade to Spotify Premium to access the Web API" 메시지로 막힘 — 무료 계정으로는 API 접근 자체가 차단된 상태(최근 정책 변경으로 보이나 정확한 시점은 확인 안 됨). Spotify는 `MetadataProvider` 여러 구현체 중 하나일 뿐이고 필수 provider가 아님(앨범커버·장르·발매연도는 Apple Music이 커버, 트랙 링크·popularity만 Spotify 담당 예정이었음) → Premium 구독 여부는 사람이 나중에 판단, 지금은 건너뛰고 YouTube/Genius/Apple Music으로 진행
**변경 파일**: `docs/phase-1-content-pipeline.md`, `docs/human-actions.md`
**막힌 점 / 다음 할 일**: Spotify 어댑터(P1-S2-T2)도 같이 보류. 나머지 3개 키(YouTube/Genius/Apple Music) 발급 진행 중

## 2026-08-28 · P1-S2-T1~T5 — Genius/유튜브/애플뮤직/스포티파이 어댑터 + 계약 테스트

**Task**: [P1-S2-T1~T5](../phase-1-content-pipeline.md#s2-외부-api-어댑터-실연동)
**한 일**:
- `packages/integrations/src/adapters/`에 4개 어댑터 구현, `@ongod/integrations/adapters` 서브패스로 export(무거운 의존성인 `jose`/`cheerio`가 기본 import에 안 딸려오게 `./testing`과 같은 방식으로 분리)
  - **Genius**(`genius.ts`, `LyricsProvider`): 검색 API(JSON) → 곡 페이지 URL 찾기 → 그 페이지 HTML을 fetch해서 `cheerio`로 `[data-lyrics-container='true']` 블록만 파싱해 가사 텍스트 추출. Genius 공식 API가 가사 본문 자체는 안 줘서(ToS) 2단계로 감
  - **YouTube**(`youtube.ts`, `MetadataProvider`): YouTube Data API v3 search. album/releaseYear/genre 개념이 없어서 항상 null, externalId/externalUrl/albumCoverUrl(썸네일)만 채움
  - **Apple Music**(`apple-music.ts`, `MetadataProvider`): `jose`로 Team ID/Key ID/.p8을 ES256 서명해 developer token을 직접 만들고, catalog search 호출. 토큰은 인스턴스당 캐시(12시간), 401 받으면 캐시 무효화 후 다음 호출에서 재발급
  - **Spotify**(`spotify.ts`, `MetadataProvider`): Client Credentials Flow로 access token 발급(만료 60초 전 자동 갱신) 후 검색. 트랙 검색 응답엔 genre가 없어서(아티스트 엔드포인트에만 있음) 항상 null
- 4개 어댑터 전부 vitest 계약 테스트 작성(총 11개 케이스) — 전역 `fetch`를 `vi.stubGlobal`로 교체해 네트워크 없이 검증. **Apple Music은 `jose`로 실제 EC 키 쌍을 만들어서 진짜 JWT 서명·검증까지 확인**(단순히 응답 매핑만 확인한 게 아니라 서명 로직 자체가 맞는지까지)

**왜 이렇게**:
- **Apple Music/Spotify도 스텁이 아니라 완성된 구현으로 작성**: 사람이 "키만 없을 뿐, 나머지는 준비해두면 나중에 값만 넣으면 되게"라고 요청함. 두 API 스펙(Apple Music JWT 인증, Spotify Client Credentials Flow) 다 안정적이고 문서화가 잘 돼 있어서 라이브 테스트 없이도 정확하게 구현 가능하다고 판단 — 실제로 Apple Music은 테스트에서 자체 서명·검증까지 통과했으니 로직 정확성은 이미 확인된 상태. 키 발급되면 config 객체(teamId/keyId/privateKey 또는 clientId/clientSecret)만 채워서 `registerAvailableProviders()`(P1-S4, 아직 안 만듦)에 넘기면 끝
- **Genius를 2단계(API+스크래핑)로 구현**: Genius API가 의도적으로 가사 본문을 안 준다는 게 잘 알려진 제약이라, 실제로 동작하려면 이 방식밖에 없음. 페이지 구조가 바뀌면 깨질 수 있어서 `INVALID_RESPONSE` 에러로 명확히 구분되게 해둠(향후 디버깅 편하도록)
- **`./adapters` 서브패스 분리**: `jose`/`cheerio`는 무거운 의존성인데, 레지스트리/에러 타입만 쓰는 코드(예: 테스트, 다른 패키지)까지 이걸 번들에 끌고 올 필요 없음 — `./testing`을 분리해둔 기존 패턴을 그대로 따름

**변경 파일**: `packages/integrations/src/adapters/**`(신규), `packages/integrations/package.json`(exports·dependencies 추가: `jose`, `cheerio`)

**검증**:
- `pnpm --filter @ongod/integrations typecheck/lint/test` 전부 통과 (31 tests, 어댑터 관련 11개 신규)
- Apple Music JWT: 테스트에서 실제 `jose.generateKeyPair("ES256")`로 키 쌍을 만들고, 어댑터가 만든 토큰을 그 공개키로 `jwtVerify`까지 성공 — 서명 로직이 스펙대로 동작함을 실제로 증명
- Genius/YouTube/Apple Music/Spotify 전부 **실제 API 키로는 아직 검증 안 함** — 다음 로그에서 진행

**막힌 점 / 다음 할 일**:
- 실제 Genius/YouTube 키 받으면 라이브 호출로 한 번 더 검증할 예정 (사람이 이미 두 키는 갖고 있다고 함)
- P1-S2-T6(부분 성공 처리)은 개별 어댑터가 아니라 오케스트레이터(P1-S4, 여러 provider를 조합해서 곡 하나를 채우는 로직) 몫이라 지금은 스킵 — 그때 `pipeline_runs.steps` jsonb에 provider별 성공/실패를 기록하는 형태로 구현 예정
- Apple Music/Spotify는 여전히 실제 키 없음 — Apple Music은 사람이 곧 발급 예정, Spotify는 보류 상태 유지

## 2026-08-28 · P1-S2-T3/T4 후속 — YouTube/Genius 실키 라이브 검증, Genius 오매칭 버그 수정

**Task**: [P1-S2-T3~T4](../phase-1-content-pipeline.md#s2-외부-api-어댑터-실연동)
**한 일**:
- 사람이 전달한 실제 `YOUTUBE_API_KEY`/`GENIUS_ACCESS_TOKEN`을 `.env`에 채우고, tsx로 두 어댑터를 실제 라이브 호출
- **YouTube**: "Wade in the Water"로 정상 매칭 확인 (videoId·썸네일 정상 반환)
- **Genius**: 처음엔 "Amazing Grace"를 검색했더니 **완전히 다른 콘텐츠**(Aaron Cohen이라는 저자가 쓴 책 발췌문, Genius가 "song" 타입으로 등록해둔 비-음악 텍스트)를 1순위로 가져오는 걸 발견 — `pickBestHit`의 제목 유사도 체크만으론 못 걸렀음
- 원인 조사: Genius 검색 결과 raw JSON을 직접 찍어보니, 실제 노래 가사 페이지는 URL이 `-lyrics`로 끝나고 Genius 자체 콘텐츠(책 발췌·기사·아티스트 아카이브)는 `-annotated`로 끝남 — `lyrics_state` 필드는 둘 다 `"complete"`라 구분에 못 씀
- `genius.ts`의 `pickBestHit`에 `hit.result.url.endsWith("-lyrics")` 조건을 추가해서 재검증 → "Amazing Grace"는 이제 정직하게 `NOT_FOUND`(틀린 콘텐츠를 가져오는 것보다 훨씬 나음), "Go Down Moses"는 여전히 정확하게 매칭됨(진짜 가사 텍스트 확인)

**왜 이렇게**:
- 부정확한 매칭을 그냥 두면 파이프라인이 "성공"으로 기록하고 완전히 엉뚱한 텍스트를 `lyrics.original_text`에 저장하게 됨 — 이게 조용히 넘어가면 검수 단계(P1-S5)에서 사람이 매번 원문 대조까지 다시 해야 해서 오히려 신뢰를 깎아먹음. `NOT_FOUND`로 명확히 실패시키는 게 부분 성공 처리(P1-S2-T6)와도 자연스럽게 맞물림 — 실패한 provider는 그 자리에서 빈 값으로 남기고 나머지(YouTube/Apple Music 등)는 저장하면 됨
- **"Traditional"을 아티스트로 검색하면 실패율이 높다**는 것도 이번에 확인됨(Wade in the Water/Amazing Grace/Swing Low 전부 이 필터 적용 후 `NOT_FOUND`) — Genius엔 특정 유명 아티스트의 커버 버전만 개별 곡으로 등록되는 경우가 많아서 그런 것으로 보임. 이건 코드 문제가 아니라 콘텐츠 소스의 한계라, 운영자가 곡 등록할 때 "Traditional" 대신 실제 유명 레코딩 아티스트(예: Mahalia Jackson, Sister Rosetta Tharpe 등 특정 커버)를 넣는 편이 매칭 성공률이 높을 것 — 검수 UI(P1-S5) 만들 때 이 점 반영 예정

**변경 파일**: `packages/integrations/src/adapters/genius.ts`, `.env`(비커밋, YOUTUBE_API_KEY·GENIUS_ACCESS_TOKEN 채움)

**검증**:
- `pnpm --filter @ongod/integrations typecheck/test` 재통과 (기존 mock 테스트 fixture URL이 이미 `-lyrics`로 끝나서 회귀 없음)
- tsx로 5개 쿼리 라이브 재실행: YouTube 1/1 성공, Genius는 "Go Down Moses"만 정확히 성공하고 나머지 4개는 (의도대로) `NOT_FOUND` — 오매칭 0건

**막힌 점 / 다음 할 일**:
- Genius 매칭 성공률이 낮은 편(5개 중 1개) — P1-S4(오케스트레이션)에서 실패를 어떻게 사람에게 보여줄지(검수 큐에 "가사 수동 입력 필요" 같은 상태로 노출) 설계할 때 감안해야 함
- Apple Music/Spotify는 여전히 실제 키 없음

## 2026-08-29 · P1-S3-T1~T6 — Claude 어댑터(가사 해석 + 곡 소개 + 성경구절 연계)

**Task**: [P1-S3-T1~T6](../phase-1-content-pipeline.md#s3-ai-가사-해석-파이프라인)
**한 일**:
- `packages/integrations/src/adapters/claude.ts` — `TranslationProvider` 구현. `@anthropic-ai/sdk` 공식 SDK 사용(`claude-api` 스킬 가이드에 따름)
- **구조화된 출력**: 자유 텍스트를 파싱하는 대신 `tool_choice: {type:"tool", name:...}`로 특정 tool 호출을 강제 — `provide_translation`(koreanTranslation, translationNotes), `provide_song_info`(descriptionKo, historicalContextKo, scriptureReference) 두 tool 정의. 응답의 `tool_use.input`을 zod 스키마로 재검증(T6) — 스키마를 어기면 `INVALID_RESPONSE`로 명확히 실패
- **프롬프트 버전 관리**(T6): `PROMPT_VERSION` 상수를 두고 `ai_model_used`에 `claude-sonnet-5/prompt-v1` 형태로 같이 기록 — 나중에 프롬프트를 바꾸면 이 값도 바뀌어서, DB에 저장된 콘텐츠가 어떤 프롬프트 버전으로 만들어졌는지 추적 가능
- **가사 해석 프롬프트**(T2): 절/후렴 구조 유지한 자연스러운 의역 + 흑인영가 특유의 이중적 의미(노예 해방·탈출 은유)와 성경 인용 출처를 `translationNotes`에 설명하도록 지시. 확실하지 않은 해석은 단정하지 말라는 지침 포함
- **곡 소개+역사적 맥락+성경구절**(T3, T4): 검증 안 된 사실 단정 금지, 노예제·인종차별 역사를 존중하는 어조 유지, 성경구절은 실제 근거 있을 때만(억지 연결 금지) 지시
- `packages/integrations/src/adapters/claude.test.ts` — 계약 테스트 7개. SDK가 내부적으로 쓰는 `fetch`를 `vi.stubGlobal`로 바꾸는 게 안 먹혀서(SDK가 constructor에서 받은 `fetch` 옵션을 우선시하고 전역 참조를 안 씀), `ClaudeConfig`에 테스트 전용 `fetch?` 옵션을 추가해 SDK 표준 방식대로 주입하는 걸로 해결
- 실제 Anthropic API로 라이브 검증까지 완료 (아래 "검증" 참고)

**왜 이렇게**:
- **Anthropic 키 인증 이슈**: 사람이 처음 발급한 키로 호출했더니 `anthropic-workspace-id is required when authenticating with an identity-linked API key`라는 400 에러가 남 — 여러 워크스페이스에 걸친 조직 계정에서 발급된 키라 요청마다 워크스페이스를 명시해야 하는 구조였음. 사람이 OnGod 전용 워크스페이스를 새로 만들고 그 안에서 키를 재발급받아 해결 — 헤더를 코드에서 억지로 넘기는 것보다 계정 구조를 정리하는 게 근본적인 해결책이라고 판단해 그쪽으로 안내함
- **모델 선택(claude-sonnet-5)**: `claude-api` 스킬 가이드는 "명시적 지시 없으면 무조건 opus-5" 원칙이지만, 이 파이프라인은 곡마다 반복 호출되는 운영 비용이 실제로 발생하는 구조라 비용 판단은 임의로 하지 않고 사람에게 확인함(Sonnet 5 $2/$10 vs Opus 5 $5/$25, 1M 토큰당). 번역·문화적 해설처럼 Sonnet 5가 충분히 강한 작업이라 Sonnet 5로 결정. 계획 문서의 `claude-sonnet-4-6`보다도 더 최신·저렴함
- **tool_choice로 구조화된 출력 강제**: 자유 텍스트 응답을 정규식/휴리스틱으로 파싱하는 것보다 훨씬 안정적이고, zod 검증과 자연스럽게 결합됨. `output_config.format`(구조화된 출력 파라미터) 대신 tool_choice를 쓴 이유는 이 방식이 훨씬 오래 검증된 표준 패턴이고 이 프로젝트 규모에 굳이 새 기능을 끌어올 필요가 없어서
- **fetch 주입 방식**: `vi.stubGlobal`이 SDK 내부에서 안 먹히는 걸 실제로 겪고 나서, Anthropic SDK가 공식 지원하는 `fetch` 생성자 옵션을 쓰는 걸로 전환 — 이게 SDK가 의도한 테스트 훅이라 억지스러운 우회가 아님

**변경 파일**: `packages/integrations/src/adapters/claude.ts`(신규), `claude.test.ts`(신규), `adapters/index.ts`, `package.json`(`@anthropic-ai/sdk`, `zod` 추가), `.env`(비커밋)

**검증**:
- `pnpm --filter @ongod/integrations typecheck/lint/test` 전부 통과 (38 tests, claude 관련 7개 신규 — 성공 케이스 2개, tool_use 없음/스키마 위반 각 1개, 401/429 에러 매핑 2개)
- **실제 Anthropic API 라이브 호출**: Genius에서 확보한 "Go Down Moses" 진짜 원문 가사로 `translateLyrics`/`generateSongInfo` 둘 다 실행 — 절/후렴 구조를 유지한 자연스러운 한국어 번역, 출애굽기 5장·8장 근거를 정확히 짚은 신학적 해설, 노예제와 지하철도(Underground Railroad) 연관성을 "~로 알려져 있다"는 신중한 어조로 서술한 역사적 맥락, `scriptureReference: "출애굽기 8:1"`까지 전부 정확하게 생성됨 확인

**막힌 점 / 다음 할 일**:
- **Phase 1 S3 전부 완료.** 다음은 S4(오케스트레이션) — 지금까지 만든 5개 provider(Genius/YouTube/Claude는 실키 검증됨, Apple Music/Spotify는 코드만 완성) 중 사용 가능한 것들을 조합해서 실제로 `songs`/`lyrics`/`song_info`를 채우는 로직
- Apple Music은 사람이 내일쯤 키 발급 예정 — 그 전까지 S4~S7 중 Apple Music 없이 진행 가능한 부분 먼저 진행

## 2026-08-29 · P1-S4-T1~T7 — 곡 등록 + 오케스트레이터

**Task**: [P1-S4-T1~T7](../phase-1-content-pipeline.md#s4-곡-등록--오케스트레이션), [P1-S2-T6](../phase-1-content-pipeline.md#s2-외부-api-어댑터-실연동)
**한 일**:
- **`apps/admin/lib/pipeline/providers.ts`**: env에 있는 키만으로 provider를 조립. Apple Music/Spotify는 조건부로만 등록 — 이게 그대로 부분 성공 처리(P1-S2-T6)의 토대가 됨
- **`apps/admin/lib/pipeline/orchestrator.ts`**(`runPipeline`): 메타데이터 병렬 수집(`Promise.allSettled`) → `songs` insert(장르/앨범/발매연도는 Apple Music 우선, 없으면 Spotify; 각 provider의 externalId/externalUrl은 각자의 DB 컬럼에) → 가사 수집(Genius) → 성공하면 번역+곡소개 병렬 생성(Claude) → (Storage 버킷 없어서) 앨범커버는 스킵 → 각 단계 결과를 `pipeline_runs.steps`(jsonb)에 기록, 최종 상태를 `done`/`partial`/`failed`로 계산
- **곡 등록 폼**(`app/(admin)/songs/new/`): `title`+`artist` 입력 → 중복 감지(`ilike` 대소문자 무시 비교) → `pipeline_runs` 행 생성 → **Next.js `after()`**로 오케스트레이터 실행 → 즉시 진행상황 페이지로 리다이렉트
- **진행상황 페이지**(`app/(admin)/pipeline-runs/[id]/`): `status`가 `running`이면 3초마다 자동 새로고침(클라이언트 컴포넌트가 `router.refresh()`), 단계별 상태를 색깔로 구분해 표시
- `packages/db/src/types/database.ts`/`mappers.ts`/`packages/core`에 `lyrics.source_url` 컬럼(가사 출처, 저작권 표기용) 추가 — Genius 어댑터가 이미 `sourceUrl`을 반환하는데 DB에 저장할 곳이 없었던 걸 이번에 발견. ADR-0003의 `album_cover_source_url`과 같은 패턴이라 마이그레이션 새로 추가(`20260829000001_lyrics_source_url.sql`)
- **버그 발견 및 수정**: `errorMessage()` 헬퍼가 `error instanceof Error`만 확인해서, supabase-js의 `PostgrestError`(Error를 상속하지 않는 plain object)를 만나면 `String(error)` → `"[object Object]"`로 뭉개버리는 문제 발견. `.message` 속성이 있으면 그걸 쓰고, 그것도 안 되면 `JSON.stringify`로 폴백하도록 수정
- `@types/react`/`@types/react-dom`을 `^19.0.0`(latest 자동 추적)에서 `19.1.17`/`19.1.9`로 고정 — 19.2.x가 `RootLayout`의 `{children}` 렌더링조차 타입 에러 내는 회귀 버그를 갖고 있어서(자체 재현: 새로 만든 파일이 아니라 P0-S1부터 있던 `app/layout.tsx`에서도 똑같이 발생) 알려진 안정 버전으로 되돌림

**왜 이렇게**:
- **`after()` vs Supabase Edge Function**(T6): 계획 문서는 Edge Function을 상정했지만, 실제 Edge Function 배포는 별도 인프라 작업(CLI 배포, Deno 런타임에서 npm 패키지 호환성 확인 등)이라 지금 범위에 비해 무거움. Next.js 15의 `after()`는 "응답을 먼저 보내고 같은 요청 생명주기 안에서 나머지를 실행"하는 공식 API라 Vercel의 `waitUntil`류 패턴과 동일한 효과를 얻으면서 별도 배포가 필요 없음. 오케스트레이터 함수 자체는 순수하게 (입력) → (DB 부수효과)라서, 나중에 진짜 Edge Function으로 옮기더라도 이 함수를 거의 그대로 재사용 가능하게 짬 — 완전히 다른 접근이 아니라 "지금 당장 쓸 수 있는 더 가벼운 구현"으로 판단
- **메타데이터 병합 우선순위(Apple Music > Spotify)**: Apple Music 카탈로그가 흑인영가/가스펠처럼 마이너한 장르에서 더 넓다고 판단(사람이 Apple Music 키 발급 중인 것도 이런 맥락). 각 provider의 고유 ID/URL은 병합하지 않고 각자의 DB 컬럼(`apple_music_id`/`spotify_id`/`youtube_id` 등)에 그대로 저장 — 원래 스키마가 이미 그렇게 설계돼 있어서 자연스러움
- **`lyrics.source_url` 스키마 갭을 지금 고친 이유**: `human-actions.md`의 출시 체크리스트에 "가사 저작권 출처 표기 최종 점검"이 이미 있었는데, 그걸 지킬 컬럼 자체가 없었음. 나중에 발견하면 이미 쌓인 가사 데이터를 전부 다시 수집해야 하니, 오케스트레이터를 짜는 지금 바로 잡는 게 훨씬 쌈
- **`errorMessage` 버그를 그냥 넘기지 않은 이유**: 처음 dev DB에서 파이프라인을 실제로 돌렸을 때 `lyrics: failed` 아래 `[object Object]`만 뜨는 걸 보고, "왜 실패했는지 운영자가 알 수 없는 에러 메시지"는 검수 UI(S5)에서도 똑같이 문제가 될 거라 바로 고침. 실제로 고치고 나니 진짜 원인(컬럼 없음)이 정확히 드러남
- **`@types/react` 19.1.x로 고정한 이유**: `^19.0.0` 범위를 그대로 뒀으면 나중에 pnpm install할 때마다 19.2.x의 최신 patch가 다시 딸려올 수 있음(semver 범위가 자동으로 최신을 골라서). 문제가 확인된 이상 정확한 버전으로 고정해두는 게 재발을 막음

**변경 파일**: `apps/admin/lib/pipeline/**`(신규), `apps/admin/app/(admin)/songs/new/**`(신규), `apps/admin/app/(admin)/pipeline-runs/[id]/**`(신규), `apps/admin/app/(admin)/layout.tsx`(사이드바 링크 활성화), `apps/admin/lib/env.server.ts`(파이프라인 키 스키마 추가), `apps/admin/package.json`(`@ongod/core`/`@ongod/integrations` 추가, `@types/react*` 버전 고정), `apps/admin/.env.local`(비커밋), `packages/db/src/types/database.ts`/`mappers.ts`/`mappers.test.ts`, `packages/core/src/domain/types.ts`, `supabase/migrations/20260829000001_lyrics_source_url.sql`(신규, dev/prod 미적용)

**검증**:
- `pnpm --filter @ongod/admin typecheck/lint/build` 전부 통과
- **브라우저로 실제 end-to-end 검증**(dev Supabase, `test@ongod.com` 계정으로 실제 로그인):
  1. "Go Down Moses"/"Traditional" 첫 등록 → 파이프라인 실행 → YouTube 메타데이터 정상 수집(`songs.youtube_url` 채워짐), Genius는 성공했으나 **`lyrics` insert가 DB 에러로 실패**(아래 참고)
  2. 같은 곡 재등록 시도 → **중복 감지가 정확히 차단**(`이미 등록된 곡이다... song id: ...`)
  3. "Wade in the Water"/"Traditional" 등록 → YouTube 성공, Genius는 매칭 실패(NOT_FOUND, 앞선 로그에서 이미 확인된 패턴) → **`pipeline_runs.status = "partial"`**로 정확히 계산되고 화면에 단계별로 표시됨 → 부분 성공 처리(P1-S2-T6) 실제 확인
  4. 진행상황 페이지가 `running` 상태일 때 자동 새로고침되다가 완료되면 멈추는 것 확인
- **`[object Object]` 에러를 실제로 재현하고 원인을 추적**: 별도 tsx 스크립트로 `lyrics` insert에 `source_url`을 넣어봤더니 `PGRST204: Could not find the 'source_url' column of 'lyrics' in the schema cache`로 재현 — 마이그레이션 미적용이 진짜 원인임을 확정. `errorMessage()` 수정 후 화면에 이 메시지가 그대로 나오는 것까지 확인
- 테스트로 생성된 `__column_check__`/`__test__` 더미 곡은 스크립트에서 바로 삭제해 정리함. "Go Down Moses"/"Wade in the Water" 테스트 데이터는 dev DB에 남아있음(이후 재검증에 재사용 가능)

**막힌 점 / 다음 할 일**:
- **사람 확인 필요(긴급)**: `lyrics.source_url` 마이그레이션을 dev+prod에 SQL Editor로 실행해야 가사 수집이 실제로 저장됨 — `human-actions.md`에 추가함
- 마이그레이션 적용되면 "Go Down Moses"로 다시 등록(또는 기존 테스트 데이터에 가사만 재시도)해서 T3/T4(가사+AI 해석)까지 end-to-end로 마저 검증할 것
- P1-S4-T5(앨범커버 Storage)는 T8(버킷 생성, 사람 확인) 대기
- 다음은 S5(검수 UI) — 지금까지 파이프라인이 채운 `songs`/`lyrics`/`song_info`를 나란히 보여주고 인라인 편집하는 화면

## 2026-08-29 · P1-S4-T3/T4 후속 — lyrics.source_url 마이그레이션 적용, 파이프라인 end-to-end 검증 완료

**Task**: [P1-S4-T3~T4](../phase-1-content-pipeline.md#s4-곡-등록--오케스트레이션)
**한 일**:
- 사람이 새로 Supabase PAT(`sbp_...`)를 발급해 전달 — `supabase projects list`로 `ongod-dev`/`ongod-prod` 둘 다 접근 가능함을 먼저 확인
- Management API(`POST /v1/projects/{ref}/database/query`)로 `alter table lyrics add column source_url text;`를 dev·prod 둘 다에 직접 실행. `information_schema.columns` 조회로 실제 컬럼 생성 확인
- **CLI 마이그레이션 이력 동기화**: Management API로 직접 SQL을 실행하면 `supabase_migrations.schema_migrations`에 자동 기록이 안 된다는 걸 확인(직접 조회해서 최신 버전이 `20260828104705`에 멈춰있는 걸 발견) → 수동으로 `insert into supabase_migrations.schema_migrations (version, name, statements) values ('20260829000001', 'lyrics_source_url', ...)`를 dev·prod 둘 다에 실행해 CLI 관점에서도 "이미 적용됨" 상태로 맞춤 — 안 해두면 나중에 `supabase db push`가 이 마이그레이션을 다시 적용하려다 "컬럼 이미 있음" 에러를 낼 뻔함
- 이전 테스트로 dev에 남아있던 실패한 테스트 곡("Go Down Moses", "Wade in the Water")을 Management API로 정리(songs/lyrics/song_info/pipeline_runs 관련 행 삭제) 후, 브라우저로 "Go Down Moses"를 처음부터 다시 등록해 **전체 파이프라인을 end-to-end로 재검증**
- 최종 확인: `metadata: done`, `lyrics: done`, `songInfo: done`, `translation: done`, `albumCover: skipped`(버킷 없음, 의도대로) — 전체 상태 "부분 성공". DB에서 직접 조회해 `lyrics.source_url`(Genius 곡 페이지 URL), `ai_model_used`(`claude-sonnet-5/prompt-v1`), 한국어 번역, `song_info.scripture_reference`(`출애굽기 8:1`), 곡 소개까지 전부 정확히 저장된 것 확인

**왜 이렇게**:
- **Management API 직접 호출 vs CLI**: CLI(`supabase db push`)는 이 세션의 기존 로그인(다른 계정)과 충돌하거나 별도 프로젝트 링크가 필요해서, PAT를 `Authorization: Bearer`로 바로 쓰는 Management API 쪽이 더 빠르고 확실했음. 대신 CLI가 자동으로 해주는 마이그레이션 이력 기록을 수동으로 챙겨야 했는데, 이걸 빠뜨렸으면 다음에 `supabase db push`를 실행하는 세션(사람이든 다른 에이전트든)이 혼란을 겪었을 것 — 그래서 바로 확인하고 맞춰둠
- **테스트 데이터를 지우고 재검증한 이유**: 실패했던 테스트 곡을 그대로 두고 "이제 될 것이다"라고 넘어가는 대신, 실제로 처음부터 다시 돌려서 진짜 성공하는지 눈으로 확인하는 게 유일하게 신뢰할 수 있는 검증 방법이라고 판단

**변경 파일**: 없음(스키마는 이미 커밋된 마이그레이션 파일 그대로, 이번엔 그걸 실제 클라우드 DB에 반영만 함)

**검증**: 위 "한 일" 자체가 검증 — Management API로 직접 DB 조회해서 컬럼 생성, 마이그레이션 이력, 최종 저장된 콘텐츠까지 전부 실제 값으로 확인함

**막힌 점 / 다음 할 일**:
- **Phase 1 S4는 T5(앨범커버 Storage)만 남음** — T8(버킷 생성, 사람 확인) 대기 중
- 다음은 S5(검수 UI) — 이제 실제 데이터가 dev DB에 있으니 (곡 1개, 가사+번역+곡소개 전부 채워진 상태) 검수 화면을 만들면 바로 실제 데이터로 확인 가능

## 2026-08-29 · P1-S5-T1~T5 — 검수 UI

**Task**: [P1-S5-T1~T5](../phase-1-content-pipeline.md#s5-검수-ui)
**한 일**:
- `app/(admin)/review/page.tsx`: 검수 큐 목록. `songs`에 `lyrics(is_verified)`/`song_info(is_verified)`를 PostgREST 임베디드 조인으로 한 번에 가져와서(둘 다 `song_id`에 unique 제약이 있어서 배열이 아니라 단일 객체로 옴), 둘 중 하나라도 미검수면 "검수 대기"로 분류
- `app/(admin)/review/[id]/`: 검수 상세 화면(T1) — 스트리밍 링크(T3) / 원문+한국어 번역(나란히 배치) / 곡 소개+역사적 맥락+성경구절 세 섹션. 각 섹션이 독립된 폼+Server Action이라 한쪽 저장 실패가 다른 쪽에 영향 안 줌
- **`actions.ts`의 편집 액션은 `update`가 아니라 `upsert(onConflict: "song_id")`를 씀**(T2): 파이프라인이 부분 실패하면 `lyrics`/`song_info` 행 자체가 없을 수 있는데(설계상 정상 상황), 운영자가 검수 화면에서 바로 채워 넣을 수 있어야 하기 때문 — `update`였다면 행이 없을 때 조용히 아무 일도 안 일어나서 "저장했는데 안 됨" 버그가 됐을 것
- **검수 완료(T4)**: `markVerified`가 `lyrics`/`song_info` 둘 다 `is_verified=true`로. 수동 편집(`updateLyrics`/`updateSongInfo`)은 `is_verified`를 안 건드림 — 사람이 이미 확인한 문장을 오타 하나 고쳤다고 검수 상태가 풀리면 오히려 번거로움
- **AI 재생성(T5)**: `regenerateTranslation`/`regenerateSongInfo`가 기존 `packages/integrations`의 Claude provider를 그대로 재사용(오케스트레이터와 코드 중복 없음). 재생성 결과는 **`is_verified=false`로 되돌림** — 새로 만든 내용은 다시 검수해야 하니까
- 각 편집 폼(`lyrics-form.tsx`/`song-info-form.tsx`)에 `key={row?.updated_at ?? "new"}`를 부모(`page.tsx`)에서 넘김 — `revalidatePath` 후 서버가 새 값을 내려줘도 `defaultValue`를 쓰는 비제어(uncontrolled) textarea는 리마운트 전엔 안 갱신되는데, `updated_at`이 바뀌면 React가 컴포넌트를 새로 마운트해서 항상 최신 값을 보여주게 만듦
- **버그 발견 및 수정**: `actions.ts`에 안 쓰는 상수 `INITIAL_FORM_STATE`를 `export`해뒀다가 `"A 'use server' file can only export async functions, found object"` 런타임 에러로 즉시 걸림 — Next.js Server Action 파일은 async 함수만 값으로 export 가능(타입/인터페이스는 허용). 브라우저로 실제 클릭해보다가 발견, 안 쓰는 export라 바로 삭제
- **Genius 파싱 개선**: 검수 화면에서 실제 수집된 원문을 보다가 `"2 ContributorsGo Down Moses LyricsTraditional"` 같은 Genius 페이지 헤더 텍스트가 가사 맨 앞줄에 섞여 들어온 걸 발견. `genius.ts`에 `stripGeniusPageHeader()` 추가(정규식으로 `"N Contributors...Lyrics..."` 패턴인 첫 줄만 제거) — HTML class 선택자 대신 정규식을 쓴 이유는 Genius의 class명이 언제든 바뀔 수 있어서, 실제 가사 첫 줄이 우연히 이 모양일 확률은 사실상 없는 안정적인 패턴. dev DB에 이미 저장된 기존 데이터도 Management API로 같은 패턴 제거해 정리

**왜 이렇게**:
- **섹션별 독립 폼**: 하나의 거대한 폼으로 만들면 스트리밍 링크만 고치고 싶을 때도 가사 전체를 같이 제출해야 해서 실수로 덮어쓸 위험이 있음. 독립된 Server Action 여러 개가 코드량은 조금 늘지만, 각 저장이 원자적이고 실패 지점이 명확해서 유지보수에 유리하다고 판단
- **`upsert` 채택**: 처음엔 `update`로 짰다가, "가사 수집이 실패한 곡을 검수 화면에서 열면 어떻게 되나?"를 생각해보니 `lyrics` 행이 없어서 `update`가 아무것도 안 하고 조용히 성공(0 rows affected)해버리는 게 보여서 바로 `upsert`로 바꿈 — 부분 성공 설계(P1-S2-T6)를 UI까지 일관되게 반영
- **`key` prop으로 리마운트 유도**: state 동기화를 위해 `useEffect`로 props 변경을 감지해 수동으로 textarea 값을 갱신하는 방법도 있었지만, React가 이미 제공하는 `key` 기반 리마운트가 코드량이 훨씬 적고 버그 낼 여지가 없어서 이쪽을 택함
- **Genius 헤더 제거를 지금 고친 이유**: 검수 UI를 실제로 써보지 않았다면 이 문제를 몰랐을 것 — 원문 데이터 품질이 나쁘면 그걸 기반으로 하는 AI 번역/해석 품질도 같이 나빠지므로, 발견한 김에 근본 원인(수집 단계)에서 고치는 게 검수 단계에서 매번 사람이 수동으로 잘라내는 것보다 나음

**변경 파일**: `apps/admin/app/(admin)/review/**`(신규), `apps/admin/app/(admin)/layout.tsx`(사이드바 링크 활성화), `packages/integrations/src/adapters/genius.ts`/`genius.test.ts`(페이지 헤더 제거)

**검증**:
- `pnpm --filter @ongod/admin typecheck/lint/build`, `pnpm --filter @ongod/integrations typecheck/test`(39 tests, genius 헤더 제거 케이스 추가) 전부 통과
- **브라우저로 실제 dev DB 대상 end-to-end 검증**: 검수 큐 목록(대기 1건) → 상세 화면 진입 → "검수 완료로 표시" 클릭 → 즉시 "✓ 검수 완료됨" + 큐 목록도 "완료" 섹션으로 이동 확인 → 곡 소개 텍스트를 직접 편집해 저장 → 반영되고 검수 상태는 유지됨 확인 → "AI로 소개 재생성" 클릭 → 실제 Claude 호출로 새 내용 생성되고 `(미검수)`로 초기화됨 확인
- `"use server"` export 버그를 실제 클릭 중 런타임 에러로 발견 → 수정 → 재빌드·재검증
- Genius 헤더 제거 로직도 실제 dev DB 데이터로 정리해 확인(더 이상 "Contributors"로 시작하지 않음)

**막힌 점 / 다음 할 일**:
- **Phase 1 S5 자동화 부분(T1~T5) 전부 완료.** T6(실제 콘텐츠 검수)는 사람 몫 — 지금 dev DB의 "Go Down Moses"가 검수 대기 상태(`/review`에서 확인 가능)
- 다음은 S6(예약 발행 시스템) — `status=scheduled`→`published` 전환, KST 자정 기준 cron

## 2026-08-29 · P1-S6-T1~T7 — 예약 발행 시스템

**Task**: [P1-S6-T1~T7](../phase-1-content-pipeline.md#s6-예약-발행-시스템)
**한 일**:
- **`publish_scheduled_daily_picks()`**(`supabase/migrations/20260829010000_publish_scheduled_picks.sql`): `daily_picks`가 `scheduled`이고 `pick_date`가 KST 기준 오늘이거나 지났고, `lyrics`/`song_info` 둘 다 `is_verified=true`인 것만 `published`로 전이하는 plpgsql 함수(T4, T5, T6)
- **pg_cron**: `create extension pg_cron` 후 `cron.schedule('publish-daily-picks-kst-midnight', '0 15 * * *', 'select public.publish_scheduled_daily_picks();')` — UTC 15:00 = KST 00:00(T3). Management API로 dev·prod 둘 다 실제 설치·등록·활성화까지 완료(`cron.job.active = true`)
- **`app/(admin)/schedule/`**: 발행 일정 페이지(T1). KST 기준 앞으로 14일 목록, 각 날짜에 배정된 곡 또는 "(비어있음)" 표시, 비어있는 날짜 수를 상단에 경고로(T2). 배정 후보는 **검수 완료된 곡 중 아직 배정 안 된 것만** 드롭다운에 노출
- `assignSchedule` 액션: `daily_picks` insert. `pick_date` UNIQUE 위반(Postgres 에러코드 `23505`)을 잡아서 "이미 다른 곡이 배정돼 있다"는 한글 메시지로 변환(T2)
- `unassignSchedule`: `status='scheduled'`인 것만 삭제 가능하게 조건을 걸어서, 이미 발행된(`published`) 항목을 실수로 취소 못 하게 막음

**왜 이렇게**:
- **Edge Function 대신 pg_cron + DB 함수**(T3): 이 작업은 P1-S4-T6(파이프라인 비동기 실행)과 성격이 다르다 — 파이프라인은 "요청이 들어오면" 실행되지만, 예약 발행은 **아무 요청 없이 순수하게 시각 기반**으로 실행돼야 한다. Next.js `after()`는 요청 생명주기에 종속되니 이 경우엔 애초에 쓸 수 없고, Vercel Cron은 실제 배포(P0-S6-T4, 아직 사람 대기 중)가 있어야 동작한다. pg_cron은 Postgres 안에서 완결되는 방식이라 **애플리케이션 서버가 배포됐는지, 심지어 켜져 있는지와 무관하게** 항상 동작한다 — SRS가 원래 상정한 "Edge Function"보다 오히려 더 견고한 선택이라고 판단해서 바꿈(P1-S4-T6 때와 마찬가지로 원래 계획과 다른 구현을 택한 사례, 이유를 로그로 남겨서 다음 세션이 "왜 Edge Function이 아니지?"라고 헷갈리지 않게 함)
- **검수 실패 시 "건너뛰기"(T5)**: 발행 실패를 별도 상태로 표시하는 대신, 그냥 `scheduled`로 남겨두고 다음 실행 때 재시도되게 함 — 검수가 그날 중으로 끝나면 자정 이후 첫 cron 실행에서 바로 발행되고, 별도 알림/에러 처리 로직을 새로 만들 필요가 없음. 단점(그날 "오늘의 카드"가 없을 수 있음)은 S7 대시보드에서 "곧 발행일인데 미검수" 경고로 보완할 예정
- **배정 후보를 검수 완료된 곡으로 제한(T1)**: 미검수 곡도 예약이야 할 수 있지만(어차피 T5가 발행을 막아줌), 애초에 후보에서 빼는 게 운영자가 "왜 예약했는데 발행이 안 되지?"라고 헷갈릴 상황 자체를 없앰
- **`unassignSchedule`에 `status='scheduled'` 조건**: 이미 발행된 콘텐츠를 관리자 UI에서 실수로 지우면 앱에 노출 중인 카드가 갑자기 사라지는 문제가 생길 수 있어서, 아예 그 경로를 DB 쿼리 조건으로 차단(UI에서도 버튼을 숨기지만, 서버 액션 자체도 이중으로 방어)

**변경 파일**: `supabase/migrations/20260829010000_publish_scheduled_picks.sql`(신규), `apps/admin/app/(admin)/schedule/**`(신규), `apps/admin/app/(admin)/layout.tsx`(사이드바 링크 활성화)

**검증**:
- `pnpm --filter @ongod/admin typecheck/lint/build` 통과
- **브라우저로 실제 dev DB 대상 검증**: 검수 완료된 "Go Down Moses"를 오늘 날짜(2026-08-29)로 배정 → "예약됨" 상태로 화면에 반영, "새로 배정" 후보 목록에서 사라짐, 빈 날짜 경고가 14→13으로 갱신
- **`publish_scheduled_daily_picks()`를 Management API로 직접 호출**(cron이 실제로 KST 자정까지 기다리지 않고도 로직 검증): 1회차 호출 → `status: published`, `published_at` 기록됨 확인 → `lyrics.is_verified`를 일부러 `false`로 되돌리고 재호출 → **빈 결과**(발행 스킵) 확인 → 다시 `true`로 복구 후 재호출 → 정상 발행 확인. 화면에서도 "발행됨" 상태와 취소 버튼이 사라진 것 확인
- dev·prod 둘 다 `pg_cron` 확장 설치 및 `cron.job` 등록·`active=true` 확인, 마이그레이션 이력 테이블에도 기록

**막힌 점 / 다음 할 일**:
- **Phase 1 S6 전부 완료.** 실제 KST 자정에 cron이 저절로 도는지는 시간이 지나야 확인되지만, 함수 자체의 정확성은 직접 호출로 이미 검증됨
- 다음은 S7(어드민 대시보드) — 곡 목록/발행 캘린더/검수 대기 큐/콘텐츠 재고 경고

## 2026-08-29 · P1-S7-T1~T5 — 어드민 대시보드

**Task**: [P1-S7-T1~T5](../phase-1-content-pipeline.md#s7-어드민-대시보드)
**한 일**:
- **`app/(admin)/page.tsx`**(기존 placeholder를 실제 대시보드로 교체): 통계 카드(전체 곡/검수 대기/예약됨/발행됨), 콘텐츠 재고 경고(T4), 빠른 링크, **KST 기준 이번 달 발행 캘린더 그리드**(T2, 일요일 시작 7열 grid, 각 칸에 날짜+배정곡+상태색)
- **`app/(admin)/songs/`**(T1, T5): 곡 목록(`page.tsx`) — 검색은 `?q=`로 DB 레벨 `ilike` 검색(제목·아티스트), 검수 상태 필터는 결과 셋이 작아서 인메모리 필터. 수정은 새로 안 만들고 **기존 `/review/[id]`(P1-S5)로 링크만**(중복 구현 방지). 삭제(`actions.ts`)는 `daily_picks.song_id`의 `on delete restrict`(P0-S2-T3) FK 위반(`23503`)을 "발행 일정 이력이 있어서 삭제할 수 없다"는 한글 메시지로 변환
- **재고 경고 로직**(T4)을 `/schedule`(P1-S6)과 `/`(대시보드) 둘 다에서 쓰길래, "오늘부터 N일 중 `daily_picks`가 없는 날짜 수" 계산을 대시보드 쪽에 `countEmptyUpcomingDays()`로 정리 — 완전히 같은 로직을 두 파일에 복붙하지 않고, 각자 자기 페이지에 맞는 최소 버전을 따로 둠(스케줄 페이지는 상세 날짜 목록까지 필요하고 대시보드는 개수만 필요해서 억지로 공유 모듈로 뽑는 것보다 이게 더 단순했음)
- **삭제 확인 UX를 `window.confirm()`이 아니라 인라인 2단계 확인**(예/아니오 버튼)으로 구현 — 실제로 이 프로젝트의 브라우저 자동화 도구로 검증하다가 `confirm()`이 "native JavaScript dialogs are disabled"로 항상 `false`를 반환하는 걸 직접 겪음. 프로덕션 브라우저에서야 `confirm()`도 동작은 하지만, 각종 자동화 테스트 환경에서 이렇게 막히는 사례가 흔하다는 걸 실제로 확인한 셈이라 커스텀 UI로 바꿈(더 테스트하기 쉽고, 스타일링도 가능해짐)

**왜 이렇게**:
- **검수 대기 큐(T3)를 새로 안 만듦**: `/review`가 이미 정확히 이 역할(검수 대기 목록 + 진입점)을 하고 있어서, S7이라고 또 다른 "검수 대기" 화면을 만들면 같은 데이터를 보여주는 화면이 두 개가 되어 나중에 한쪽만 고치고 다른 쪽을 깜빡하는 식의 버그가 생기기 쉬움. 대신 대시보드에는 "검수 대기 N건" 통계 카드 + `/review` 링크만 둬서, 진짜 목록은 한 곳(단일 진실 공급원)에만 있게 함
- **캘린더를 진짜 그리드로 만든 이유**: `/schedule`(S6)이 이미 날짜순 테이블을 보여주지만, "이번 달 전체를 한눈에" 보는 용도로는 표보다 달력 모양이 실제로 더 직관적이라고 판단 — 두 화면이 겹치는 것 같아도 목적이 다르다(스케줄 페이지=앞으로 채워야 할 일정 관리용 액션 화면, 대시보드 캘린더=지나간 발행 이력까지 포함한 월간 개요용 읽기 전용 화면)
- **곡 수정 화면을 새로 안 만들고 `/review/[id]` 재사용**: 이미 스트리밍 링크/가사/번역/소개를 전부 편집할 수 있는 화면이 있는데 "곡 수정"이라는 이름의 또 다른 편집 화면을 만들면 완전히 중복 — 곡 목록에서 제목을 클릭하면 바로 그 화면으로 가게만 연결

**변경 파일**: `apps/admin/app/(admin)/page.tsx`(대시보드로 교체), `apps/admin/app/(admin)/songs/**`(신규: `page.tsx`, `actions.ts`, `delete-button.tsx`), `apps/admin/app/(admin)/layout.tsx`(사이드바 "곡 목록" 링크 추가)

**검증**:
- `pnpm --filter @ongod/admin typecheck/lint/build` 통과
- **브라우저로 실제 dev DB 대상 검증**: 대시보드에서 통계(전체 곡 1, 발행됨 1)·재고 경고(14일 중 13일 비어있음)·8월 캘린더에 29일 "Go Down Moses"가 발행됨(초록)으로 정확히 표시되는 것 확인
- 곡 목록에서 "moses" 검색 → 정확히 필터링 확인
- 삭제 버튼 → 인라인 확인 UI(네이티브 `confirm()` 아님, 자동화 도구로 직접 검증 가능함을 확인) → "예" 클릭 → **FK 제약으로 정확히 거부**되고 친절한 한글 메시지 표시, 실제로 곡이 삭제 안 된 것까지 확인

**막힌 점 / 다음 할 일**:
- **Phase 1 S7 전부 완료. 이걸로 Phase 1 자동화 가능한 부분(S1~S7)이 사실상 다 끝남.**
- 남은 건 전부 사람 몫: P1-S2-T0a(Apple Music 키), P1-S4-T8(Storage 버킷), P1-S5-T6(실제 콘텐츠 검수, 지속 운영)
- Phase 1 종료 기준("곡 1개를 폼 입력만으로 전체 파이프라인 통과 → 완성 콘텐츠 생성" 등)은 오늘 "Go Down Moses" 하나로 이미 실제로 증명됨. 앨범커버 Storage(P1-S4-T5)만 버킷 생기면 마저 붙이면 됨

## 2026-08-29 · P1-S4-T5, P1-S4-T8 — 앨범커버 Storage 복사 + 위젯용 썸네일

**Task**: [P1-S4-T5, T8](../phase-1-content-pipeline.md#s4-곡-등록--오케스트레이션), ADR-0003
**한 일**:
- **Storage 버킷 생성**(T8): 사람이 발급해준 Supabase PAT로 Management API가 아니라 **프로젝트 자체의 Storage REST API**(`POST {project_url}/storage/v1/bucket`, 이미 갖고 있던 `SUPABASE_SERVICE_ROLE_KEY`로 인증)를 직접 호출 — `album-covers` 버킷(공개 읽기, 5MB 제한, webp/jpeg/png만 허용)을 dev·prod 둘 다 생성
- **`songs.album_cover_thumbnail_url` 컬럼 추가**: ADR-0003이 "위젯용 작은 사이즈 변형도 동일 파이프라인에서 함께 생성"한다고 이미 명시했는데 저장할 컬럼이 없었음 — `album_cover_url`(메인 600×600)과 별개로 위젯(P3-S1-T3)이 쓸 150×150 썸네일 경로를 명시적 컬럼으로 추가(마이그레이션 `20260829020000`, dev·prod 적용)
- **`apps/admin/lib/pipeline/album-cover.ts`**(`copyAlbumCoverToStorage`): 외부 URL → `fetch`로 다운로드 → `sharp`로 WebP 변환(메인 600px, 위젯용 150px, 둘 다 `fit:"cover"`) → Storage에 병렬 업로드 → 공개 URL 반환
- **오케스트레이터에 통합**: `songs` insert 직후(가사/AI 해석 이후) 이 함수를 호출해서 `songs.album_cover_url`/`album_cover_thumbnail_url`을 Storage 경로로 UPDATE. 실패해도 `album_cover_source_url`엔 원본이 이미 들어있어서 "이미지가 아예 없는" 상태는 아님 — `pipeline_runs.steps.albumCover`에 실패로 기록하고 다음 단계로 계속 진행(부분 성공 처리, P1-S2-T6과 일관)
- **앨범커버 소스 fallback 확장**: 기존엔 `appleMusic ?? spotify`만 앨범커버로 썼는데, 아직 둘 다 키가 없는 지금은 이러면 커버가 항상 null임. YouTube 썸네일을 최후 fallback으로 추가(`primary?.albumCoverUrl ?? youtube?.albumCoverUrl`) — album/genre/releaseYear는 여전히 `appleMusic ?? spotify`만(YouTube엔 그 정보가 없음), 커버 URL만 별도로 fallback 체인을 늘림
- 파이프라인 진행상황 페이지(`pipeline-runs/[id]`)에 앨범커버 미리보기 이미지 추가

**왜 이렇게**:
- **Storage API 직접 호출 vs Management API**: 버킷 생성은 프로젝트 레벨 리소스라 이미 갖고 있는 service_role 키로 충분했음 — 굳이 PAT/Management API를 또 쓸 필요 없이 더 직접적인 경로를 택함(원래 계획엔 "사람이 대시보드에서 버킷 생성"이었지만, PAT 없이도 애초에 service_role 키만으로 가능했던 작업이라는 걸 이번에 확인함 — 다음에 비슷한 Storage 작업이 필요하면 PAT부터 찾을 필요 없이 이 방법을 먼저 시도하면 됨)
- **YouTube 썸네일을 fallback으로 추가**: "커버 이미지가 아예 없는 것"보다 "영상 썸네일이라도 있는 것"이 사용자 경험상 명백히 나음. Apple Music 키가 생기면 그게 우선순위 1번이라 자동으로 더 정확한 앨범 아트로 교체됨(이 fallback 코드를 나중에 걷어낼 필요조차 없음 — 우선순위 체인이 자연스럽게 처리)
- **실패해도 계속 진행**: Storage 업로드가 실패해도(네트워크 문제 등) 이미 원본 URL이 `songs.album_cover_url`에 들어있어서 완전 방치 상태가 아님 — 다만 이건 "만료될 수 있는 임시 상태"이므로, 실패 사실은 `pipeline_runs.steps`에 남겨서 나중에 재시도 대상이 뭔지 추적 가능하게 함

**변경 파일**: `supabase/migrations/20260829020000_album_cover_thumbnail.sql`(신규), `apps/admin/lib/pipeline/album-cover.ts`(신규), `apps/admin/lib/pipeline/orchestrator.ts`, `apps/admin/app/(admin)/pipeline-runs/[id]/page.tsx`(썸네일 미리보기), `apps/admin/package.json`(`sharp` 추가), `pnpm-workspace.yaml`(`sharp` postinstall 허용), `packages/db/src/types/database.ts`, `packages/db/src/mappers.ts`, `packages/core/src/domain/types.ts`

**검증**:
- `pnpm --filter @ongod/admin typecheck/lint/build`, `pnpm --filter @ongod/db typecheck/test`, `pnpm --filter @ongod/core typecheck` 전부 통과
- Storage 버킷 생성 API 응답 확인 + `GET /storage/v1/bucket` 목록 조회로 실제 존재 확인(dev)
- **브라우저로 실제 dev DB 대상 검증**: "Swing Low, Sweet Chariot"을 새로 등록 → 파이프라인 진행상황 페이지에 **실제 앨범커버 이미지가 렌더링**됨 확인(YouTube 썸네일 기반), `albumCover: done` 표시
- DB에서 직접 조회: `album_cover_url`이 Supabase Storage 경로로 바뀌었고 `album_cover_source_url`엔 원본 YouTube 썸네일 URL이 그대로 남아있음(ADR-0003 의도대로) 확인
- **Storage에 실제 업로드된 파일을 `curl`로 직접 확인**: 메인 이미지(`content-type: image/webp`, 19,542 bytes)와 위젯용 썸네일(`image/webp`, 3,504 bytes) 둘 다 인증 없이 공개 접근 가능(HTTP 200), CORS 헤더도 있음

**막힌 점 / 다음 할 일**:
- **Phase 1 S4 전부 완료.** 이걸로 Phase 1 전체(S1~S7)가 사람 개입 없이 갈 수 있는 데까지 다 감
- 남은 건 정말로 사람만 할 수 있는 것뿐: P1-S2-T0a(Apple Music 키 — 발급되면 앨범커버 우선순위 1번으로 자동 승격됨), P1-S5-T6(실제 콘텐츠 검수, 지속 운영)

<!-- 아래에 새 로그 항목을 계속 추가한다 -->
