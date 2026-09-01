# 프론트엔드 세션 시작 프롬프트

> 새 Claude Code 세션에서 이 프로젝트 폴더(`/Users/hadohadopapi/Desktop/OnGod`)를 열고
> 아래 내용을 그대로 붙여넣는다. 이 파일 자체는 참고용 보관본이다.

---

너는 OnGod 프로젝트의 **프론트엔드 트랙 세션**이다. `CLAUDE.md`를 이미 읽었을 테니 세부
규칙(로그 템플릿, 결정 권한 3단계, 담당자 구분 등)은 반복하지 않는다. 아래는 지금 이 세션이
정확히 어떤 상태에서 시작하는지, 뭘 해야 하는지에 대한 상세 브리핑이다.

## 1. 먼저 이 순서로 읽어라

1. `docs/OVERVIEW.md` — 전체 원칙
2. `docs/logs/handoff.md` — **미해결 항목 2개가 너를 기다리고 있다** (아래 3번에 요약해뒀지만
   원문도 꼭 읽어라)
3. `docs/phase-2-core-app.md` — 네가 작업할 Task 목록 (S1~S7)
4. `docs/phase-0-foundation.md` — 이미 완료된 상태. S1(모노레포)·S3(공유 패키지) 부분만
   훑어서 지금 뭐가 준비돼 있는지 파악
5. `docs/logs/backend-log.md`의 최근 항목들 — 특히 P0-S1-T1~T7, P0-S3-T1~T5, Phase 1 전체

## 2. 지금까지 상황 요약

- **Phase 0(기초 인프라) 완료.** 모노레포(pnpm+Turborepo), Supabase dev/prod 프로젝트,
  공유 패키지(`packages/core`, `packages/db`, `packages/integrations`), CI 설정까지 끝남.
- **Phase 1(콘텐츠 파이프라인) 완료.** 어드민에서 곡 등록 → 메타데이터 자동 수집 → AI 해석 →
  검수 → 예약 발행까지 전체 파이프라인이 동작한다. Apple Music API 키만 아직 없어서(사람이
  발급 예정) 메타데이터 일부가 비어있을 수 있지만 **화면 개발에는 지장 없다.**
- **dev DB에 실제 데이터가 있다.** 곡 2개가 등록돼 있고 그중 1개는 `daily_picks`에
  `status='published'`로 이미 발행돼 있다. 즉 오늘의 곡 조회 쿼리를 짜면 **바로 진짜 데이터가
  나온다** — mock 데이터를 만들 필요 없다.
- **네 차례다.** Phase 2(Core App, MVP 앱)를 시작한다.

## 3. handoff.md의 미해결 항목 2개 (네가 처리해야 함)

### 항목 1 — `apps/mobile` 스캐폴딩 관련

지금 `apps/mobile`에는 정말 최소한의 껍데기만 있다:
```
apps/mobile/
├── App.tsx        # 기본 Expo 템플릿, 화면/네비게이션 없음
├── index.ts
├── app.json
├── eas.json
├── eslint.config.js   # packages/config 확장
├── tsconfig.json      # packages/config 확장
└── package.json
```

`package.json` 의존성은 이거뿐이다:
```json
"dependencies": {
  "expo": "~52.0.0",
  "expo-status-bar": "~2.0.0",
  "react": "18.3.1",
  "react-native": "0.76.5"
}
```

**Expo Router도, TanStack Query도, 네비게이션 라이브러리도 아직 하나도 안 깔려있다.**
P2-S1-T1(Expo Router 골격)부터 네가 직접 설치해야 한다. 이 버전 조합(Expo 52 / RN 0.76.5 /
React 18.3.1) 그대로 써도 되고, 문제가 있다고 판단하면 바꿔도 된다 — 다만 바꾸면 이유를
`frontend-log.md`에 남기고 `handoff.md`에도 "버전 바꿨다"고 남겨라 (백엔드가 만든
`apps/admin`이나 CI 설정과 버전 정합성 깨질 수 있음).

**이 handoff 항목을 처리했으면 `docs/logs/handoff.md`에서 해당 항목 상태를
`[x] 처리완료`로 바꿔라.**

### 항목 2 — `packages/core`/`packages/db` 사용법

이미 만들어진 공유 패키지가 있다. **새로 만들지 말고 이거 그대로 써라.**

`packages/core`가 export하는 것:
```ts
// 도메인 타입 (packages/core/src/domain/types.ts)
Profile, Song, Lyrics, SongInfo, DailyPick, UserFavorite, PushSubscription
// (camelCase, DB의 snake_case row와 다름 — 아래 db 패키지의 변환 함수가 매핑해줌)

// KST 날짜 유틸 (packages/core/src/date/kst.ts)
toKstDateString(date: Date): string       // 'YYYY-MM-DD' (KST 기준)
kstMidnightToUtc(dateString: string): Date
isSameKstDay(a: Date, b: Date): boolean
```

`packages/db`가 export하는 것:
```ts
// 클라이언트 팩토리 (packages/db/src/client.ts)
createAnonClient(url: string, anonKey: string): OnGodClient
// ⚠️ createServiceRoleClient도 export되지만 이건 서버 전용이다.
//    모바일 앱에서는 절대 import하지 마라 (service_role 키가 클라이언트 번들에 들어가면 안 됨).

// DB row → 도메인 타입 변환 함수 (packages/db/src/mappers.ts)
fromSongRow, fromLyricsRow, fromSongInfoRow, fromDailyPickRow,
fromProfileRow, fromPushSubscriptionRow, fromUserFavoriteRow, fromPipelineRunRow

// 타입 (packages/db/src/types/database.ts, CLI 자동생성 — 손대지 마라)
Database, Tables, TablesInsert, TablesUpdate, Json
```

**Supabase 연결 방법**: `.env`(프로젝트 루트, 로컬 전용·gitignore됨)에 이미 값이 있다.
```
SUPABASE_DEV_URL=https://bauchkybtccrclasheqf.supabase.co
SUPABASE_DEV_ANON_KEY=<이미 있음>
```
Expo에서 쓰려면 `EXPO_PUBLIC_` 접두사가 붙은 env var로 노출해야 클라이언트 번들에 포함된다
(Expo의 규칙). `.env`를 직접 `apps/mobile`에서 읽든, `apps/mobile/.env`를 새로
만들어 `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`로 다시 선언하든 네가
판단해라 — 다만 **service_role 키는 절대 `EXPO_PUBLIC_` 접두사를 붙이지 마라 (붙이는 순간
클라이언트 번들에 노출된다).**

예시 사용:
```ts
import { createAnonClient } from "@ongod/db";
import { fromDailyPickRow, fromSongRow } from "@ongod/db";
import { toKstDateString } from "@ongod/core";

const supabase = createAnonClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

const today = toKstDateString(new Date());
const { data } = await supabase
  .from("daily_picks")
  .select("*, songs(*)")
  .eq("pick_date", today)
  .eq("status", "published")
  .maybeSingle();
```

**`apps/mobile/package.json`에 워크스페이스 의존성 추가부터 해라:**
```json
"dependencies": {
  "@ongod/core": "workspace:*",
  "@ongod/db": "workspace:*",
  "@supabase/supabase-js": "^2.x"
}
```

**이 handoff 항목도 처리했으면 `docs/logs/handoff.md`에서 상태를 `[x] 처리완료`로 바꿔라.**

## 4. `packages/ui-tokens`는 아직 없다

Phase 0 계획엔 있었지만 아무도 안 만들었다 (백엔드 트랙 산출물이 아니었음). **P2-S2(디자인
시스템)에서 네가 직접 만들어라.** `packages/core`, `packages/db`와 같은 구조(별도 워크스페이스
패키지, `packages/config`의 공유 tsconfig/eslint 확장)로 만들면 된다.

## 5. 시작할 작업 순서 (강제 아님, `phase-2-core-app.md` 기준)

1. **P2-S1 (앱 기반)** — Expo Router 설치·네비게이션 골격, Supabase 연결 (`packages/db`
   재사용), TanStack Query 데이터 레이어, 도메인 훅(`useTodayPick` 등)
2. **P2-S2 (디자인 시스템)** — `packages/ui-tokens` 새로 생성, 다크모드 기본 토큰, 기초
   컴포넌트, 스트리밍 브랜드 컬러
3. **P2-S3 (Daily Card)** — 여기서 처음으로 실제 화면이 나온다. 실제 dev DB의 발행된 곡
   데이터를 화면에 띄워봐라 — 이게 되면 P2-S1~S3가 제대로 연결됐다는 검증이 된다
4. **P2-S4 (가사 뷰어)** → **P2-S5 (스트리밍 딥링크)** → **P2-S6 (인증, Apple/Google —
   OAuth 키는 사람 발급 필요, `docs/human-actions.md` P2-S6-T0a/T0b 참고. 키 오기 전까지는
   게스트 모드부터 짜도 됨)** → **P2-S7 (성능·안정화)**

Phase 3(위젯)는 지금 안 건드려도 된다 — Phase 2가 어느 정도 자리 잡은 뒤에 논의.

## 6. 작업 규칙 리마인드

- Task 하나 끝날 때마다 `docs/logs/frontend-log.md`에 append (템플릿은 그 파일 안에 있음) +
  `docs/phase-2-core-app.md` 체크박스 갱신
- 계획에 없던 세부 Task는 그 자리에서 ID 붙여서 추가 (예: `P2-S1-T7`), 물어볼 필요 없음
- **백엔드 트랙에 영향 주는 변경**(예: `packages/core`/`packages/db`의 export를 바꿔야
  할 필요가 생기면)은 `docs/logs/handoff.md`에 필수 기록 — 직접 그 패키지를 고쳐도 되지만
  왜 고쳤는지 반드시 남겨라
- 되돌리기 어려운 구조적 결정(상태관리 라이브러리 선택, 네비게이션 구조 등)은
  `docs/decisions/000N-*.md`로 ADR 작성
- 커밋은 자유롭게 하되, **GitHub push는 하기 전에 사용자에게 확인받을 것**
- `.env`의 service_role 키 등은 절대 클라이언트 코드나 커밋에 포함하지 말 것. Supabase
  Personal Access Token을 새로 요구하는 상황이 오면(타입 재생성 등) 파일에 저장하지 말고
  명령 실행에만 쓰고 즉시 버려라

## 7. 지금 실행 불가능한 것 (참고만 해라, 사람 몫)

- iOS/Android 실기기·시뮬레이터 테스트 — 이 환경엔 Xcode/Android Studio 없음
- 네이티브 빌드(EAS Build) 실행 — 설정(`eas.json`)까지만 준비돼 있고 실제 빌드는 안 해봄
- Apple/Google OAuth 클라이언트 발급 — `docs/human-actions.md` 참고, 사람이 처리 중일 수 있음

여기까지 확인했으면 `docs/phase-2-core-app.md`의 P2-S1부터 시작해라.
