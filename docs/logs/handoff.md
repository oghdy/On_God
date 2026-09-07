# Handoff — 트랙 간 영향 전파

> 백엔드 ↔ 프론트엔드처럼 **한 트랙의 변경이 다른 트랙의 작업에 영향을 줄 때만** 여기에 남긴다.
> 일반 작업 기록은 여기가 아니라 [`backend-log.md`](./backend-log.md) / [`frontend-log.md`](./frontend-log.md)에 쓴다.
>
> **모든 세션은 작업 시작 전 이 파일을 반드시 먼저 읽는다.** 미해결(`[ ]`) 항목 중
> 자기 트랙 것이 있으면 처리하고 상태를 `[x]`로 바꾼다. 처리한 항목도 지우지 않고 남겨둔다
> (지운 기록은 다음 세션이 "그런 일이 있었는지" 알 방법이 없어진다).

## 작성 규칙

무엇이 handoff 감인지 판단 기준:
- 다른 트랙의 코드/화면/데이터 구조를 수정해야만 하는 변경
- 다른 트랙이 의존하던 API·필드명·타입이 바뀐 경우
- 다른 트랙 작업 순서에 영향을 주는 결정 (예: 이 Task가 끝나야 저쪽이 시작 가능)

## 템플릿

```markdown
## YYYY-MM-DD · {backend|frontend} → {frontend|backend}

**변경**: 무엇이 바뀌었는지
**영향**: 상대 트랙에서 구체적으로 뭘 손봐야 하는지
**관련**: [해당 로그 항목](./backend-log.md#앵커) 또는 [ADR](../decisions/000N-*.md)
**상태**: [ ] 미해결
```

처리 완료 시 `**상태**: [x] 처리완료 — 처리한 세션/날짜` 로 바꾼다.

---

<!-- 아래에 새 handoff 항목을 계속 추가한다 -->

## 2026-08-28 · backend → frontend

**변경**: `apps/mobile` 최소 스캐폴딩 생성 (Expo 52 / React Native 0.76 / React 18.3.1). `App.tsx` + `index.ts` + `app.json`만 있는 껍데기 — 화면/네비게이션/상태관리 등은 전혀 없음. `tsc --noEmit`, `eslint .`는 통과하지만 **네이티브 빌드(Xcode/Android Studio)는 이 세션에서 확인 안 함** (환경에 없음, 실기기 테스트는 🧑 사람 몫).
**영향**: 프론트 세션 시작 시 이 스캐폴딩을 기준으로 진행할지, 처음부터 다시 짤지 판단 필요. `package.json`의 expo/react-native 버전(그리고 `@types/react` `~18.3.12` — react-native peer 요구사항에 맞춘 것) 그대로 쓸지 확인. `apps/mobile/eslint.config.js`·`tsconfig.json`은 `packages/config`(공유 tsconfig/eslint)를 확장하는 구조이니 그 규칙을 따라주면 나중에 CI lint가 깨지지 않음. `packages/ui-tokens`는 아직 없음 — 필요해지면 프론트 트랙에서 만들어도 됨(S1~S6 어디에도 명시된 산출물 아니었음).
**관련**: [backend-log P0-S1-T1~T7](./backend-log.md#2026-08-28--p0-s1-t1t7--모노레포-스캐폴딩pnpm--turborepo--apps--packagesconfig), [packages/README.md](../../packages/README.md)
**상태**: [x] 처리완료 — 프론트 세션, 2026-09-01. Expo Router 골격으로 이 스캐폴딩을 기반으로 계속 진행. `expo`/`react-native` 버전은 유지하되 `react-native`만 `0.76.5`→`0.76.9`로 정렬함(아래 새 handoff 항목 참고). 자세한 내용은 [frontend-log P2-S1-T1~T6](./frontend-log.md#2026-09-01--p2-s1-t1t6--expo-router-골격--supabase-연결--데이터-레이어) 참고.

## 2026-08-28 · backend → frontend

**변경**: `@ongod/core`(도메인 타입: `Song`/`DailyPick`/`Profile` 등, KST 자정 기준 날짜 유틸 `toKstDateString`/`kstMidnightToUtc`/`isSameKstDay`)와 `@ongod/db`(Supabase 클라이언트 팩토리 `createAnonClient`/`createServiceRoleClient`, DB row→도메인 변환 함수)가 생겼다. `apps/mobile`에는 아직 이 패키지들이 의존성으로 추가돼 있지 않음.
**영향**: 앱에서 Supabase 연결하거나 Daily Pick 날짜 계산할 때 새로 만들지 말고 이거 써주면 됨. `apps/mobile/package.json`에 `"@ongod/core": "workspace:*"`, `"@ongod/db": "workspace:*"` 추가해서 쓰면 됨(anon 클라이언트만 필요할 것 — service-role 클라이언트는 서버 전용이니 모바일에서 import하지 말 것). `packages/db/src/types/database.ts`는 Docker 부재로 CLI 자동생성 대신 손으로 마이그레이션 SQL 기준으로 작성됨 — 스키마 관련 타입 이슈 있으면 이 파일부터 의심.
**관련**: [backend-log P0-S3-T1~T5](./backend-log.md#2026-08-28--p0-s3-t1t5--packagesdb--packagescore-도메인-타입공유-유틸)
**상태**: [x] 처리완료 — 프론트 세션, 2026-09-01. `apps/mobile/package.json`에 두 패키지 모두 `workspace:*`로 추가, `useTodayPick`/`useSongLyrics` 훅에서 `fromDailyPickRow`/`fromSongRow`/`fromLyricsRow` 그대로 사용 중. `packages/db`의 `createAnonClient`는 RN에 맞게 소폭 확장함(아래 새 handoff 항목 참고).

## 2026-09-01 · frontend → backend

**변경**: 세 가지.
1. `packages/db/src/client.ts`의 `createAnonClient(url, anonKey)`에 세 번째 인자 `options?: { storage?: SupportedStorage }`를 추가했다(선택적, 기본 동작 불변). RN에는 `localStorage`가 없어서 세션 저장소로 `AsyncStorage`를 주입해야 하는데, 기존 시그니처로는 불가능했음. `apps/admin`은 옵션을 안 넘기므로 기존 동작 그대로다.
2. 루트에 `.npmrc`(`node-linker=hoisted`)를 추가했다 — Expo/Metro가 `metro`, `@babel/runtime` 같은 깊은 transitive 의존성을 프로젝트 기준으로 직접 `require()`해서 pnpm 기본 isolated 레이아웃이 깨졌음. 근거와 트레이드오프는 [ADR-0005](../decisions/0005-pnpm-hoisted-linker.md) 참고.
3. `apps/mobile`의 `react-native`를 `0.76.5`→`0.76.9`로 올렸다(`expo install --fix`가 SDK 52 호환 버전으로 정렬).
**영향**: (1)은 하위호환이라 admin 쪽 코드 변경 불필요. (2)는 저장소 전체 `node_modules` 레이아웃이 바뀌는 변경이라 admin도 영향권 — 변경 후 `pnpm turbo run typecheck lint test`(admin 포함 7개 워크스페이스)가 모두 통과함은 확인했지만, pnpm의 엄격한 격리(phantom dependency 방지)가 전역적으로 느슨해진 것은 알아둬야 함. 다음에 backend 세션이 새 패키지를 설치하다 이상하게 동작하면 이 변경을 의심할 것. CI 캐시 관련 첫 실행이 느려질 수 있음(레이아웃 변경으로 캐시 무효화).
**관련**: [ADR-0005](../decisions/0005-pnpm-hoisted-linker.md), [frontend-log P2-S1-T1~T6](./frontend-log.md#2026-09-01--p2-s1-t1t6--expo-router-골격--supabase-연결--데이터-레이어)
**상태**: [x] 처리완료 — 백엔드 세션, 2026-09-07. (1) `createAnonClient`의 선택적 `options` 인자는 하위호환이라 admin 쪽 변경 없이 그대로 두면 됨. (2) `.npmrc`의 `node-linker=hoisted`는 실제로 admin을 깨뜨리고 있었고(아래 항목 참고) [ADR-0006](../decisions/0006-pnpm-isolated-public-hoist.md)으로 대체함 — Expo/Metro 대응 목적은 `shamefully-hoist=true`로 그대로 유지. (3) `react-native` 0.76.9 정렬은 그대로 유지. 자세한 내용은 [backend-log 2026-09-07](./backend-log.md#2026-09-07--p0-s6-t6--ongodadmin-타입체크빌드-복구-pnpm-링커-재설계)

## 2026-09-01 · frontend → backend

**변경**: 새 마이그레이션 `supabase/migrations/20260901120000_handle_new_user_profile.sql` 추가 — `auth.users`에 새 행이 생기면(최초 로그인) `public.profiles`를 자동으로 만들어주는 트리거(`on_auth_user_created` → `handle_new_user()`). P2-S6-T3(로그인 시 profiles 자동 생성) 대응.
**영향**: ~~아직 dev/prod DB 어디에도 적용 안 됨~~ → **dev DB엔 적용 완료**(사람이 준 임시 PAT로 Management API를 통해 SQL 실행 + `supabase_migrations.schema_migrations`에 버전 등록까지 함, `pg_trigger`로 트리거 존재 확인함). **prod DB엔 아직 미적용** — backend가 prod 배포 때 이 파일도 같이 적용해야 함(로컬 `supabase db push`를 쓸 거라면, 이 머신의 `supabase` CLI 로그인 세션이 OnGod 프로젝트가 아닌 다른 계정/조직에 연결돼 있으니 재로그인 확인 먼저 할 것).
**관련**: [frontend-log P2-S6](./frontend-log.md#2026-09-01--p2-s6--인증-apple구글-로그인--게스트-모드)
**상태**: [x] 처리완료 — 백엔드 세션, 2026-09-07. prod에도 적용 완료(사람이 준 임시 PAT로 Management API 사용, `supabase db push`는 쓰지 않고 ref를 명시한 호출만 사용 — 토큰이 보는 프로젝트가 `ongod-dev`/`ongod-prod` 두 개뿐임을 먼저 확인함). 조회해보니 Phase 1 마이그레이션 3개는 prod에 **이미 적용돼 있었고** 빠진 건 이것 하나였음. dev↔prod `public` 스키마 전체 diff로 동기화 검증까지 완료. 참고: **`.env`의 `SUPABASE_*_DB_PASSWORD` 두 값은 현재 유효하지 않다**(psql 인증 실패) — 자세한 내용은 [backend-log 2026-09-07](./backend-log.md#2026-09-07--p2-s6-t3-후속--prod-db-마이그레이션-동기화)

## 2026-09-01 · frontend → backend

**변경**: `pnpm turbo run typecheck lint test` 전체 실행 중 `@ongod/admin:typecheck`가 실패하는 걸 발견함 — `app/layout.tsx`, `app/(admin)/layout.tsx` 등에서 `ReactNode`/`ReactPortal` 타입 불일치, `<form action={서버액션함수}>`가 `string`에 할당 안 된다는 에러. **admin 코드 자체의 버그가 아니라 pnpm 의존성 레이아웃 문제로 보인다**: `next` 패키지가 루트(`node_modules/next`)에 완전히 호이스팅되는데, admin은 React 19(`apps/admin/node_modules/@types/react@19.1.17`)를 쓰고 루트에는 mobile이 쓰는 React 18(`node_modules/@types/react@18.3.31`)이 호이스팅돼 있어서, next의 내부 타입 참조가 admin 것이 아니라 루트의(18.x) `@types/react`를 잡아버리는 것으로 추정 — 서로 다른 `ReactNode` 정의 두 개가 한 컴파일에 섞이는 전형적인 증상(참고: `Type 'bigint' is not assignable to type 'ReactNode'`처럼 React 19 전용 타입이 걸리는 에러가 같이 나옴).
**영향**: **이건 지금 막 생긴 문제가 아니라 P2-S1의 `node-linker=hoisted` 전환(ADR-0005) 이후 계속 잠재해있었을 가능성이 높다** — turbo 캐시가 `admin:typecheck`를 계속 캐시 히트로 넘겨서 실제로 재실행된 적이 없다가, 이번에 `apps/mobile`에 새 패키지(`expo-web-browser` 등)를 여럿 설치하면서 캐시가 무효화돼 처음으로 다시 실행되며 드러난 것으로 보인다. 대충 손댄 해결책(`apps/admin/tsconfig.json`에 `typeRoots` 제한)을 시도해봤는데 에러 모양만 바뀌고 완전히 해결되지는 않아서(next 자체의 호이스팅 위치 문제라 admin의 tsconfig만으로는 근본 해결이 안 됨) **되돌렸다** — admin/Next.js 쪽은 backend 트랙 소관이라 어설프게 고치기보다 정확히 진단만 남겨둔다. 확실한 건 `apps/mobile`/`packages/*`는 이 문제와 무관하게 전부 정상 통과한다는 것(`pnpm turbo run typecheck lint test --filter='!@ongod/admin'` = 17/17 성공). 근본 해결책 후보: (1) `apps/admin`이 `next`를 직접 `dependencies`에 명시해서 강제로 admin 밑에 nest되게 하기, (2) `.npmrc`에 `next`/`@types/react*` 계열만 hoist 안 되게 패턴 지정, (3) ADR-0005 자체를 재검토(hoisted 대신 isolated + `public-hoist-pattern`으로 필요한 것만 선택적 hoist) — 다만 (3)은 Expo/Metro 쪽이 다시 깨질 수 있어 신중히 접근할 것.
**관련**: [ADR-0005](../decisions/0005-pnpm-hoisted-linker.md), [frontend-log P2-S6](./frontend-log.md#2026-09-01--p2-s6--인증-apple구글-로그인--게스트-모드)
**상태**: [x] 처리완료 — 백엔드 세션, 2026-09-07. 진단이 정확했음(호이스팅된 `next`가 루트의 React 18 타입을 잡는 문제). 다만 **증상이 하나 더 있었다** — `next build`도 `Cannot read properties of null (reading 'useRef')`로 깨져 있었음(next와 admin이 서로 다른 물리 사본의 React 19를 잡아 훅 디스패처가 갈라짐). 제안된 후보 중 (1)(admin에 `next` 명시)은 이미 돼 있어 무효였고, (2)/(3)에 해당하는 방향으로 해결: 링커를 기본(isolated)+`shamefully-hoist`로 되돌리고 `packageExtensions`로 `next`에만 React 19 타입을 주입 → [ADR-0006](../decisions/0006-pnpm-isolated-public-hoist.md). `pnpm turbo run typecheck lint test build` **20/20 통과**(admin 포함, `--filter` 회피 없음). [backend-log 2026-09-07](./backend-log.md#2026-09-07--p0-s6-t6--ongodadmin-타입체크빌드-복구-pnpm-링커-재설계)

## 2026-09-06 · frontend → backend

**변경**: 없음(코드 변경 아님) — P2-S7-T2(이미지 CDN·WebP 확인) 하다가 발견한 것만 기록.
**영향**: 앨범 커버 WebP 파일(`album-covers` 버킷)이 Cloudflare CDN을 거치긴 하는데, 응답 헤더가 `cache-control: no-cache`(+ `cf-cache-status: MISS`)라 엣지 캐싱이 사실상 안 먹고 있음 — 매 요청이 오리진(Supabase Storage)까지 감. 앨범 커버는 한 번 올라가면 안 바뀌는 파일이라 길게 캐싱해도 안전할 것 같은데(예: `Cache-Control: public, max-age=31536000, immutable`), 이 값은 업로드 시점에 정해지는 거라 이미 올라간 파일은 재업로드해야 바뀜 — 앨범 커버 업로드하는 파이프라인 코드(Phase 1 어드민 쪽, `album-covers` 버킷에 올리는 스크립트) 쪽에서 `cacheControl` 옵션을 지정하는 게 맞다고 판단해서 내가 직접 안 고치고 여기 남김. 확인: `curl -sI "https://bauchkybtccrclasheqf.supabase.co/storage/v1/object/public/album-covers/<song-id>/cover.webp"`로 재현 가능.
**관련**: [frontend-log P2-S7](./frontend-log.md#2026-09-06--p2-s7-t1t5--성능안정화)
**상태**: [x] 처리완료 — 백엔드 세션, 2026-09-07. 업로드 코드에 `cacheControl: "31536000"`(1년) 지정함. **다만 진단을 한 가지 정정한다: 엣지 캐싱이 꺼져 있던 게 아니라 1시간이었다.** `curl -sI`(HEAD)는 Supabase Storage가 `no-cache`를 돌려주지만, 같은 URL을 **GET**으로 받으면 `cache-control: public, max-age=3600` + `cf-cache-status: HIT`이 나온다(3600은 `cacheControl` 미지정 시 기본값). 앞으로 Storage 캐시 헤더를 확인할 땐 `curl -s -D - -o /dev/null <url>`(GET)을 쓸 것. **이미 올라간 파일의 백필은 아직 안 했다**(기존 파일 덮어쓰기라 사람 확인 대기) — 기존 파일은 여전히 `max-age=3600`. [backend-log 2026-09-07](./backend-log.md#2026-09-07--p1-s4-t5-후속--앨범커버-storage-업로드-cachecontrol-지정)

## 2026-09-07 · backend → frontend

**변경**: pnpm 링커 설정을 바꿨다 — `.npmrc`가 `node-linker=hoisted`(ADR-0005) → 기본(isolated) 링커 + `shamefully-hoist=true`([ADR-0006](../decisions/0006-pnpm-isolated-public-hoist.md)). 함께 `pnpm-workspace.yaml`에 `packageExtensions`(next에 React 19 타입 주입)와 루트 `package.json`에 `@types/react@18.3.31`(루트 호이스팅 버전을 mobile용 18로 고정)이 추가됐다. `apps/mobile`의 코드/의존성 버전은 **하나도 안 건드렸다.**
**영향**:
- **다음에 `git pull` 하면 반드시 `node_modules`를 지우고 다시 설치할 것.** hoisted → isolated 전환을 기존 `node_modules`를 둔 채 `pnpm install`로 하면 pnpm이 옛 flat 트리를 정리하다 사실상 멈춘다(실제로 27분간 무진전 → 강제 종료함). `rm -rf node_modules apps/*/node_modules packages/*/node_modules && pnpm install` 하면 8초에 끝난다.
- 동작상 mobile에 영향이 없음은 확인했다: `pnpm --filter @ongod/mobile typecheck` 통과, **`npx expo export --platform ios`로 실제 Metro 번들 생성 성공**(Hermes 4.97MB), ADR-0005가 인용한 두 딥 require(`metro/src/lib/TerminalReporter`, `@babel/runtime/helpers/interopRequireDefault`)도 `apps/mobile` 기준으로 정상 해석됨. 그래도 다음 프론트 세션 시작 시 `expo start`를 한 번 돌려 실기기/Expo Go 쪽도 이상 없는지 봐주면 좋겠다.
- **`@types/react` 버전을 올릴 일이 생기면 세 곳을 같이 봐야 한다**: `apps/admin/package.json`(19), `pnpm-workspace.yaml`의 `packageExtensions`(19), 루트 `package.json`(18, mobile용). 한 곳만 올리면 이 문제가 그대로 재발한다.
- 근본 해결은 Expo SDK 53+ 업그레이드로 저장소 전체를 React 19로 통일하는 것이다 — 그때 위 두 장치를 걷어내면 된다. 프론트 트랙이 SDK 업그레이드를 계획하게 되면 이 부채를 같이 정리하는 걸로 잡아주면 좋겠다.
**관련**: [ADR-0006](../decisions/0006-pnpm-isolated-public-hoist.md), [backend-log 2026-09-07](./backend-log.md#2026-09-07--p0-s6-t6--ongodadmin-타입체크빌드-복구-pnpm-링커-재설계)
**상태**: [x] 처리완료 — 프론트 세션, 2026-09-07. 지시대로 지우고 재설치(2.9초)한 뒤 `expo start`를 돌렸더니 **앱이 아예 안 떴다** — 이중 React 회귀. 원인은 ADR-0006이 루트 `@types/react`만 18로 고정하고 런타임 `react`를 빠뜨린 것(`shamefully-hoist`가 루트에 admin용 19를 올림 → react를 peer로 선언 안 한 `expo-router`/`expo-modules-core` 등이 그 19를 잡음). 루트 `package.json`에 `react`/`react-dom` 18 고정으로 수정하고 [ADR-0007](../decisions/0007-root-react-runtime-pin.md)로 근거를 남김 — **ADR-0006의 장치를 되돌린 게 아니라 한 줄 더 쓴 것이고, admin은 20/20 그대로다.** 수정 후 Expo Go에서 오늘 카드·스와이프·가사(원문/해석)·로그인 모달 전부 정상, 첫 렌더 372ms(기존 297~384ms 범위). 상세는 [frontend-log 2026-09-07](./frontend-log.md#2026-09-07--p0-s6-t6b--adr-0006-링커-전환-후-모바일-기동-검증--이중-react-회귀-수정). 아래 새 항목 두 개 확인 바람.

## 2026-09-07 · frontend → backend

**변경**: 루트 `package.json`의 `devDependencies`에 `"react": "18.3.1"`, `"react-dom": "18.3.1"` 두 줄을 추가했다([ADR-0007](../decisions/0007-root-react-runtime-pin.md)). ADR-0006이 `@types/react`에 쓴 것과 동일한 장치를 런타임 사본에도 적용한 것 — 링커 설정(`.npmrc`)이나 `packageExtensions`는 **건드리지 않았다.**
**영향**:
- **`react` 계열 버전을 올릴 때 봐야 할 곳이 세 곳 → 다섯 곳이 됐다.** ADR-0006 "영향" 절의 세 곳 표는 ADR-0007 표로 갱신됐으니 그쪽을 보면 된다: `apps/admin/package.json`(19) / `pnpm-workspace.yaml` `packageExtensions`(19) / 루트 `@types/react`(18) / **루트 `react`(18)** / **루트 `react-dom`(18)**.
- admin은 영향 없음을 확인했다 — admin과 next는 각자 선언한 의존성으로 `.pnpm/react@19.2.8/`을 공유해서 잡으므로 루트에 뭐가 올라오든 무관하다. `pnpm turbo run typecheck lint test build --force --concurrency=1` 20/20 통과(`next build` 포함).
- 참고로 **타입체크·`expo export` 성공은 이 클래스의 회귀를 못 잡는다** — React 사본이 둘이어도 번들링은 정상 성공하고 런타임에만 터진다. 앞으로 `node_modules` 레이아웃을 바꾸면 앱을 실제로 한 번 띄워보거나, ADR-0007에 적어둔 한 줄 검사(루트와 mobile의 `react` 버전 일치)를 쓰는 게 좋겠다.
**관련**: [ADR-0007](../decisions/0007-root-react-runtime-pin.md), [frontend-log 2026-09-07](./frontend-log.md#2026-09-07--p0-s6-t6b--adr-0006-링커-전환-후-모바일-기동-검증--이중-react-회귀-수정)
**상태**: [ ] 미해결 (읽고 확인만 해주면 됨 — 조치할 건 없음)

## 2026-09-07 · frontend → backend

**변경**: 없음(코드 변경 아님) — 검증 중 발견한 기존 결함만 기록.
**영향**: `pnpm turbo run typecheck lint test build`를 **동시 실행하면 `@ongod/admin:typecheck`가 간헐적으로 실패한다.** `apps/admin/tsconfig.json`의 `include`에 `.next/types/**/*.ts`가 들어있는데, 같은 시각 `@ongod/admin:build`(`next build`)가 그 디렉터리를 지웠다 다시 만들면서 `error TS6053: File '.../.next/types/app/layout.ts' not found`가 난다(파일 5~6개에 대해 동시에). 재현·격리 결과: `--concurrency=1`이면 20/20 통과, `build`를 뺀 `typecheck lint test`만이면 19/19 통과, 넷을 동시에 돌리면 실패 — 즉 **내 의존성 변경과 무관한 기존 레이스**이고, 백엔드 세션이 본 20/20은 레이스를 이긴 결과로 보인다. **CI는 영향 없음을 확인했다** — `.github/workflows/ci.yml`은 `pnpm lint`/`pnpm typecheck`/`pnpm test`를 각각 별도 스텝으로 돌리므로 typecheck와 build가 겹치지 않는다. 즉 이 레이스는 로컬에서 네 개를 한 번에 돌릴 때만 터진다. **다만 그 반대급부로 CI는 `build`를 아예 안 돌린다** — ADR-0006이 고쳤던 증상 2(`next build`가 `Cannot read properties of null (reading 'useRef')`로 깨지던 것)는 지금 CI가 잡아주지 못한다는 뜻이라, 레이스를 고치는 김에 CI에 build 스텝을 넣는 것도 같이 검토해주면 좋겠다. 고치는 방향은 두 가지: (1) `turbo.json`에서 admin `typecheck`가 `build`에 `dependsOn`하게 해서 순서를 강제, (2) `.next/types`를 `include`에서 빼기(다만 Next의 타입 라우트 검증을 잃음). admin/Next 소관이라 판단해서 진단만 남기고 손대지 않았다.
**관련**: [frontend-log 2026-09-07](./frontend-log.md#2026-09-07--p0-s6-t6b--adr-0006-링커-전환-후-모바일-기동-검증--이중-react-회귀-수정)
**상태**: [ ] 미해결
