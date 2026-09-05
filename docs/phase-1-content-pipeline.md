# Phase 1 — Content Pipeline (관리자 파이프라인)

> **목표**: 운영자가 곡명+아티스트만 입력하면 메타데이터·가사·해석이 자동 수집되고, 검수 후 예약 발행되는 엔진을 완성한다. **앱보다 먼저** 만들어 실제 데이터를 확보한다.
> **완료 정의(DoD)**: 곡 1개를 폼 입력 → 자동 파이프라인 → 검수 → 예약 → 자정 자동 published 전 과정 동작.

> 담당자 범례: 🤖 에이전트 · 🧑 사람 · 🤝 협업 (자세히: [OVERVIEW.md](./OVERVIEW.md)). 작업 전 [handoff.md](./logs/handoff.md) 확인, 완료 후 [logs/](./logs/)에 기록.

## 진행 체크리스트

- [x] S1. 어드민 앱 기반
- [ ] S2. 외부 API 어댑터 실연동 (Apple Music 키 대기, Spotify 보류)
- [x] S3. AI 가사 해석 파이프라인
- [x] S4. 곡 등록 & 오케스트레이션
- [ ] S5. 검수 UI (T6 실제 콘텐츠 검수는 지속 운영 업무)
- [x] S6. 예약 발행 시스템
- [x] S7. 어드민 대시보드
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

- [x] 🧑 **P1-S2-T0a** — **Apple Music API 키 발급** ([로그](./logs/backend-log.md#2026-09-05--p1-s2-t0at1-후속--apple-music-키-반영--라이브-검증))
  *완료 — Media ID(`media.com.ongod.app`) + MusicKit 키 발급받아 전달받음. Team ID/Key ID/.p8 반영 및 라이브 검증 완료*
- ⏸️ **P1-S2-T0b** — **Spotify API 키 발급 — 보류**
  *2026-08-28: Spotify 개발자 대시보드가 "Upgrade to Premium to access the Web API" 메시지로 막힘 (최근 정책 변경으로 보임, 무료 계정으로는 API 접근 자체가 막힌 상태). Spotify는 필수 provider가 아니라서(앨범커버/장르/발매연도는 Apple Music이 커버) 일단 건너뛰고 나머지 먼저 진행하기로 함. 나중에 Premium 구독하거나 다른 계정으로 재시도하면 그때 어댑터 추가*
- 🧑 **P1-S2-T0c** — **YouTube Data API 키 발급**
  *당신: Google Cloud Console에서 YouTube Data API v3 활성화 → API 키 전달*
- 🧑 **P1-S2-T0d** — **Genius API 키 발급**
  *당신: [genius.com/api-clients](https://genius.com/api-clients)에서 앱 생성 → access token 전달*
- [x] 🤖 **P1-S2-T1** — Apple Music 어댑터 (앨범커버·링크·장르·발매연도) ([로그](./logs/backend-log.md#2026-08-28--p1-s2-t1t5--genius유튜브애플뮤직스포티파이-어댑터--계약-테스트), [라이브 검증](./logs/backend-log.md#2026-09-05--p1-s2-t0at1-후속--apple-music-키-반영--라이브-검증))
  *구현 완료 + 2026-09-05 실제 키로 라이브 검증 완료(실제 Apple Music 카탈로그 조회 성공)*
- [x] ⏸️ 🤖 **P1-S2-T2** — Spotify 어댑터 (트랙 링크·popularity) ([로그](./logs/backend-log.md#2026-08-28--p1-s2-t1t5--genius유튜브애플뮤직스포티파이-어댑터--계약-테스트))
  *구현 완료, 키 발급 보류라 라이브 검증 못 함*
- [x] 🤖 **P1-S2-T3** — YouTube 어댑터 (MV/오디오 매칭) ([로그](./logs/backend-log.md#2026-08-28--p1-s2-t1t5--genius유튜브애플뮤직스포티파이-어댑터--계약-테스트))
- [x] 🤖 **P1-S2-T4** — Genius 어댑터 (원문 가사 + 출처 URL) ([로그](./logs/backend-log.md#2026-08-28--p1-s2-t1t5--genius유튜브애플뮤직스포티파이-어댑터--계약-테스트))
- [x] 🤖 **P1-S2-T5** — 어댑터 계약 테스트 (mock/녹화) ([로그](./logs/backend-log.md#2026-08-28--p1-s2-t1t5--genius유튜브애플뮤직스포티파이-어댑터--계약-테스트))
- [x] 🤖 **P1-S2-T6** — 부분 성공 처리 (일부 실패해도 나머지 저장) ([로그](./logs/backend-log.md#2026-08-29--p1-s4-t1t7--곡-등록--오케스트레이터))
  *P1-S4 오케스트레이터에서 구현. 브라우저 검증: YouTube 성공+Genius 실패(NOT_FOUND) 케이스에서 songs는 정상 생성되고 pipeline_runs.status가 "partial"로 정확히 기록됨*

---

## S3. AI 가사 해석 파이프라인

### Task

- [x] 🧑 **P1-S3-T0** — **Anthropic API 키 발급** ([로그](./logs/backend-log.md#2026-08-29--p1-s3-t1t6--claude-어댑터-가사-해석--곡-소개--성경구절-연계))
  *완료 — 최초 발급받은 키가 여러 워크스페이스에 걸친 "identity-linked" 키라 `anthropic-workspace-id` 필요 에러가 남. OnGod 전용 워크스페이스를 새로 만들고 그 안에서 키를 재발급받아 해결*
- [x] 🤖 **P1-S3-T1** — Claude 어댑터 (`claude-sonnet-5`) ([로그](./logs/backend-log.md#2026-08-29--p1-s3-t1t6--claude-어댑터-가사-해석--곡-소개--성경구절-연계))
  *계획 문서엔 `claude-sonnet-4-6`이라 적혀 있었으나, 더 최신·저렴한 `claude-sonnet-5`(비용 대비 이 작업엔 충분)로 사람 확인 후 변경*
- [x] 🤖 **P1-S3-T2** — 가사 해석 프롬프트 (신학·역사 맥락, 직역+의역, notes) ([로그](./logs/backend-log.md#2026-08-29--p1-s3-t1t6--claude-어댑터-가사-해석--곡-소개--성경구절-연계))
- [x] 🤖 **P1-S3-T3** — 곡 소개 + 역사적 맥락 생성 ([로그](./logs/backend-log.md#2026-08-29--p1-s3-t1t6--claude-어댑터-가사-해석--곡-소개--성경구절-연계))
- [x] 🤖 **P1-S3-T4** — 성경구절 연계 생성 (선택) ([로그](./logs/backend-log.md#2026-08-29--p1-s3-t1t6--claude-어댑터-가사-해석--곡-소개--성경구절-연계))
- [x] 🤖 **P1-S3-T5** — `ai_model_used` 기록, `is_verified=false` 저장 ([로그](./logs/backend-log.md#2026-08-29--p1-s3-t1t6--claude-어댑터-가사-해석--곡-소개--성경구절-연계))
  *어댑터가 `modelUsed`를 결과에 채워서 반환 — 실제 DB insert는 오케스트레이터(P1-S4)에서, `is_verified` 기본값은 DB 스키마가 이미 처리*
- [x] 🤖 **P1-S3-T6** — 프롬프트 버전 관리 + zod 출력 검증 ([로그](./logs/backend-log.md#2026-08-29--p1-s3-t1t6--claude-어댑터-가사-해석--곡-소개--성경구절-연계))

---

## S4. 곡 등록 & 오케스트레이션

> SRS 6장 플로우 1~6을 오케스트레이터로 결합. **ADR-0002·0003 반영.**

### Task

- [x] 🤖 **P1-S4-T1** — 곡 등록 폼 (검증·중복 감지) ([로그](./logs/backend-log.md#2026-08-29--p1-s4-t1t7--곡-등록--오케스트레이터))
  *브라우저로 실제 검증: 같은 제목+아티스트 재등록 시도 시 정확히 차단됨 확인*
- [x] 🤖 **P1-S4-T2** — 오케스트레이터: 메타데이터 병렬 수집 → songs 생성 ([로그](./logs/backend-log.md#2026-08-29--p1-s4-t1t7--곡-등록--오케스트레이터))
  *실제 YouTube API로 검증됨. Apple Music/Spotify는 등록만 되면(키 생기면) 자동으로 병렬 호출 대상에 포함되는 구조라 코드 변경 불필요*
- [x] 🤖 **P1-S4-T3** — 가사 수집 → lyrics 생성 ([로그](./logs/backend-log.md#2026-08-29--p1-s4-t1t7--곡-등록--오케스트레이터))
  *`lyrics.source_url` 마이그레이션을 사람이 발급한 Supabase PAT로 dev·prod 둘 다 적용 후 재검증 — 실제 Genius 가사가 `source_url`까지 정확히 저장됨 확인*
- [x] 🤖 **P1-S4-T4** — AI 해석 → lyrics 업데이트 + song_info 생성 ([로그](./logs/backend-log.md#2026-08-29--p1-s4-t1t7--곡-등록--오케스트레이터))
  *실제 DB row 확인: 한국어 번역·`ai_model_used`·`scripture_reference`·곡 소개 전부 정확히 저장됨*
- [x] 🤖 **P1-S4-T5** — 앨범커버 Storage 복사·WebP 변환·위젯용 축소 (**ADR-0003**) ([로그](./logs/backend-log.md#2026-08-29--p1-s4-t5-p1-s4-t8--앨범커버-storage-복사--위젯용-썸네일))
  *실제 검증: 새로 등록한 곡의 YouTube 썸네일을 다운로드→WebP 변환→Storage 업로드까지 실행, 공개 URL로 실제 접근·content-type 확인(메인 600×600 WebP 19.5KB, 위젯용 150×150 WebP 3.5KB)*
- [x] 🤖 **P1-S4-T6** — 파이프라인 비동기 실행, 진행상태 추적 ([로그](./logs/backend-log.md#2026-08-29--p1-s4-t1t7--곡-등록--오케스트레이터))
  *Supabase Edge Function 대신 Next.js `after()` 사용 — 이유는 로그 참고. 브라우저로 실제 검증: 폼 제출 즉시 진행상황 페이지로 이동, 3초 간격 자동 새로고침*
- [x] 🤖 **P1-S4-T7** — `pipeline_runs` 단계별 상태 갱신 (**ADR-0002**) ([로그](./logs/backend-log.md#2026-08-29--p1-s4-t1t7--곡-등록--오케스트레이터))
  *실제로 "부분 성공" 상태와 단계별 성공/실패/스킵이 화면에 정확히 표시되는 것까지 확인*
- [x] 🧑 **P1-S4-T8** — Storage 버킷 생성·공개 정책 설정 (완료 — 사람이 준 PAT로 `album-covers` 버킷을 dev·prod 둘 다 직접 생성함, 대시보드 조작 불필요)

---

## S5. 검수 UI

### Task

- [x] 🤖 **P1-S5-T1** — 검수 화면 (메타·원문·해석·소개 나란히) ([로그](./logs/backend-log.md#2026-08-29--p1-s5-t1t5--검수-ui))
- [x] 🤖 **P1-S5-T2** — 인라인 편집·저장 ([로그](./logs/backend-log.md#2026-08-29--p1-s5-t1t5--검수-ui))
  *브라우저로 실제 검증: 곡 소개 텍스트 수정 후 저장 → 반영되고, 검수 상태는 그대로 유지됨(수동 편집은 is_verified 안 건드림)*
- [x] 🤖 **P1-S5-T3** — 스트리밍 링크 수동 교정 (특히 YouTube) ([로그](./logs/backend-log.md#2026-08-29--p1-s5-t1t5--검수-ui))
- [x] 🤖 **P1-S5-T4** — "검수 완료" → `is_verified=true` ([로그](./logs/backend-log.md#2026-08-29--p1-s5-t1t5--검수-ui))
  *브라우저로 실제 검증: 클릭 시 즉시 "검수 완료됨"으로 바뀌고, 검수 큐 목록도 "대기"→"완료"로 이동*
- [x] 🤖 **P1-S5-T5** — AI 재생성 버튼 ([로그](./logs/backend-log.md#2026-08-29--p1-s5-t1t5--검수-ui))
  *브라우저로 실제 검증: 곡 소개 재생성 → 새 내용 생성되고 is_verified가 다시 false로 초기화됨(재검수 필요 신호)*
- [ ] 🧑 **P1-S5-T6** — 실제 콘텐츠 검수 (운영 행위)
  *당신: AI가 만든 해석·소개의 신학적/사실적 정확성을 사람이 최종 확인 — 자동화 불가 영역. 지금 dev DB에 "Go Down Moses" 1곡이 검수 대기 상태로 있음(`/review`)*

---

## S6. 예약 발행 시스템

### Task

- [x] 🤖 **P1-S6-T1** — 발행 일정 배정 UI (status=scheduled) ([로그](./logs/backend-log.md#2026-08-29--p1-s6-t1t7--예약-발행-시스템))
  *브라우저로 실제 검증: 검수 완료된 곡 선택 → 날짜 배정 → "예약됨" 상태로 반영*
- [x] 🤖 **P1-S6-T2** — pick_date UNIQUE 충돌·빈 날짜 경고 ([로그](./logs/backend-log.md#2026-08-29--p1-s6-t1t7--예약-발행-시스템))
  *앞으로 14일 중 비어있는 날짜를 화면 상단에 경고로 표시. DB의 UNIQUE 제약(23505)을 한글 에러 메시지로 변환*
- [x] 🤖 **P1-S6-T3** — Scheduled 발행 (cron, KST 자정) ([로그](./logs/backend-log.md#2026-08-29--p1-s6-t1t7--예약-발행-시스템))
  *Edge Function 대신 pg_cron + DB 함수로 구현(이유는 로그 참고). 실제로 dev·prod 둘 다 `pg_cron` extension 설치하고 cron job 등록·활성화까지 완료(`active: true`)*
- [x] 🤖 **P1-S6-T4** — cron 로직: scheduled → published, published_at 기록 ([로그](./logs/backend-log.md#2026-08-29--p1-s6-t1t7--예약-발행-시스템))
  *함수를 직접 호출해 실제 발행 전이 확인: status가 published로 바뀌고 published_at이 정확히 기록됨*
- [x] 🤖 **P1-S6-T5** — 발행 전 is_verified 검증 ([로그](./logs/backend-log.md#2026-08-29--p1-s6-t1t7--예약-발행-시스템))
  *실제 검증: lyrics를 미검수로 되돌리고 함수 호출 → 발행 안 되고 건너뜀(빈 결과) 확인, 다시 검수 완료로 되돌리니 정상 발행됨*
- [x] 🤖 **P1-S6-T6** — 타임존 처리 (KST 일관) ([로그](./logs/backend-log.md#2026-08-29--p1-s6-t1t7--예약-발행-시스템))
  *cron 실행 시각(UTC 15:00 = KST 00:00)과 날짜 판정(`now() at time zone 'Asia/Seoul'`) 둘 다 KST 기준으로 통일*
- [x] 🧑 **P1-S6-T7** — cron 스케줄 활성화 (완료 — 사람이 준 PAT로 Management API를 통해 dev·prod 둘 다 직접 설치·등록·활성화까지 마침, 대시보드 조작 불필요)

---

## S7. 어드민 대시보드

### Task

- [x] 🤖 **P1-S7-T1** — 곡 목록 (검색·필터) ([로그](./logs/backend-log.md#2026-08-29--p1-s7-t1t5--어드민-대시보드))
  *브라우저로 실제 검증: "moses" 검색 → 정확히 필터링됨*
- [x] 🤖 **P1-S7-T2** — 발행 캘린더 뷰 ([로그](./logs/backend-log.md#2026-08-29--p1-s7-t1t5--어드민-대시보드))
  *KST 기준 이번 달 그리드. 브라우저로 실제 검증: 발행일이 정확한 칸에 상태색으로 표시됨*
- [x] 🤖 **P1-S7-T3** — 검수 대기 큐 — P1-S5-T1에서 이미 구현한 `/review`를 그대로 재사용(대시보드에 링크·통계만 추가), 중복 구현 안 함
- [x] 🤖 **P1-S7-T4** — 콘텐츠 재고 경고 (2주 미만 알림) ([로그](./logs/backend-log.md#2026-08-29--p1-s7-t1t5--어드민-대시보드))
  *브라우저로 실제 검증: "14일 중 13일 비어있음" 경고 정확히 표시*
- [x] 🤖 **P1-S7-T5** — 곡 수정/삭제 ([로그](./logs/backend-log.md#2026-08-29--p1-s7-t1t5--어드민-대시보드))
  *수정은 `/review/[id]`(P1-S5) 재사용. 삭제는 `daily_picks`의 `on delete restrict` FK 위반을 한글 메시지로 변환 — 브라우저로 실제 검증: 발행 이력 있는 곡 삭제 시도 → 정확히 거부됨*

---

## Phase 1 종료 기준

- ✅ 곡 1개를 폼 입력만으로 전체 파이프라인 통과 → 완성 콘텐츠 생성
- ✅ 검수 후 예약 → cron 자정 자동 published
- ✅ 외부 API 1개 실패해도 나머지 저장 + 검수 보완
- ✅ 대시보드에서 발행 일정·재고 확인
- ✅ 앱이 읽을 실제 데이터 2주치 준비 가능
