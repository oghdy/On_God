# Phase 2 — Core App (MVP 앱)

> **목표**: Phase 1이 만든 실제 데이터로, 유저가 매일 쓰는 앱을 완성한다. SRS 3.1 메인 피드 P0 전부.
> **완료 정의(DoD)**: 앱 진입 시 오늘의 곡 카드 2초 내 표시, 가사 원문/한국어 열람, 스트리밍 이동, 로그인.

> 담당자 범례: 🤖 에이전트 · 🧑 사람 · 🤝 협업 (자세히: [OVERVIEW.md](./OVERVIEW.md)). 작업 전 [handoff.md](./logs/handoff.md) 확인, 완료 후 [logs/](./logs/)에 기록.

## 진행 체크리스트

- [x] S1. 앱 기반 (네비게이션·데이터) — [로그](./logs/frontend-log.md#2026-09-01--p2-s1-t1t6--expo-router-골격--supabase-연결--데이터-레이어)
- [ ] S2. 디자인 시스템
- [ ] S3. Daily Card 화면
- [ ] S4. 가사 뷰어
- [ ] S5. 스트리밍 딥링크
- [ ] S6. 인증
- [ ] S7. 성능·안정화

---

## S1. 앱 기반

### Task

- [x] 🤖 **P2-S1-T1** — Expo Router 네비게이션 골격
- [x] 🤖 **P2-S1-T2** — Supabase 클라이언트 연결 (anon, `packages/db` 재사용)
- [x] 🤖 **P2-S1-T3** — TanStack Query 데이터 레이어 (쿼리 키·캐시 정책)
- [x] 🤖 **P2-S1-T4** — 도메인 훅 (`useTodayPick`, `useSongLyrics`)
- [x] 🤖 **P2-S1-T5** — 로딩/에러/빈상태 공통 컴포넌트
- [x] 🤖 **P2-S1-T6** — 오프라인/캐시 전략 (마지막 곡 캐싱, `@tanstack/react-query-persist-client`)

---

## S2. 디자인 시스템

### Task

- 🤖 **P2-S2-T1** — 디자인 토큰 (다크모드 기본)
- 🤖 **P2-S2-T2** — 기초 컴포넌트 (Text/Button/Tab/Card/Skeleton)
- 🤖 **P2-S2-T3** — 스트리밍 브랜드 컬러 (Apple 흑백/Spotify 녹색/YouTube 적색)
- 🤝 **P2-S2-T4** — 폰트·아이콘 셋업
  *나: 코드 통합 / 당신: 유료·라이선스 폰트를 쓸 경우 폰트 파일·라이선스 제공 (무료 폰트면 내가 처리)*

---

## S3. Daily Card 화면 (SRS 3.1 P0)

### Task

- 🤖 **P2-S3-T1** — 풀스크린 앨범커버 카드 (곡명·아티스트·발매연도)
- 🤖 **P2-S3-T2** — 곡 소개 텍스트 (`song_info.description_ko`)
- 🤖 **P2-S3-T3** — 앨범커버 로딩 (WebP·placeholder·블러업)
- 🤖 **P2-S3-T4** — 카드 전환 스와이프 (MVP: 최근 곡까지)
- 🤖 **P2-S3-T5** — "오늘의 곡 없음" 예외 처리

---

## S4. 가사 뷰어 (SRS 3.1 P0)

### Task

- 🤖 **P2-S4-T1** — 원문/해석 탭 전환
- 🤖 **P2-S4-T2** — sticky 헤더 (스크롤 시 곡명·커버 고정)
- 🤖 **P2-S4-T3** — `translation_notes` 표시
- 🤖 **P2-S4-T4** — 가사 출처 표기 (SRS 4.3)
- 🤖 **P2-S4-T5** — 긴 가사 성능·빈 가사 처리

---

## S5. 스트리밍 딥링크 (SRS 3.1 P0)

### Task

- 🤖 **P2-S5-T1** — 딥링크 유틸 (앱 스킴 우선 → 웹 폴백)
- 🤖 **P2-S5-T2** — 3개 버튼 컴포넌트 (브랜드 컬러)
- 🤖 **P2-S5-T3** — 링크 누락 플랫폼 처리
- 🤖 **P2-S5-T4** — MVP: 3개 동시 표시로 단순화 (SRS 8장 미결사항 결정)

---

## S6. 인증 (SRS: profiles, Apple/Google)

> 로그인 없이도 오늘의 곡은 열람 가능(게스트). 가입 강요 X.

### Task

- 🧑 **P2-S6-T0a** — **Apple 로그인 설정**
  *당신: Apple Developer에서 Sign in with Apple 활성화, Service ID·키 발급 → Supabase Auth에 입력값 전달*
- 🧑 **P2-S6-T0b** — **Google 로그인 설정**
  *당신: Google Cloud OAuth 동의화면·Client ID 생성 → Supabase Auth에 입력값 전달*
- 🤖 **P2-S6-T1** — Apple 로그인 구현
- 🤖 **P2-S6-T2** — Google 로그인 구현
- 🤖 **P2-S6-T3** — 로그인 시 `profiles` 자동 생성·provider 기록
- 🤖 **P2-S6-T4** — 게스트 모드 (비로그인 열람)
- 🤖 **P2-S6-T5** — 세션 영속·자동 갱신·로그아웃

---

## S7. 성능·안정화 (SRS 4.2)

### Task

- 🤖 **P2-S7-T1** — 오늘 카드 2초 이내 검증·최적화
- 🤖 **P2-S7-T2** — 이미지 CDN·WebP 적용 확인
- 🤝 **P2-S7-T3** — 크래시 리포팅 (Sentry 등)
  *나: SDK 통합 / 당신: Sentry 계정·프로젝트 생성, DSN 전달*
- 🤝 **P2-S7-T4** — 기본 분석 이벤트
  *나: 이벤트 코드 / 당신: 분석 도구(선택) 계정·키 제공*
- 🤖 **P2-S7-T5** — 접근성 기초 (폰트 스케일·대비·스크린리더)

---

## Phase 2 종료 기준

- ✅ 앱 진입 → 오늘 카드 2초 내 표시
- ✅ 원문/한국어 탭 전환 + sticky 헤더
- ✅ 스트리밍 3개 버튼 이동
- ✅ Apple/Google 로그인 + 게스트 열람
- ✅ 실제 데이터로 며칠 연속 정상 표시
