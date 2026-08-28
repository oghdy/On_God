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

<!-- 아래에 새 로그 항목을 계속 추가한다 -->
