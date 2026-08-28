# OnGod 개발 문서 — 전체 개요

> 블랙 가스펠 · 흑인영가 큐레이션 앱 — 개발 로드맵 및 작업 명세
> 기준 문서: `OnGod_SRS_v0.2_3.docx`
> **이 파일은 내부 개발용이다.** 외부 공개용 프로젝트 소개는 루트 `README.md`(별도)를 참고.

## 이 문서를 읽는 사람에게

이 폴더(`docs/`)는 **개발의 단일 진실 공급원(Single Source of Truth)** 이다.
모든 작업은 `Phase → Step → Task` 3단 계층으로 관리하며, 실제 작업 기록은
[`docs/logs/`](./logs/)에, 구조적 결정의 근거는 [`docs/decisions/`](./decisions/)에 남긴다.

- **Phase** : 큰 개발 단계 (출시 마일스톤 단위)
- **Step** : Phase를 구성하는 논리적 묶음
- **Task** : 실제로 손에 잡히는 구현 단위 (1 PR ≈ 1~N Task)

각 Task는 고유 ID(`P0-S1-T2` 형식)를 가지며, 커밋/PR/로그에서 이 ID로 참조한다.

## 세션(에이전트)이 작업을 시작할 때 읽는 순서

이 프로젝트는 프론트엔드/백엔드 세션이 나뉘어 병렬로 작업한다. 컨텍스트가 리셋되거나
새 세션(다른 에이전트 포함)으로 넘어가도 아래 순서로 읽으면 지금까지의 모든 결정과
진행 상황을 파악할 수 있다.

1. `docs/OVERVIEW.md` (이 문서) — 전체 흐름·원칙 파악
2. `docs/logs/handoff.md` — 다른 트랙이 나에게 남긴 항목이 있는지 확인
3. 작업할 `docs/phase-N-*.md` — 해당 Phase의 Task 목록
4. 필요 시 `docs/decisions/*.md` — 관련 ADR

세션의 상세 작업 규칙(로그 템플릿, 결정 권한 등)은 프로젝트 루트의 `CLAUDE.md`에 있다.

## 담당자 범례 (Task 앞 아이콘)

| 아이콘 | 담당 | 의미 |
|--------|------|------|
| 🤖 | **에이전트 (Claude)** | 코드 작성, 파일 생성, SQL/설정 작성 등 에이전트가 직접 수행 |
| 🧑 | **사람 (프로젝트 소유자)** | 외부 대시보드 작업, 계정 생성, API 키 발급, 결제, 스토어 제출, 실기기 테스트 등 |
| 🤝 | **협업** | 에이전트가 코드/설정을 준비하고, 사람이 인증·키 입력·승인 등을 수행 |

> 🧑·🤝 Task에는 *사람이 구체적으로 무엇을 해야 하는지*를 옆에 적어둔다.
> 사람이 할 일만 한눈에 모은 목록은 **[핸드오프 체크리스트](./human-actions.md)** 참고.

## 결정 기록 (ADR)

주요 아키텍처 결정과 그 근거는 [`docs/decisions/`](./decisions/)에 ADR로 보존한다.
- [ADR-0001 — 운영 테이블 RLS: Service Role 쓰기 전용](./decisions/0001-rls-write-policy.md)
- [ADR-0002 — 파이프라인 상태 추적 테이블](./decisions/0002-pipeline-runs-table.md)
- [ADR-0003 — 앨범커버 Storage 복사 + WebP](./decisions/0003-album-cover-storage.md)
- [ADR-0004 — 위젯: 네이티브 직접 작성](./decisions/0004-widget-native.md)

새 ADR을 추가할 땐 `docs/decisions/000N-짧은-제목.md` 형식으로, 되돌리기 어려운 구조적
결정에만 작성한다 (사소한 구현 선택은 로그로 충분).

## 작업 기록 (Log)

실제 작업 내용은 Phase 문서가 아니라 [`docs/logs/`](./logs/)에 시간순으로 쌓는다.

- [`logs/backend-log.md`](./logs/backend-log.md) — 백엔드 트랙 작업 기록
- [`logs/frontend-log.md`](./logs/frontend-log.md) — 프론트엔드 트랙 작업 기록
- [`logs/handoff.md`](./logs/handoff.md) — 트랙 간 영향 전파 (양쪽 다 읽고 씀)

## 설계 대원칙 (모든 Phase 공통)

이 프로젝트의 1순위 목표는 **유지보수성·확장성**이다. 모든 의사결정은 아래 원칙을 따른다.

| # | 원칙 | 실천 방법 |
|---|------|-----------|
| 1 | **경계를 명확히 한다** | 앱 / 어드민 / 백엔드 / 공유코드를 모노레포 패키지로 분리 |
| 2 | **외부 의존성을 격리한다** | 모든 외부 API(Apple·Spotify·YouTube·Genius·Claude)는 어댑터 뒤에 숨긴다 |
| 3 | **타입을 공유한다** | DB 스키마 → 타입 자동 생성, 앱·어드민이 동일 타입 사용 |
| 4 | **데이터를 먼저 만든다** | 파이프라인(Phase 1)을 앱(Phase 2)보다 먼저 → 실제 데이터로 개발 |
| 5 | **부수효과를 가장자리로 민다** | 비즈니스 로직은 순수 함수로, I/O는 경계 레이어에서만 |
| 6 | **설정은 코드 밖으로** | 시크릿·환경값은 env, 운영 파라미터는 DB |

## 마일스톤

| Phase | 이름 | 산출물 | MVP |
|-------|------|--------|-----|
| **0** | Foundation | 모노레포·Supabase·공유타입·CI | ✅ |
| **1** | Content Pipeline | 어드민 + 자동화 파이프라인 + 예약발행 | ✅ |
| **2** | Core App | Daily Card · 가사 · 스트리밍 · 로그인 | ✅ |
| **3** | Widget (소형) | 홈화면 2×2 위젯 (iOS/Android) | ✅ (MVP 출시 지점) |
| 4+ | Engagement / Scale | 아카이브·즐겨찾기·푸시·중형위젯·수익화 | ❌ 출시 후 |

> **MVP 출시 = Phase 0 + 1 + 2 + 소형 위젯**
> 중형/잠금화면 위젯, 푸시 알림, 아카이브, 즐겨찾기 등은 출시 후 디벨롭.

## 문서 목록

| 문서 | 내용 | 바뀌는 빈도 |
|------|------|-------------|
| [phase-0-foundation.md](./phase-0-foundation.md) | Foundation Task 목록 | 낮음 (체크박스만) |
| [phase-1-content-pipeline.md](./phase-1-content-pipeline.md) | Content Pipeline Task 목록 | 낮음 |
| [phase-2-core-app.md](./phase-2-core-app.md) | Core App Task 목록 | 낮음 |
| [phase-3-widget.md](./phase-3-widget.md) | Widget Task 목록 | 낮음 |
| [decisions/](./decisions/) | ADR (결정 근거) | 결정할 때만, 불변 |
| [logs/](./logs/) | 실제 작업 기록 | 매 Task마다 |
| [human-actions.md](./human-actions.md) | 사람이 할 일 모음 | 필요시 |

## 진행 상태 추적

각 Phase 문서 상단의 체크리스트로 진행률을 관리한다.
Task 완료 시 `[ ]` → `[x]` 로 변경하고, 옆에 해당 [`logs/`](./logs/) 항목 링크를 단다.
