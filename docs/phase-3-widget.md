# Phase 3 — Widget (소형 위젯) · MVP 출시 지점

> **목표**: SRS 3.2 소형 위젯(2×2, P0)을 iOS·Android에 구현. 앱을 열지 않아도 오늘의 곡 확인(SRS 1.2 생활밀착).
> **범위**: 소형 위젯만. 중형/잠금화면/푸시는 출시 후.
> **완료 정의(DoD)**: 2×2 위젯 추가 → 앨범커버+곡명 표시 → 자정 자동 갱신 → 탭 시 앱 오늘 카드 진입.
> **방식**: 네이티브 직접 작성 (**ADR-0004**).

> 담당자 범례: 🤖 에이전트 · 🧑 사람 · 🤝 협업 (자세히: [OVERVIEW.md](./OVERVIEW.md)). 작업 전 [handoff.md](./logs/handoff.md) 확인, 완료 후 [logs/](./logs/)에 기록.

## 진행 체크리스트

- [ ] S1. 위젯 데이터 공급 — T1·T3·T4 완료(backend), T2만 남음(frontend) — [로그](./logs/backend-log.md#2026-09-08--p3-s1-t1t3t4--위젯-데이터-계약--이미지-규격)
- [ ] S2. iOS 위젯 (WidgetKit)
- [ ] S3. Android 위젯 (Glance)
- [ ] S4. 갱신·딥링크·안정화

---

## ⚠️ 사전 검토 — 가장 큰 기술 리스크

위젯은 Expo 표준 밖의 네이티브 코드. 시작 전:
- **빌드**: Expo Config Plugin + EAS Build, `expo prebuild` 필요(bare 검토)
- **데이터 공유**: iOS App Group / Android SharedPreferences·DataStore
- **원칙**: 위젯은 로컬 캐시를 읽고, 갱신은 백그라운드 task 담당
- 결정 근거: **ADR-0004**

---

## S1. 위젯 데이터 공급

### Task

- [x] 🤖 **P3-S1-T1** — 위젯 전용 경량 데이터(커버·곡명·아티스트·딥링크, published만) — `public.widget_today_pick` 뷰(마이그레이션 `20260908090000`). KST 자정 기준 오늘의 published 픽 0~1행, `security_invoker=on`으로 RLS 유지. dev·prod 적용 ([로그](./logs/backend-log.md#2026-09-08--p3-s1-t1t3t4--위젯-데이터-계약--이미지-규격))
- [ ] 🤖 **P3-S1-T2** — 앱이 오늘 곡 수신 시 공유 스토리지에 위젯 데이터 기록 — **frontend 소관.** 계약은 [handoff 2026-09-08 backend → frontend](./logs/handoff.md) 참고
- [x] 🤖 **P3-S1-T3** — 위젯용 축소 이미지 준비 (ADR-0003 파이프라인 재사용) — **512×512 WebP**, 경로 `{songId}/widget.webp`, 1년 캐시. 기존 150px는 실측 위젯 크기(iOS @3x 최대 510px)에 크게 부족해 상향. 기존 곡 백필 완료 ([로그](./logs/backend-log.md#2026-09-08--p3-s1-t1t3t4--위젯-데이터-계약--이미지-규격))
- [x] 🤖 **P3-S1-T4** — 데이터 계약 문서화 (앱·iOS·Android 공유) — [handoff 2026-09-08 backend → frontend](./logs/handoff.md)에 필드표·이미지 규격·딥링크·fallback 순서·자정 갱신 트레이드오프까지 정리

---

## S2. iOS 위젯 (WidgetKit)

### Task

- 🤝 **P3-S2-T1** — Config Plugin으로 Widget Extension 타깃 추가·EAS Build
  *~~당신: Apple Developer에서 App Group·위젯용 App ID·프로비저닝 설정~~ → **2026-09-08 완료.** 확정 식별자: App Group `group.com.ongod.app` / 위젯 Bundle ID `com.ongod.app.widget` / 앱 `com.ongod.app`. 프로비저닝은 EAS Build가 자동 생성. 남은 건 에이전트 몫(플러그인·SwiftUI 코드)*
- 🤖 **P3-S2-T2** — App Group 공유 컨테이너 연결
- 🤖 **P3-S2-T3** — 2×2 SwiftUI 위젯 뷰 (커버+곡명)
- 🤖 **P3-S2-T4** — TimelineProvider: 공유 컨테이너 읽기·자정 갱신
- 🤖 **P3-S2-T5** — 위젯 탭 → 앱 오늘 카드 딥링크
- 🤖 **P3-S2-T6** — 데이터 없음/이미지 실패 fallback
- 🧑 **P3-S2-T7** — iOS 실기기 테스트
  *당신: 실제 아이폰에 위젯 추가·갱신·탭 동작 확인 (시뮬레이터 한계, 사람 확인 필요)*

---

## S3. Android 위젯 (Glance)

### Task

- 🤖 **P3-S3-T1** — Config Plugin으로 Glance 위젯 추가·EAS Build
- 🤖 **P3-S3-T2** — SharedPreferences/DataStore 데이터 공유
- 🤖 **P3-S3-T3** — 2×2 Glance 위젯 뷰 (커버+곡명)
- 🤖 **P3-S3-T4** — 위젯 갱신 (WorkManager 자정)
- 🤖 **P3-S3-T5** — 위젯 탭 → 앱 딥링크 (Intent)
- 🤖 **P3-S3-T6** — fallback 디자인 (iOS와 일관)
- 🧑 **P3-S3-T7** — Android 실기기 테스트
  *당신: 실제 안드로이드 기기에 위젯 추가·갱신·탭 확인*

---

## S4. 갱신·딥링크·안정화 (SRS 4.2)

### Task

- 🤖 **P3-S4-T1** — 백그라운드 fetch 자정 자동 갱신
- 🤖 **P3-S4-T2** — 발행 cron과 위젯 갱신 타임존 정합성 (KST)
- 🤖 **P3-S4-T3** — 딥링크 라우팅 통합
- 🧑 **P3-S4-T4** — 양 플랫폼 실기기 종합 테스트
  *당신: iOS·Android 실기기에서 자정 갱신·탭 진입 최종 확인*
- 🤖 **P3-S4-T5** — 갱신 실패·네트워크 없음 시 캐시 유지

---

## Phase 3 종료 기준 (= MVP 출시 기준)

- ✅ iOS·Android 2×2 위젯 추가 가능
- ✅ 위젯에 오늘 곡 커버+곡명 표시
- ✅ 자정(KST) 자동 갱신
- ✅ 위젯 탭 → 앱 오늘 카드 진입
- ✅ Phase 0~3 실제 데이터로 안정 동작 → 스토어 제출 준비 완료

---

## 출시 게이트 체크리스트 (대부분 🧑 당신)

- 🧑 App Store / Play Store 심사 메타데이터·스크린샷 제출
- 🧑 개발자 계정 등록 (Apple $99/년, Google $25 1회)
- 🤖→🧑 개인정보처리방침 작성(나) → 게시·링크(당신)
- 🤝 가사 저작권 출처 표기 최종 점검 (SRS 4.3 / 8장)
- 🧑 콘텐츠 재고 2주치 이상 예약 (SRS 4.3, 운영)
- 🤝 prod Supabase 환경·시크릿·RLS 최종 검증
- 🧑 크래시·분석 prod 키 연결
