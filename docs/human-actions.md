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
- [ ] **P0-S5-T4** 🧑 발급한 시크릿 값들을 `.env`/Supabase·Vercel·EAS에 입력 — **Supabase·외부 API 키는 전부 완료.** 남은 건 Vercel(P0-S6-T4)·EAS 쪽 주입뿐이다.
  *2026-09-08 정정: 'Apple Music 키가 없어서 앨범 커버가 안 채워진다'는 진단이 돌던데 **사실이 아니다.** 키는 2026-09-05에 반영됐고, 이번에 실제 파이프라인을 돌려 `apple-music: ok`와 진짜 앨범 아트까지 확인했다 ([로그](./logs/backend-log.md#2026-09-08--phase-3-블로커-해소--dev-콘텐츠-큐-원인-규명--실제-파이프라인으로-채움)). 이 항목은 Phase 3를 막고 있지 않다.*
- [x] **P0-S6-T3** 🤝 Expo 계정 생성·EAS 프로젝트 연결 (완료 — 계정(`doyis`) 생성 후 로그인, `eas init`으로 프로젝트 연결까지 마침. 프로젝트: [expo.dev/accounts/doyis/projects/ongod](https://expo.dev/accounts/doyis/projects/ongod), [로그](./logs/frontend-log.md#2026-09-06--eas-프로젝트-연결) 참고)
- [ ] **P0-S6-T4** 🤝 Vercel에 GitHub 레포 연결, 환경변수 입력 (`vercel.json`·환경변수 목록은 준비함, [`docs/secrets-policy.md`](./secrets-policy.md) 참고)
- [x] **(사전)** 🧑 GitHub 레포 생성 (또는 내가 `git init` 후 remote 연결) — 완료 (`origin` → `github.com/oghdy/On_God`)

## Phase 1 — Content Pipeline

- [x] **P1-S1-T5** 🧑 최초 운영자 계정 생성·이메일 전달 (완료 — `test@ongod.com`, 브라우저 로그인으로 확인됨)
- [x] **P1-S2-T0a** 🧑 Apple Music API 키 발급 (완료, 라이브 검증됨 — [로그](./logs/backend-log.md#2026-09-05--p1-s2-t0at1-후속--apple-music-키-반영--라이브-검증))
- [ ] ⏸️ **P1-S2-T0b** 🧑 Spotify API 키 발급 — 보류 (2026-08-28: 무료 계정으로 Web API 접근 불가, Premium 요구. 필수 아니라서 스킵하고 진행 중)
- [x] **P1-S2-T0c** 🧑 YouTube Data API 키 발급 (완료, 라이브 검증됨)
- [x] **P1-S2-T0d** 🧑 Genius API 키 발급 (완료, 라이브 검증됨)
- [x] **P1-S3-T0** 🧑 Anthropic API 키 발급·결제수단 등록 (완료, 라이브 검증됨 — OnGod 전용 워크스페이스 키로 재발급)
- [x] **P1-S4 후속** 🧑 `supabase/migrations/20260829000001_lyrics_source_url.sql`을 dev·prod 둘 다에 적용 (완료 — Supabase PAT 발급받아 전달해줘서 Management API로 직접 적용·검증함, 마이그레이션 이력 테이블에도 기록)
- [x] **P1-S4-T8** 🧑 Storage 버킷 생성·공개 정책 설정 (완료 — PAT로 직접 생성, `album-covers` 버킷 dev/prod 둘 다)
- [ ] **P1-S5-T6** 🧑 AI 생성 콘텐츠 신학적/사실 정확성 최종 검수 (지속 운영 업무) — 검수 UI 완성됨(`/review`)
  *2026-09-08: **dev DB에 곡 5개를 실제 파이프라인으로 채웠는데, 그 콘텐츠의 `검수 완료` 표시는 내가 위젯 개발용으로 세운 것이지 실제 검수를 거친 게 아니다.** 위젯이 동작하려면 발행된 픽이 있어야 해서 부득이하게 세웠고, dev 한정이다. **prod에는 절대 이렇게 하지 않는다** — 출시 전 실제 노출될 콘텐츠는 반드시 당신이 `/review`에서 직접 읽고 검수해야 한다. 지금 dev의 내용도 시간 나실 때 한 번 봐주시면 좋다(AI 번역·해석 품질 감을 잡는 용도로도 유용하다).*
- [ ] **P1-S6-T7** 🧑 Scheduled Function/pg_cron 활성화·권한 승인

## Phase 2 — Core App

- [ ] **P2-S2-T4** 🤝 유료·라이선스 폰트 사용 시 폰트 파일 제공 (무료 폰트로 처리해서 해당 없음)
- [x] **P2-S6-T0a** 🧑 Sign in with Apple 설정 (완료 — Apple Developer에서 App ID `com.ongod.app`에 capability 켜고 확인해주심. Supabase Auth 쪽은 이미 P2-S6에서 `com.ongod.app`을 허용 Client ID로 등록해둠)
- [x] **P2-S6-T0b** 🧑 Google OAuth Client 생성 → Supabase 입력값 전달 (완료 — Web/iOS 클라이언트 ID·secret 전달받아 `.env`에 저장, Supabase Auth Google 프로바이더에도 반영 완료)
- [x] **P2-S6 후속** 🧑 Supabase Personal Access Token 임시 제공 (완료 — 받은 즉시 Google/Apple 프로바이더 활성화 + `profiles` 자동생성 마이그레이션 적용에 쓰고 버림. 어떤 파일에도 저장 안 함)
- [x] **P2-S6 후속2** 🧑 Google Cloud Console 리디렉션 URI 재확인 (완료 — 사용자가 정확히 등록함. **실제 원인은 내 쪽 실수였음**: Supabase Auth에 Google 프로바이더를 처음 켤 때 `external_google_client_id`에 Web 클라이언트 ID 대신 iOS 클라이언트 ID를 잘못 넣어놔서, iOS 클라이언트엔 등록 안 된 리디렉션 URI로 요청이 나가 계속 막혔던 것. Web 클라이언트 ID로 다시 고치고 나니 정상 동작 — 아래 로그 참고)
- [ ] **P2-S7-T3** 🤝 Sentry 계정·프로젝트 생성, DSN 전달 — 코드는 준비됨(DSN 없으면 그냥 안 켜지는 상태로 안전하게 대기 중). [sentry.io](https://sentry.io) 무료 플랜으로 계정 만들고 React Native 프로젝트 생성하면 DSN(`https://...@....ingest.sentry.io/...` 형태) 나옴 — 그거 전달해주면 바로 연결
- [ ] **P2-S7-T4** 🤝 분석 도구(선택) 계정·키 제공 — 지금은 이벤트가 콘솔 로그로만 남음(코드는 완성). Amplitude/PostHog 등 실제 도구를 붙이고 싶으면 알려주시고, 아니면 지금 상태로도 무방(선택 사항)

## Phase 3 — Widget & 출시

- [ ] **P3-S2-T1** 🤝 Apple Developer에서 App Group·위젯 App ID·프로비저닝 설정 — **Phase 3 S2 시작 전에 필요하다. 지금 미리 해두면 좋다.**
  *구체적으로 세 가지: (1) **App Group** 생성 — `group.com.ongod.app` 형태 권장. 앱과 위젯이 데이터를 주고받는 통로라 위젯의 핵심 전제다. (2) **위젯 확장용 App ID** — 기존 `com.ongod.app`과 별개로 `com.ongod.app.widget` 같은 걸 만들고, 두 App ID 모두에 위 App Group을 활성화. (3) 두 App ID의 **프로비저닝 프로파일** 갱신. 만든 뒤 App Group 식별자를 정확한 문자열로 알려주면 내가 Config Plugin에 반영한다.*
  *참고: **Expo Go로는 위젯을 못 띄운다.** Phase 3부터는 EAS 개발 빌드가 필수다(EAS 프로젝트 연결 자체는 이미 완료 — 계정 `doyis`).*
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
