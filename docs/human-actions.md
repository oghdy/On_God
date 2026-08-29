# 핸드오프 체크리스트 — 당신(사람)이 직접 해야 하는 작업

> 각 Phase 문서의 🧑·🤝 Task만 모은 목록. 내가 접근할 수 없는 외부 대시보드·계정·결제·실기기·운영 판단 작업이다.
> **대부분 "계정 만들기 + 키 발급해서 나에게 전달"** 패턴이다. 키는 가능하면 당신이 직접 `.env`/대시보드에 입력하는 것을 권장한다.

## 🔑 발급해서 나에게 전달해야 할 키/값 (한눈에)

| 항목 | 어디서 | 비용 | 관련 Task |
|------|--------|------|-----------|
| Supabase 프로젝트(dev/prod) URL·anon·service_role·DB password | supabase.com | 무료~ | P0-S2-T1 |
| Expo/EAS 계정 | expo.dev | 무료~ | P0-S6-T3 |
| Vercel 계정 + GitHub 레포 연결 | vercel.com | 무료~ | P0-S6-T4 |
| GitHub 레포 | github.com | 무료 | P0-S6 |
| Apple Music API (Team ID·Key ID·.p8) | Apple Developer | $99/년 | P1-S2-T0a |
| Spotify Client ID/Secret | developer.spotify.com | 무료였으나 현재 Premium 요구로 **보류** | P1-S2-T0b |
| YouTube Data API 키 | Google Cloud Console | 무료(쿼터) | P1-S2-T0c |
| Genius access token | genius.com/api-clients | 무료 | P1-S2-T0d |
| Anthropic API 키 | console.anthropic.com | 사용량 과금 | P1-S3-T0 |
| Sign in with Apple 설정 | Apple Developer | (위 포함) | P2-S6-T0a |
| Google OAuth Client | Google Cloud | 무료 | P2-S6-T0b |
| Sentry DSN (선택) | sentry.io | 무료~ | P2-S7-T3 |

---

## Phase 0 — Foundation

- [x] **P0-S2-T1** 🧑 Supabase dev/prod 프로젝트 2개 생성 → URL·키·DB password 전달 (완료, [로그](./logs/backend-log.md#2026-08-28--p0-s2-t1t8--supabase-devprod-프로젝트-생성-및-스키마-적용))
- [x] **P0-S2-T2** 🤝 `supabase login` 브라우저 인증, project ref 제공 (완료)
- [x] **P0-S2-T8** 🤝 마이그레이션 적용 시 CLI 인증/DB password 입력 (완료)
- [x] **P0-S3-T1** 🤝 타입 자동생성 위해 project ref·로그인 상태 제공 — 완료. Docker는 필요 없었음: `supabase gen types typescript --project-id <ref>`가 로컬 컨테이너 없이 클라우드 dev 프로젝트에서 직접 타입을 생성함. 손으로 쓴 버전은 CLI 실제 출력으로 교체함 ([로그](./logs/backend-log.md#2026-08-28--p0-s3-t1-후속--손으로-쓴-db-타입을-cli-생성-타입으로-교체))
- [ ] **P0-S5-T4** 🧑 발급한 시크릿 값들을 `.env`/Supabase·Vercel·EAS에 입력 — Supabase 부분은 완료, 나머지는 Phase 1 외부 API 키 발급 후
- [ ] **P0-S6-T3** 🤝 Expo 계정 생성·EAS 프로젝트 연결 (`eas.json` 프로파일은 준비함, [로그](./logs/backend-log.md#2026-08-28--p0-s6-t1t5--cicd-기초) 참고)
- [ ] **P0-S6-T4** 🤝 Vercel에 GitHub 레포 연결, 환경변수 입력 (`vercel.json`·환경변수 목록은 준비함, [`docs/secrets-policy.md`](./secrets-policy.md) 참고)
- [x] **(사전)** 🧑 GitHub 레포 생성 (또는 내가 `git init` 후 remote 연결) — 완료 (`origin` → `github.com/oghdy/On_God`)

## Phase 1 — Content Pipeline

- [ ] **P1-S1-T5** 🧑 최초 운영자 계정 생성·이메일 전달
- [ ] **P1-S2-T0a** 🧑 Apple Music API 키 발급
- [ ] ⏸️ **P1-S2-T0b** 🧑 Spotify API 키 발급 — 보류 (2026-08-28: 무료 계정으로 Web API 접근 불가, Premium 요구. 필수 아니라서 스킵하고 진행 중)
- [x] **P1-S2-T0c** 🧑 YouTube Data API 키 발급 (완료, 라이브 검증됨)
- [x] **P1-S2-T0d** 🧑 Genius API 키 발급 (완료, 라이브 검증됨)
- [ ] **P1-S3-T0** 🧑 Anthropic API 키 발급·결제수단 등록
- [ ] **P1-S4-T8** 🧑 Storage 버킷 생성·공개 정책 설정
- [ ] **P1-S5-T6** 🧑 AI 생성 콘텐츠 신학적/사실 정확성 최종 검수 (지속 운영 업무)
- [ ] **P1-S6-T7** 🧑 Scheduled Function/pg_cron 활성화·권한 승인

## Phase 2 — Core App

- [ ] **P2-S2-T4** 🤝 유료·라이선스 폰트 사용 시 폰트 파일 제공
- [ ] **P2-S6-T0a** 🧑 Sign in with Apple 설정 → Supabase 입력값 전달
- [ ] **P2-S6-T0b** 🧑 Google OAuth Client 생성 → Supabase 입력값 전달
- [ ] **P2-S7-T3** 🤝 Sentry 계정·프로젝트 생성, DSN 전달
- [ ] **P2-S7-T4** 🤝 분석 도구(선택) 계정·키 제공

## Phase 3 — Widget & 출시

- [ ] **P3-S2-T1** 🤝 Apple Developer에서 App Group·위젯 App ID·프로비저닝 설정
- [ ] **P3-S2-T7** 🧑 iOS 실기기 위젯 테스트
- [ ] **P3-S3-T7** 🧑 Android 실기기 위젯 테스트
- [ ] **P3-S4-T4** 🧑 양 플랫폼 실기기 종합 테스트
- [ ] **출시** 🧑 Apple($99/년)·Google($25 1회) 개발자 계정 등록
- [ ] **출시** 🧑 스토어 심사 메타데이터·스크린샷 제출
- [ ] **출시** 🧑 개인정보처리방침 게시 (초안은 내가 작성)
- [ ] **출시** 🤝 가사 저작권 출처 표기 최종 점검
- [ ] **출시** 🧑 콘텐츠 2주치 예약 (운영)

---

## 요약: 당신의 역할 3가지

1. **계정·키 발급** — 외부 서비스에 가입하고 API 키를 발급해 나에게 전달 (가장 빈번)
2. **승인·인증** — CLI 로그인, 대시보드 권한 승인, 결제수단 등록
3. **사람만 가능한 판단·테스트** — 콘텐츠 검수, 실기기 테스트, 스토어 제출

나머지 코딩·설정·SQL·문서 작성은 전부 내가(🤖) 한다.
