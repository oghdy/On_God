# Phase 1 — Content Pipeline (관리자 파이프라인)

> **목표**: 운영자가 곡명+아티스트만 입력하면 메타데이터·가사·해석이 자동 수집되고, 검수 후 예약 발행되는 엔진을 완성한다. **앱보다 먼저** 만들어 실제 데이터를 확보한다.
> **완료 정의(DoD)**: 곡 1개를 폼 입력 → 자동 파이프라인 → 검수 → 예약 → 자정 자동 published 전 과정 동작.

> 담당자 범례: 🤖 에이전트 · 🧑 사람 · 🤝 협업 (자세히: [OVERVIEW.md](./OVERVIEW.md)). 작업 전 [handoff.md](./logs/handoff.md) 확인, 완료 후 [logs/](./logs/)에 기록.

## 진행 체크리스트

- [ ] S1. 어드민 앱 기반
- [ ] S2. 외부 API 어댑터 실연동
- [ ] S3. AI 가사 해석 파이프라인
- [ ] S4. 곡 등록 & 오케스트레이션
- [ ] S5. 검수 UI
- [ ] S6. 예약 발행 시스템
- [ ] S7. 어드민 대시보드

---

## S1. 어드민 앱 기반

### Task

- [x] 🤖 **P1-S1-T1** — Supabase Auth 어드민 로그인 + 운영자 역할 검증 미들웨어 ([로그](./logs/backend-log.md#2026-08-28--p1-s1-t1t4--어드민-로그인--보호-라우트--service-role-경계))
  *DB role 대신 `ADMIN_EMAILS` 환경변수 allowlist로 검증 (ADR-0001: "운영자는 단일/소수, DB 역할 시스템은 과설계")*
- [x] 🤖 **P1-S1-T2** — 보호 라우트 레이아웃 ([로그](./logs/backend-log.md#2026-08-28--p1-s1-t1t4--어드민-로그인--보호-라우트--service-role-경계))
- [x] 🤖 **P1-S1-T3** — 공통 UI 셸 (사이드바) ([로그](./logs/backend-log.md#2026-08-28--p1-s1-t1t4--어드민-로그인--보호-라우트--service-role-경계))
- [x] 🤖 **P1-S1-T4** — 서버에서만 service-role 사용 경계 확립 (**ADR-0001**) ([로그](./logs/backend-log.md#2026-08-28--p1-s1-t1t4--어드민-로그인--보호-라우트--service-role-경계))
- [ ] 🧑 **P1-S1-T5** — 최초 운영자 계정 생성 (`ADMIN_EMAILS`는 `test@ongod.com`으로 갱신 완료)
  *당신: `ongod-dev` 프로젝트 대시보드 → Authentication → Users → Add user에서 `test@ongod.com` 계정 생성. 비밀번호는 Supabase 기본 최소 길이(6자)를 넘겨야 함 — "1234"는 너무 짧아서 대시보드가 거부할 가능성 높음, 6자 이상으로 다시 정해서 알려줘. "Auto Confirm User" 체크 필수*

---

## S2. 외부 API 어댑터 실연동

> Phase 0 인터페이스의 실제 구현. **각 API는 키 발급이 필요 — 당신의 작업.**

### Task

- 🧑 **P1-S2-T0a** — **Apple Music API 키 발급**
  *당신: Apple Developer 계정($99/년)에서 MusicKit 키(Team ID, Key ID, .p8) 발급 → 전달*
- ⏸️ **P1-S2-T0b** — **Spotify API 키 발급 — 보류**
  *2026-08-28: Spotify 개발자 대시보드가 "Upgrade to Premium to access the Web API" 메시지로 막힘 (최근 정책 변경으로 보임, 무료 계정으로는 API 접근 자체가 막힌 상태). Spotify는 필수 provider가 아니라서(앨범커버/장르/발매연도는 Apple Music이 커버) 일단 건너뛰고 나머지 먼저 진행하기로 함. 나중에 Premium 구독하거나 다른 계정으로 재시도하면 그때 어댑터 추가*
- 🧑 **P1-S2-T0c** — **YouTube Data API 키 발급**
  *당신: Google Cloud Console에서 YouTube Data API v3 활성화 → API 키 전달*
- 🧑 **P1-S2-T0d** — **Genius API 키 발급**
  *당신: [genius.com/api-clients](https://genius.com/api-clients)에서 앱 생성 → access token 전달*
- [x] 🤖 **P1-S2-T1** — Apple Music 어댑터 (앨범커버·링크·장르·발매연도) ([로그](./logs/backend-log.md#2026-08-28--p1-s2-t1t5--genius유튜브애플뮤직스포티파이-어댑터--계약-테스트))
  *구현은 완료, 실제 키 없어서 라이브 검증은 아직 — JWT 서명 로직은 테스트용 키 쌍으로 검증함*
- [x] ⏸️ 🤖 **P1-S2-T2** — Spotify 어댑터 (트랙 링크·popularity) ([로그](./logs/backend-log.md#2026-08-28--p1-s2-t1t5--genius유튜브애플뮤직스포티파이-어댑터--계약-테스트))
  *구현 완료, 키 발급 보류라 라이브 검증 못 함*
- [x] 🤖 **P1-S2-T3** — YouTube 어댑터 (MV/오디오 매칭) ([로그](./logs/backend-log.md#2026-08-28--p1-s2-t1t5--genius유튜브애플뮤직스포티파이-어댑터--계약-테스트))
- [x] 🤖 **P1-S2-T4** — Genius 어댑터 (원문 가사 + 출처 URL) ([로그](./logs/backend-log.md#2026-08-28--p1-s2-t1t5--genius유튜브애플뮤직스포티파이-어댑터--계약-테스트))
- [x] 🤖 **P1-S2-T5** — 어댑터 계약 테스트 (mock/녹화) ([로그](./logs/backend-log.md#2026-08-28--p1-s2-t1t5--genius유튜브애플뮤직스포티파이-어댑터--계약-테스트))
- [ ] 🤖 **P1-S2-T6** — 부분 성공 처리 (일부 실패해도 나머지 저장) — 오케스트레이터(P1-S4)에서 실제로 여러 provider를 조합할 때 진행

---

## S3. AI 가사 해석 파이프라인

### Task

- 🧑 **P1-S3-T0** — **Anthropic API 키 발급**
  *당신: [console.anthropic.com](https://console.anthropic.com)에서 API 키 발급·결제수단 등록 → 전달*
- 🤖 **P1-S3-T1** — Claude 어댑터 (`claude-sonnet-4-6`)
- 🤖 **P1-S3-T2** — 가사 해석 프롬프트 (신학·역사 맥락, 직역+의역, notes)
- 🤖 **P1-S3-T3** — 곡 소개 + 역사적 맥락 생성
- 🤖 **P1-S3-T4** — 성경구절 연계 생성 (선택)
- 🤖 **P1-S3-T5** — `ai_model_used` 기록, `is_verified=false` 저장
- 🤖 **P1-S3-T6** — 프롬프트 버전 관리 + zod 출력 검증

---

## S4. 곡 등록 & 오케스트레이션

> SRS 6장 플로우 1~6을 오케스트레이터로 결합. **ADR-0002·0003 반영.**

### Task

- 🤖 **P1-S4-T1** — 곡 등록 폼 (검증·중복 감지)
- 🤖 **P1-S4-T2** — 오케스트레이터: 메타데이터 병렬 수집 → songs 생성
- 🤖 **P1-S4-T3** — 가사 수집 → lyrics 생성
- 🤖 **P1-S4-T4** — AI 해석 → lyrics 업데이트 + song_info 생성
- 🤖 **P1-S4-T5** — 앨범커버 Storage 복사·WebP 변환·위젯용 축소 (**ADR-0003**)
- 🤖 **P1-S4-T6** — 파이프라인 비동기 실행 (Edge Function), 진행상태 추적
- 🤖 **P1-S4-T7** — `pipeline_runs` 단계별 상태 갱신 (**ADR-0002**)
- 🧑 **P1-S4-T8** — Storage 버킷 생성·공개 정책 설정
  *당신: Supabase 대시보드에서 앨범커버용 Storage 버킷 생성(또는 내가 만든 SQL/명령 실행 승인)*

---

## S5. 검수 UI

### Task

- 🤖 **P1-S5-T1** — 검수 화면 (메타·원문·해석·소개 나란히)
- 🤖 **P1-S5-T2** — 인라인 편집·저장
- 🤖 **P1-S5-T3** — 스트리밍 링크 수동 교정 (특히 YouTube)
- 🤖 **P1-S5-T4** — "검수 완료" → `is_verified=true`
- 🤖 **P1-S5-T5** — AI 재생성 버튼
- 🧑 **P1-S5-T6** — 실제 콘텐츠 검수 (운영 행위)
  *당신: AI가 만든 해석·소개의 신학적/사실적 정확성을 사람이 최종 확인 — 자동화 불가 영역*

---

## S6. 예약 발행 시스템

### Task

- 🤖 **P1-S6-T1** — 발행 일정 배정 UI (status=scheduled)
- 🤖 **P1-S6-T2** — pick_date UNIQUE 충돌·빈 날짜 경고
- 🤖 **P1-S6-T3** — Scheduled Edge Function (cron, KST 자정)
- 🤖 **P1-S6-T4** — cron 로직: scheduled → published, published_at 기록
- 🤖 **P1-S6-T5** — 발행 전 is_verified 검증
- 🤖 **P1-S6-T6** — 타임존 처리 (KST 일관)
- 🧑 **P1-S6-T7** — cron 스케줄 활성화
  *당신: Supabase 대시보드에서 Scheduled Function/pg_cron 활성화·권한 승인이 필요할 수 있음*

---

## S7. 어드민 대시보드

### Task

- 🤖 **P1-S7-T1** — 곡 목록 (검색·필터)
- 🤖 **P1-S7-T2** — 발행 캘린더 뷰
- 🤖 **P1-S7-T3** — 검수 대기 큐
- 🤖 **P1-S7-T4** — 콘텐츠 재고 경고 (2주 미만 알림)
- 🤖 **P1-S7-T5** — 곡 수정/삭제

---

## Phase 1 종료 기준

- ✅ 곡 1개를 폼 입력만으로 전체 파이프라인 통과 → 완성 콘텐츠 생성
- ✅ 검수 후 예약 → cron 자정 자동 published
- ✅ 외부 API 1개 실패해도 나머지 저장 + 검수 보완
- ✅ 대시보드에서 발행 일정·재고 확인
- ✅ 앱이 읽을 실제 데이터 2주치 준비 가능
