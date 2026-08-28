# 백엔드 세션 시작 프롬프트

> 새 Claude Code 세션에서 이 프로젝트 폴더를 열고 아래 내용을 그대로 붙여넣는다.
> 이 파일 자체는 참고용 보관본이며, 세션에 매번 붙여넣는 건 아래 프롬프트 텍스트다.

---

너는 OnGod 프로젝트의 **백엔드 트랙 세션**이다. `CLAUDE.md`를 이미 읽었을 테니 세부 규칙은
반복하지 않는다. 아래는 지금 이 세션이 뭘 해야 하는지에 대한 브리핑이다.

## 지금까지 상황

설계 세션(팀장)이 Phase 0~3 계획(`docs/phase-*.md`), ADR 4개(`docs/decisions/`), 로그/handoff
체계(`docs/logs/`)를 이미 만들어뒀다. 그리고 부트스트랩성 인프라 작업 일부를 예외적으로 설계
세션이 먼저 처리했다:

- GitHub 레포 연결 완료 (`origin` → `github.com/oghdy/On_God`, `main` 브랜치에 push까지 됨)
- Supabase `ongod-dev`/`ongod-prod` 프로젝트 생성 완료 (서울 리전, Free 플랜)
- `supabase/migrations/`에 마이그레이션 5개 작성·적용 완료 (SRS 7.2 스키마 + ADR-0001/0002/0003 반영)
- `.env`(로컬 전용, gitignore됨)에 dev/prod의 URL·anon key·service_role key가 이미 채워져 있음
  — **새로 발급하거나 프로젝트를 또 만들지 말 것.** `.env` 먼저 확인.
- `docs/phase-0-foundation.md`의 S2(Supabase) 항목은 이미 체크됨, `docs/logs/backend-log.md`에
  상세 기록 있음

## 첫 번째로 할 일: 이 순서로 읽어라

1. `docs/OVERVIEW.md`
2. `docs/logs/handoff.md` (지금은 비어있을 가능성 높음)
3. `docs/phase-0-foundation.md` 전체 — 특히 S1, S3, S4, S5, S6 (S2는 이미 완료됨, 건드리지 말 것)
4. `docs/logs/backend-log.md`의 가장 최근 항목 (2026-08-28, P0-S2-T1~T8) — 지금까지 뭐가
   세팅됐는지 정확히 파악

## 실제로 시작할 작업

**Phase 0 — S1 (모노레포 구조)부터 시작한다.** 아직 아무것도 안 돼 있다 (지금 프로젝트 루트엔
`docs/`, `supabase/`, `.env*`, `CLAUDE.md`만 있고 `apps/`, `packages/`는 없음). S1이 끝나야
S3(공유 패키지)·S4(외부 API 어댑터 인터페이스)·S6(CI/CD)을 이어갈 수 있다.

작업 순서 제안 (강제 아님, `phase-0-foundation.md`의 Task 목록이 기준):
1. S1 — pnpm + Turborepo 모노레포 스캐폴딩, `apps/admin`(Next.js) 빈 프로젝트까지
2. S3 — `packages/db` (Supabase 클라이언트 팩토리, DB 타입 자동 생성 — 이미 있는 dev 프로젝트로 타입 뽑으면 됨), `packages/core`
3. S4 — `packages/integrations` 인터페이스 정의 (구현은 Phase 1에서)
4. S5 — env 스키마 검증 (zod). `.env.example` 이미 있으니 그거 기준으로
5. S6 — GitHub Actions CI (lint/typecheck/test)

`apps/mobile`(Expo)은 프론트 세션 몫이니 껍데기 정도만 만들거나 아예 건드리지 않아도 된다 —
다만 S1의 DoD("빈 모바일 앱과 빈 어드민 앱이 같은 모노레포에서 빌드")를 만족해야 하니, 최소
`expo init`으로 빈 프로젝트는 만들어두는 게 낫다. 애매하면 `handoff.md`에 "프론트 세션 시작 시
확인 요망" 항목으로 남기고 진행해도 된다.

## 작업 규칙 리마인드 (CLAUDE.md 요약)

- Task 하나 끝날 때마다 `docs/logs/backend-log.md`에 append + `phase-0-foundation.md` 체크박스 갱신
- 계획에 없던 세부 Task는 그 자리에서 ID 붙여서 추가 (예: `P0-S1-T8`), 물어볼 필요 없음
- 프론트 트랙에 영향 주는 결정은 `docs/logs/handoff.md`에 필수 기록
- 되돌리기 어려운 구조적 결정은 `docs/decisions/000N-*.md`로 ADR 작성
- 커밋은 자유롭게 하되, **GitHub push는 하기 전에 사용자에게 확인받을 것** (이미 `main`에
  히스토리가 있으니 강제 push 등 위험한 조작 금지)
- `.env`의 service_role 키 등은 절대 클라이언트 코드나 커밋에 포함하지 말 것

여기까지 확인했으면 `docs/phase-0-foundation.md`의 S1부터 시작해라.
