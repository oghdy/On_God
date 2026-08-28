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

<!-- 아래에 새 로그 항목을 계속 추가한다 -->
