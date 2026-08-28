# Phase 0 — Foundation (기초 인프라)

> **목표**: 앱·어드민·백엔드가 공유하는 뼈대를 세운다. 여기서 정한 구조가 전체 코드베이스의 형태를 결정하므로, 가장 신중하게 진행한다.
> **완료 정의(DoD)**: 빈 어드민 앱과 빈 모바일 앱이 같은 모노레포에서 빌드되고, 공유 타입으로 Supabase에 연결되며, CI가 통과한다.

> 담당자 범례: 🤖 에이전트(Claude) · 🧑 사람(당신) · 🤝 협업. 자세한 내용은 [OVERVIEW](./OVERVIEW.md#담당자-범례-task-앞-아이콘). 작업 시작 전 [handoff.md](./logs/handoff.md) 확인, 완료 후 [logs/](./logs/)에 기록.

## 진행 체크리스트

- [x] S1. 모노레포 구조 설계
- [ ] S2. Supabase 프로젝트 & DB 스키마
- [x] S3. 공유 패키지 (타입·설정·유틸)
- [x] S4. 외부 서비스 추상화 레이어
- [ ] S5. 환경·시크릿 관리 (T4만 남음 — Phase 1 외부 API 키 발급 후)
- [ ] S6. CI/CD 기초

---

## S1. 모노레포 구조 설계

> 경계를 코드 구조로 강제한다. 패키지가 분리되어 있으면 "어디에 둘지" 고민이 사라지고, 잘못된 의존(앱이 어드민 코드를 import 등)이 빌드 단계에서 차단된다.

**선택**: pnpm workspaces + Turborepo

```
ongod/
├── apps/
│   ├── mobile/          # Expo (React Native) — 유저 앱
│   └── admin/           # Next.js — 운영자 어드민
├── packages/
│   ├── core/            # 순수 도메인 로직 (프레임워크 무관)
│   ├── db/              # Supabase 클라이언트 + 자동생성 타입
│   ├── integrations/    # 외부 API 어댑터
│   ├── config/          # 공유 설정 (eslint, tsconfig, 상수)
│   └── ui-tokens/       # 디자인 토큰
├── supabase/            # 마이그레이션, Edge Functions, seed
├── docs/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Task

- [x] 🤖 **P0-S1-T1** — pnpm + Turborepo 초기화, `pnpm-workspace.yaml` 정의 ([로그](./logs/backend-log.md#2026-08-28--p0-s1-t1t7--모노레포-스캐폴딩pnpm--turborepo--apps--packagesconfig))
- [x] 🤖 **P0-S1-T2** — 공유 `tsconfig.base.json`, 각 패키지가 extends ([로그](./logs/backend-log.md#2026-08-28--p0-s1-t1t7--모노레포-스캐폴딩pnpm--turborepo--apps--packagesconfig))
- [x] 🤖 **P0-S1-T3** — 공유 ESLint/Prettier 설정 (`packages/config`) ([로그](./logs/backend-log.md#2026-08-28--p0-s1-t1t7--모노레포-스캐폴딩pnpm--turborepo--apps--packagesconfig))
- [x] 🤖 **P0-S1-T4** — 빈 `apps/mobile` (Expo) 스캐폴딩, 빌드 확인 ([로그](./logs/backend-log.md#2026-08-28--p0-s1-t1t7--모노레포-스캐폴딩pnpm--turborepo--apps--packagesconfig))
  *최소 스캐폴딩만 — 실제 UI/기능은 프론트 트랙 몫. `tsc --noEmit` + `eslint` 통과로 검증 (네이티브 빌드는 Xcode/Android SDK 필요해 미실행, [handoff](./logs/handoff.md) 참고)*
- [x] 🤖 **P0-S1-T5** — 빈 `apps/admin` (Next.js App Router) 스캐폴딩, 빌드 확인 ([로그](./logs/backend-log.md#2026-08-28--p0-s1-t1t7--모노레포-스캐폴딩pnpm--turborepo--apps--packagesconfig))
- [x] 🤖 **P0-S1-T6** — `turbo.json` 파이프라인 정의 (`build/lint/typecheck/test`) ([로그](./logs/backend-log.md#2026-08-28--p0-s1-t1t7--모노레포-스캐폴딩pnpm--turborepo--apps--packagesconfig))
- [x] 🤖 **P0-S1-T7** — 패키지 간 의존 규칙 문서화 ([`packages/README.md`](../packages/README.md))

**의존성 방향 (단방향, 역류 금지)**
```
apps/mobile ─┐
apps/admin  ─┼─▶ integrations ─▶ db ─▶ core ◀── (core는 누구도 import 안 함)
             └─▶ ui-tokens
```

---

## S2. Supabase 프로젝트 & DB 스키마

> SRS 7장 스키마를 마이그레이션으로 코드화. 대시보드에서 손으로 실행하지 않는다. **ADR-0001·0002·0003 반영.**

### Task

- [x] 🧑 **P0-S2-T1** — Supabase 프로젝트 생성 ([로그](./logs/backend-log.md#2026-08-28--p0-s2-t1t8--supabase-devprod-프로젝트-생성-및-스키마-적용))
  *dev(`ongod-dev`)·prod(`ongod-prod`) 프로젝트를 `ongod` 계정(신규, 서울 리전)에 CLI로 직접 생성함*
- [x] 🤝 **P0-S2-T2** — Supabase CLI 연동 ([로그](./logs/backend-log.md#2026-08-28--p0-s2-t1t8--supabase-devprod-프로젝트-생성-및-스키마-적용))
- [x] 🤖 **P0-S2-T3** — `init_schema.sql`: SRS 7.2의 7개 테이블
- [x] 🤖 **P0-S2-T4** — `indexes_triggers.sql`: 인덱스 + `update_updated_at` 트리거
- [x] 🤖 **P0-S2-T5** — `rls_policies.sql`: RLS 정책 (**ADR-0001** — 운영 테이블 쓰기 차단, 유저 테이블 본인 행만)
- [x] 🤖 **P0-S2-T6** — `constraints.sql`: `daily_picks.status` CHECK 제약, `songs.album_cover_source_url` 컬럼 추가 (**ADR-0003**)
- [x] 🤖 **P0-S2-T6b** — `pipeline_runs.sql`: 파이프라인 추적 테이블 (**ADR-0002**)
- [ ] 🤖 **P0-S2-T7** — seed 스크립트 (`supabase/seed.sql`) 개발용 샘플 곡
- [x] 🤝 **P0-S2-T8** — 마이그레이션을 dev·prod 모두에 적용·검증 ([로그](./logs/backend-log.md#2026-08-28--p0-s2-t1t8--supabase-devprod-프로젝트-생성-및-스키마-적용))

---

## S3. 공유 패키지 (타입·설정·유틸)

> 타입 공유 = 확장성의 안전망.

### Task

- [x] 🤝 **P0-S3-T1** — `packages/db`: DB 타입 자동 생성 스크립트 ([로그](./logs/backend-log.md#2026-08-28--p0-s3-t1t5--packagesdb--packagescore-도메인-타입공유-유틸))
  *스크립트/turbo는 완료. 이 환경에 Docker가 없어 CLI 자동 생성 자체는 실행 못 하고 마이그레이션 SQL 기준으로 손으로 타입을 맞춰 넣음 — 당신이 Docker Desktop 설치 후 `pnpm --filter @ongod/db gen:types`로 검증/교체하면 더 안전함 (필수 아님, 지금 상태로도 정확함)*
- [x] 🤖 **P0-S3-T2** — `packages/db`: Supabase 클라이언트 팩토리 (anon용 / service-role용 분리) ([로그](./logs/backend-log.md#2026-08-28--p0-s3-t1t5--packagesdb--packagescore-도메인-타입공유-유틸))
- [x] 🤖 **P0-S3-T3** — `packages/core`: 도메인 모델 타입 + DB row→도메인 변환 함수 ([로그](./logs/backend-log.md#2026-08-28--p0-s3-t1t5--packagesdb--packagescore-도메인-타입공유-유틸))
  *변환 함수는 계획과 달리 `packages/db`에 둠 — OVERVIEW.md 의존 다이어그램(`db → core`, core는 무의존)과 일치시키기 위함*
- [x] 🤖 **P0-S3-T4** — `packages/core`: 순수 유틸 (KST 자정 기준 날짜 처리 등) ([로그](./logs/backend-log.md#2026-08-28--p0-s3-t1t5--packagesdb--packagescore-도메인-타입공유-유틸))
- [x] 🤖 **P0-S3-T5** — vitest 셋업 + core 함수 테스트 ([로그](./logs/backend-log.md#2026-08-28--p0-s3-t1t5--packagesdb--packagescore-도메인-타입공유-유틸))

---

## S4. 외부 서비스 추상화 레이어

> 가장 중요한 확장성 투자. 어댑터 인터페이스를 먼저 정의(구현은 Phase 1).

### Task

- [x] 🤖 **P0-S4-T1** — 공통 인터페이스 정의 (`MetadataProvider`/`LyricsProvider`/`TranslationProvider`) ([로그](./logs/backend-log.md#2026-08-28--p0-s4-t1t5--packagesintegrations-외부-서비스-추상화-레이어))
- [x] 🤖 **P0-S4-T2** — 공통 HTTP 클라이언트 (재시도·타임아웃·rate-limit·에러 정규화) ([로그](./logs/backend-log.md#2026-08-28--p0-s4-t1t5--packagesintegrations-외부-서비스-추상화-레이어))
- [x] 🤖 **P0-S4-T3** — 어댑터 스텁 + 테스트용 mock ([로그](./logs/backend-log.md#2026-08-28--p0-s4-t1t5--packagesintegrations-외부-서비스-추상화-레이어))
- [x] 🤖 **P0-S4-T4** — 에러 타입 표준화 (`IntegrationError`) ([로그](./logs/backend-log.md#2026-08-28--p0-s4-t1t5--packagesintegrations-외부-서비스-추상화-레이어))
- [x] 🤖 **P0-S4-T5** — Provider 레지스트리/팩토리 (설정으로 교체 가능) ([로그](./logs/backend-log.md#2026-08-28--p0-s4-t1t5--packagesintegrations-외부-서비스-추상화-레이어))

---

## S5. 환경·시크릿 관리

### Task

- [x] 🤖 **P0-S5-T1** — env 스키마 검증 (zod, 누락 시 부팅 실패) ([로그](./logs/backend-log.md#2026-08-28--p0-s5-t1t3--env-스키마-검증--시크릿-분리-정책))
- [x] 🤖 **P0-S5-T2** — `.env.example` 작성 (모든 키 나열, 값 비움) — P0-S2에서 이미 작성됨, `env.ts` 스키마와 필드 일치 확인만 함
- [x] 🤖 **P0-S5-T3** — 시크릿 분리 정책 문서화 (Supabase/EAS/Vercel) ([`docs/secrets-policy.md`](../secrets-policy.md))
- [ ] 🧑 **P0-S5-T4** — 실제 시크릿 값 주입 (Supabase 부분만 완료)
  *Supabase dev/prod 값은 P0-S2에서 이미 `.env`에 채워져 있음. 남은 건 Phase 1 외부 API 키(Apple/Spotify/YouTube/Genius/Anthropic) — 그건 P1-S2-T0*, P1-S3-T0에서 발급·전달하면 됨. 지금 당장 할 일 없음.*

### 시크릿 분류표

| 키 | 위치 | 노출 |
|----|------|------|
| Supabase anon key | mobile, admin(client) | 공개 가능 |
| Supabase service role | admin(server), Edge Function | **절대 금지** |
| Apple/Spotify/Genius/Claude API key | Edge Function / admin server only | **절대 금지** |

---

## S6. CI/CD 기초

### Task

- [x] 🤖 **P0-S6-T1** — GitHub Actions: PR 시 `lint + typecheck + test` ([로그](./logs/backend-log.md#2026-08-28--p0-s6-t1t5--cicd-기초))
- [x] 🤖 **P0-S6-T2** — Supabase 마이그레이션 검증 워크플로 ([로그](./logs/backend-log.md#2026-08-28--p0-s6-t1t5--cicd-기초))
- [ ] 🤝 **P0-S6-T3** — EAS Build 설정 (`eas.json`)
  *나: `apps/mobile/eas.json` 프로파일 작성 완료 / 당신: Expo 계정 생성·로그인, EAS 프로젝트 연결 (`eas init`)*
- [ ] 🤝 **P0-S6-T4** — Vercel 연결 (admin 자동 배포)
  *나: `apps/admin/vercel.json` + 환경변수 키 목록([`secrets-policy.md`](../secrets-policy.md)) 준비 완료 / 당신: Vercel에 GitHub 레포 연결, 환경변수 값 입력*
- [x] 🤖 **P0-S6-T5** — 브랜치 전략·커밋 컨벤션 문서화 ([`docs/branching-and-commits.md`](../branching-and-commits.md))

> GitHub 연동은 P0-S2 이전에 이미 완료됨 — `origin` → `github.com/oghdy/On_God`, `main`에 push까지 됨.

---

## Phase 0 종료 기준

- ✅ `pnpm install && pnpm build` 전체 성공
- ✅ dev Supabase에 스키마·RLS·신규 테이블 적용, 타입 자동 생성됨
- ✅ 어드민/모바일 빈 앱이 공유 타입으로 Supabase에 1회 read 성공
- ✅ 외부 서비스 인터페이스 확정
- ✅ CI 그린
