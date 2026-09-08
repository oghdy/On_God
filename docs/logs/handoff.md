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
- 참고로 **타입체크·`expo export` 성공은 이 클래스의 회귀를 못 잡는다** — React 사본이 둘이어도 번들링은 정상 성공하고 런타임에만 터진다.
- **재발 방지 검사를 CI에 넣어뒀다**(P0-S6-T6c): `scripts/check-single-react.mjs`가 `pnpm install` 직후 스텝으로 돌면서 expo 계열 패키지들이 mobile과 같은 react 사본을 잡는지 확인한다. 루트 핀을 제거해 사고 상태를 재현했을 때 실제로 exit 1로 실패하는 것까지 확인했으니, 앞으로 링커나 의존성 레이아웃을 건드려도 이 사고는 CI에서 잡힌다.
**관련**: [ADR-0007](../decisions/0007-root-react-runtime-pin.md), [frontend-log 2026-09-07](./frontend-log.md#2026-09-07--p0-s6-t6b--adr-0006-링커-전환-후-모바일-기동-검증--이중-react-회귀-수정)
**상태**: [x] 처리완료 — 백엔드 세션, 2026-09-08. 확인함. 다만 이 항목은 **ADR-0008(SDK 57 / React 19 통일)로 이미 무효화됐다** — 루트 react/react-dom 18 고정은 제거됐고 관리 지점은 `pnpm-workspace.yaml`의 `overrides` 한 곳이다. 여기 적힌 '다섯 곳' 표는 더 이상 유효하지 않으니 다음 세션은 ADR-0008을 보면 된다. `scripts/check-single-react.mjs`가 CI에 남아 있는 건 그대로 유지하는 게 맞다고 판단했다(React 통일과 무관하게 링커·의존성 레이아웃 사고를 잡는 그물).

## 2026-09-07 · frontend → backend

**변경**: 없음(코드 변경 아님) — 검증 중 발견한 기존 결함만 기록.
**영향**: `pnpm turbo run typecheck lint test build`를 **동시 실행하면 `@ongod/admin:typecheck`가 간헐적으로 실패한다.** `apps/admin/tsconfig.json`의 `include`에 `.next/types/**/*.ts`가 들어있는데, 같은 시각 `@ongod/admin:build`(`next build`)가 그 디렉터리를 지웠다 다시 만들면서 `error TS6053: File '.../.next/types/app/layout.ts' not found`가 난다(파일 5~6개에 대해 동시에). 재현·격리 결과: `--concurrency=1`이면 20/20 통과, `build`를 뺀 `typecheck lint test`만이면 19/19 통과, 넷을 동시에 돌리면 실패 — 즉 **내 의존성 변경과 무관한 기존 레이스**이고, 백엔드 세션이 본 20/20은 레이스를 이긴 결과로 보인다. **CI는 영향 없음을 확인했다** — `.github/workflows/ci.yml`은 `pnpm lint`/`pnpm typecheck`/`pnpm test`를 각각 별도 스텝으로 돌리므로 typecheck와 build가 겹치지 않는다. 즉 이 레이스는 로컬에서 네 개를 한 번에 돌릴 때만 터진다. **다만 그 반대급부로 CI는 `build`를 아예 안 돌린다** — ADR-0006이 고쳤던 증상 2(`next build`가 `Cannot read properties of null (reading 'useRef')`로 깨지던 것)는 지금 CI가 잡아주지 못한다는 뜻이라, 레이스를 고치는 김에 CI에 build 스텝을 넣는 것도 같이 검토해주면 좋겠다. 고치는 방향은 두 가지: (1) `turbo.json`에서 admin `typecheck`가 `build`에 `dependsOn`하게 해서 순서를 강제, (2) `.next/types`를 `include`에서 빼기(다만 Next의 타입 라우트 검증을 잃음). admin/Next 소관이라 판단해서 진단만 남기고 손대지 않았다.
**후속(2026-09-07~08, 프론트 세션)**: **CI에 `pnpm build` 스텝을 추가했다** — `typecheck`와 별도 스텝이라 순차 실행되므로 레이스가 성립하지 않고, 동시에 ADR-0006이 고쳤던 `next build` 깨짐도 이제 CI가 잡는다. **정정**: 처음에 "env 없이도 빌드된다"고 적었는데 **틀렸다.** 로컬에서 `env -i`로 셸 환경만 비우고 검증했는데, Next.js가 디스크의 `apps/admin/.env.local`을 자동으로 읽고 있었다. 실제 CI에선 `NEXT_PUBLIC_SUPABASE_URL: Required`로 깨졌다. `.env.local`을 실제로 치운 상태에서 재검증한 뒤, 워크플로에 **가짜 플레이스홀더 env**를 넣어 해결했다(진짜 시크릿 아님 — 빌드 통과 여부만 보는 것이 목적이고 실제 배포 빌드는 Vercel이 진짜 값으로 수행한다). **즉 CI 쪽 구멍은 메워졌고, 남은 건 로컬에서 `pnpm turbo run typecheck lint test build`를 한 번에 돌릴 때 나는 레이스뿐이다.** 이건 여전히 admin `tsconfig.json`/`turbo.json` 소관이라 backend가 판단해주면 된다(급하지 않음 — 로컬에선 `--concurrency=1`로 우회 가능).
**관련**: [frontend-log 2026-09-07](./frontend-log.md#2026-09-07--p0-s6-t6b--adr-0006-링커-전환-후-모바일-기동-검증--이중-react-회귀-수정), [frontend-log P0-S6-T6c](./frontend-log.md#2026-09-07--p0-s6-t6c--이중-react-회귀-방지-검사-ci-추가--android-검증)
**상태**: [x] 처리완료 — 백엔드 세션, 2026-09-08. 고쳤다. 제안된 두 방향 중 (1)(turbo `dependsOn`으로 순서 강제)은 typecheck만 돌려도 build가 딸려와 느려지고, (2)(`.next/types`를 include에서 빼기)는 `tsconfig.json`이 Next가 직접 관리하는 파일이라 `next dev/build`가 도로 되돌린다. 그래서 **typecheck 전용 `tsconfig.typecheck.json`을 따로 두고 거기서만 `.next`를 끊었다**(`tsconfig.json`은 그대로). `exclude`만으로는 부족했다 — `next-env.d.ts`의 `/// <reference path="./.next/types/routes.d.ts" />`가 exclude를 무시하고 파일을 끌어와서, `next-env.d.ts`를 제외하고 그 참조를 `compilerOptions.types`로 직접 지정해야 `.next` 참조가 0이 된다. 타입 라우트 검증은 `next build`가 그대로 하므로 저장소 전체 검증 범위는 동일하다. **동시 실행 3회 연속 20/20**(`--concurrency` 제한 없이)로 재현 안 되는 것 확인. [backend-log 2026-09-08](./backend-log.md#2026-09-08--p0-s6-t6d--admin-typecheck-next-types-레이스-제거)

## 2026-09-08 · frontend → backend

**변경**: `apps/mobile`을 **Expo SDK 52 → 57**(React 18.3.1 → 19.2.3, RN 0.76.9 → 0.86.3)로 올렸다([P0-S7](../phase-0-foundation.md#s7-런타임-업그레이드-expo-sdk-57--react-19-통일), [ADR-0008](../decisions/0008-expo-sdk-57-react-19.md)). **어드민 코드와 공유 패키지는 한 줄도 안 건드렸다.** 다만 저장소 루트 설정 두 개가 바뀌었으니 이건 꼭 알고 있어야 한다.

**영향** — 세 가지만 기억하면 된다.

1. **`git pull` 후 반드시 `node_modules`를 지우고 재설치할 것.** React 메이저가 통째로 바뀌었다.
   ```
   rm -rf node_modules apps/*/node_modules packages/*/node_modules && pnpm install
   ```

2. **React 버전 관리 지점이 다섯 곳 → 한 곳이 됐다.** ADR-0006·0007이 만든 장치를 전부 **제거**했다:
   - 루트 `package.json`의 `react`/`react-dom`/`@types/react` 18 고정 → **삭제**
   - `pnpm-workspace.yaml`의 `packageExtensions`(next에 React 19 타입 주입) → **삭제**

   대신 `pnpm-workspace.yaml`에 `overrides` 네 줄로 저장소 전체 버전을 강제한다. **앞으로 React 계열 버전을 올릴 땐 거기만 고치면 된다.** ADR-0006·0007은 Superseded로 표시했으니 그 문서의 "세 곳/다섯 곳 표"는 더 이상 유효하지 않다.

   `packageExtensions`를 지웠는데도 **admin 타입체크가 통과한다** — 저장소에 `@types/react`가 하나뿐이라 next가 잘못 잡을 대상 자체가 없어졌기 때문. `pnpm turbo run typecheck lint test build --force --concurrency=1` **20/20**(`next build` 포함)으로 확인했다.

3. **`.npmrc`의 `shamefully-hoist=true`는 유지했다** — Expo/Metro의 깊은 require 대응이라는 ADR-0005의 원래 목적은 여전히 유효하다. 링커 설정은 안 건드렸다.

**backend가 판단해줬으면 하는 것 (조치 필요, 급하지 않음)**:

- **TypeScript 6.0 업그레이드**. `expo install --check`가 SDK 57 기준 `~6.0.3`을 권장하는데, TS는 admin·packages가 함께 쓰는 저장소 전체 의존성이라 이번 SDK 작업에 끼워 넣지 않고 5.9.3을 유지했다(그 상태로 20/20 통과 확인). admin/Next 쪽 영향을 판단할 수 있는 건 backend라 넘긴다.
- 이전 handoff에 남긴 **admin `.next/types` 레이스**는 그대로다(로컬에서 네 개를 동시에 돌릴 때만, CI는 안전).

**관련**: [ADR-0008](../decisions/0008-expo-sdk-57-react-19.md), [frontend-log 2026-09-08](./frontend-log.md#2026-09-08--p0-s7-t1t7--expo-sdk-52--57-업그레이드-react-19-통일-adr-00060007-부채-청산)
**상태**: [x] 처리완료 — 백엔드 세션, 2026-09-08. 1·2·3 확인했다(`node_modules` 재설치하고 작업함). **TypeScript는 6.0.3으로 올렸다.** 판단 근거: 6.0.2/6.0.3은 정식 릴리스이고, `next` 15.5.24는 typescript를 peer로 요구하지 않아 버전 제약 자체가 없다. 먼저 `overrides`로 임시 적용해 `typecheck lint test build` **20/20 통과**를 확인한 뒤, override는 지우고 선언 8곳(`apps/*`, `packages/*`, 루트)을 `^6.0.3`으로 갱신했다. TS 7.0.2가 이미 npm `latest`지만(네이티브 Go 포트) 도약이 크고 Expo 권장도 `~6.0.3`이라 거기 맞췄다 — 7은 툴체인이 더 무르익은 뒤에 별도로 판단하는 게 맞다. [backend-log 2026-09-08](./backend-log.md#2026-09-08--p0-s7-후속--typescript-603-채택)

## 2026-09-08 · frontend → backend

**변경**: **CI가 계속 실패하고 있던 것을 고쳤다** — 지금은 전 스텝 그린이다. 원인이 세 겹이었다.
1. `.github/workflows/ci.yml`: `pnpm/action-setup@v4`의 `with.version: 10` **제거**. 루트 `package.json`의 `packageManager`와 중복 지정돼 `Multiple versions of pnpm specified`로 **설치 단계에서 즉사**하고 있었다. 그래서 lint/typecheck/test가 실제로 돌아본 적이 없다.
2. 같은 파일 `pnpm build` 스텝에 **가짜 플레이스홀더 env** 지정(`NEXT_PUBLIC_SUPABASE_URL` 등 4개). 진짜 시크릿이 아니고 GitHub Secrets도 쓰지 않았다 — 빌드 통과 여부만 보는 것이 목적이고, 실제 배포 빌드는 Vercel이 진짜 값으로 한다(P0-S6-T4).
3. `turbo.json`의 `build` 태스크에 `"env": ["SUPABASE_SERVICE_ROLE_KEY", "ADMIN_EMAILS"]` **추가**. turbo가 선언 안 한 환경변수를 태스크에 안 넘긴다. `NEXT_PUBLIC_*`는 Next.js 프레임워크 감지로 자동 통과하지만 서버 전용 값은 명시해야 한다.
**영향**:
- **admin/CI가 backend 트랙 소관인데 내가 손댔다.** 내가 P0-S6-T6c에서 추가한 build 스텝이 실패의 직접 원인 중 하나였고(2·3), 저장소를 빨간불로 두고 넘기는 게 더 나쁘다고 판단했다. 변경은 워크플로 3줄과 `turbo.json` 1줄뿐이고 admin 코드는 안 건드렸다. **방식이 마음에 안 들면 바꿔도 된다** — 특히 플레이스홀더 대신 GitHub Secrets에 진짜 값을 넣는 쪽을 선호한다면 그건 사람 몫 작업이라 판단은 backend가 하는 게 맞다.
- `turbo.json`의 `env` 선언은 부수적으로 **캐시 정확성**도 올린다 — 이 값들이 캐시 키에 반영돼 설정이 다른 빌드가 캐시를 잘못 재사용하지 않는다. 앞으로 admin이 새 서버 env를 쓰게 되면 **여기에도 같이 추가**해야 한다. 안 그러면 로컬에선 되고 CI에서만 깨진다.
**관련**: [frontend-log 2026-09-08 (CI 복구)](./frontend-log.md#2026-09-08--p0-s6-t1-후속--푸시-후-발견-ci가-계속-실패하고-있었음-3단-원인)
**상태**: [x] 처리완료 — 백엔드 세션, 2026-09-08. 확인했고 **셋 다 그대로 유지한다.** admin/CI가 내 소관인 건 맞지만, 빨간 CI를 넘기지 않으려고 고친 판단이 옳았다 — 특히 (1)은 내 트랙이 만든 결함이고(`packageManager`와 `action-setup.version` 중복), 그걸 방치했으면 이 세션에서도 lint/typecheck/test가 한 번도 안 돈 채로 계속 갔을 것이다. **플레이스홀더 env도 유지한다**: CI의 목적은 '빌드가 통과하는가'이고 진짜 배포는 Vercel이 실제 값으로 한다(P0-S6-T4). GitHub Secrets에 진짜 값을 넣으면 관리 지점만 하나 더 늘고, PR 빌드에 실제 시크릿을 노출하는 위험이 생겨서 오히려 나쁘다. `turbo.json`의 `env` 선언 규칙(admin이 새 서버 env를 쓰면 여기도 추가)은 알아뒀고, 앞으로 지킨다.

## 2026-09-08 · backend → frontend

**변경**: Phase 3 S1의 백엔드 소관 두 Task를 끝냈다 — 위젯이 읽을 **데이터 계약**과 **이미지 규격**이 확정됐다. 프론트는 이걸 기준으로 P3-S1-T2(앱 → 공유 스토리지 기록)를 시작하면 된다.

### 1. 읽기 엔드포인트 — `widget_today_pick` 뷰 (P3-S1-T1)

```
GET {SUPABASE_URL}/rest/v1/widget_today_pick?select=*
apikey: {ANON_KEY}
```

anon 키로 조회된다(게스트 모드에서도 위젯이 동작해야 하므로 의도된 것). **결과는 0행 또는 1행.**

| 필드 | 타입 | 설명 |
|------|------|------|
| `pick_date` | `date` | KST 기준 오늘 날짜 (`YYYY-MM-DD`) |
| `published_at` | `timestamptz` | 실제 발행 시각 |
| `song_id` | `uuid` | 곡 ID |
| `title` | `text` | 곡명 |
| `artist` | `text` | 아티스트 |
| `widget_image_url` | `text?` | **위젯용 512×512 WebP** (아래 2번) — **null 가능** |
| `album_cover_url` | `text?` | 원본 600×600 WebP — `widget_image_url`이 null일 때 대체용, 역시 null 가능 |

**뷰가 서버에서 강제하는 것** — 앱·iOS·Android 세 곳이 각자 구현하면 반드시 어긋나는 부분이라 DB로 내렸다:
- `status = 'published'`인 픽만 (예약·미검수 콘텐츠가 위젯에 새어나가지 않음)
- **"오늘"의 기준은 KST 자정.** P1-S6 발행 cron(UTC 15:00 = KST 00:00)과 정확히 같은 기준이다. 클라이언트 로컬 타임존으로 계산하면 해외 사용자에게 하루 어긋난다 — **직접 계산하지 말고 이 뷰를 그대로 쓸 것.**

**0행이 나오는 경우가 정상 시나리오다** (그날 픽이 없거나 아직 검수가 안 끝나 발행 안 됨). 이때 위젯은 P3-S2-T6/P3-S3-T6 fallback을 타면 된다. 지금 dev가 정확히 이 상태라 fallback 경로를 바로 테스트해볼 수 있다.

### 2. 위젯 이미지 규격 (P3-S1-T3)

| 항목 | 값 |
|------|-----|
| 크기 | **512 × 512** (정사각, `fit: cover`로 크롭) |
| 포맷 | WebP (quality 82) |
| 경로 | `album-covers/{songId}/widget.webp` |
| 캐시 | `Cache-Control: public, max-age=31536000` (1년) |
| 대략 용량 | 30~60KB |

**512인 이유**: iOS 소형 위젯은 최대 170×170pt이고 @3x 기기(iPhone 15/16 Pro Max)에서 실측 510×510px, Android 2×2도 xxxhdpi에서 비슷하다. 기존 150px는 여기 늘려 그리면 눈에 띄게 뭉개진다. 더 키우지 않은 건 iOS 위젯 익스텐션 메모리 예산(~30MB)이 빡빡해서다(512×512 디코드가 약 1MB).

**WebP는 양 플랫폼 다 된다** — iOS는 14+에서 ImageIO가 디코딩하고(우리 최소 타깃보다 낮음), Android는 4.0+.

**파일명이 `thumbnail.webp`가 아니라 `widget.webp`인 이유**: 기존 150px가 `thumbnail.webp`에 1년 캐시로 이미 올라가 있어서, 같은 경로에 덮어쓰면 CDN 엣지에 남은 150px가 만료 전까지 그대로 나갈 수 있다. 새 파일명으로 캐시 충돌을 원천 차단했다. **DB 컬럼명은 `songs.album_cover_thumbnail_url` 그대로**이고(뷰에서 `widget_image_url`로 노출), 그 값이 이제 `widget.webp`를 가리킨다.

### 3. 딥링크

위젯 탭 → **`ongod://`** (앱 index = 오늘 카드). 목적지가 항상 같아서 데이터로 내려보내지 않는다 — 상수로 두면 된다. 곡별 가사로 바로 보내고 싶어지면 `ongod://lyrics/{song_id}`가 되겠지만, P3-S2-T5 명세는 "오늘 카드 진입"이라 그대로 뒀다.

### 4. 프론트가 판단해야 할 것 — 자정 갱신 시 데이터 공백

**내일 픽을 미리 못 받는다.** RLS가 `published`만 노출하고, 내일 픽은 KST 자정 cron이 돌기 전까지 `scheduled`다. 즉 **자정 직전에 미리 받아두는 prefetch가 구조적으로 불가능**하다.

그래서 위젯 갱신은 이렇게 될 수밖에 없다: 자정 이후 백그라운드 fetch가 성공해야 새 곡이 뜬다. iOS 백그라운드 fetch는 실행 시점이 OS 재량이라, **자정 직후 잠깐 어제 곡이 남아 있는 구간이 생긴다.**

선택지는 둘이다:
- **(a) 그대로 두기** — 어제 곡이 잠시 남고, fetch 성공 시 갱신. 구현 단순, 데이터는 항상 정확(발행된 것만 노출).
- **(b) 내일 픽 prefetch를 허용** — `scheduled` 픽을 자정 N시간 전부터 읽을 수 있게 뷰/RLS를 여는 것. 위젯 체감은 좋아지지만 **미발행 편집 콘텐츠가 클라이언트로 미리 나간다**(검수 중 내용이 바뀔 수도 있고, 발행 전에 유출됨).

**나는 (a)를 기본으로 두고 뷰를 오늘 것만 내려주게 만들었다.** (b)가 필요하다고 판단되면 말해달라 — 뷰와 RLS를 여는 건 백엔드가 하면 되는데, 미발행 콘텐츠 노출은 제품 판단이라 내가 혼자 정할 게 아니라고 봤다. P3-S4-T1/T2 붙이면서 실제 체감을 보고 결정해도 늦지 않다.

### 5. 이미지 fallback 순서 (P3-S2-T6 / P3-S3-T6 설계 참고)

`widget_image_url` → (null이면) `album_cover_url` → (null이면) 앱 내장 플레이스홀더. 세 번째까지 갈 수 있다는 걸 꼭 처리해달라 — **지금 dev의 "Go Down Moses"가 실제로 커버가 아예 없는 케이스다**(Storage 버킷이 생기기 전에 등록된 곡이라 그렇다. 원인은 [backend-log 2026-09-08](./backend-log.md) 참고).

**관련**: `supabase/migrations/20260908090000_widget_today_pick_view.sql`, `apps/admin/lib/pipeline/album-cover.ts`, [phase-3-widget.md S1](../phase-3-widget.md#s1-위젯-데이터-공급)
**상태**: [x] 처리완료 — 프론트 세션, 2026-09-08. 계약대로 구현했다(뷰 조회·필드·폴백 3단계·딥링크 상수 전부). **실측으로 계약 검증**: `widget.webp` 512×512 36KB / `cover.webp` 600×600 46KB / 둘 다 `Cache-Control` 1년 — 문서와 일치. 날짜는 클라이언트에서 계산하지 않고 뷰에 맡겼다. **4번(자정 갱신 공백)은 (a) 그대로 두기를 기본으로 유지하고 아직 확정하지 않았다** — P3-S4-T1/T2에서 실제 체감을 본 뒤 결정하고, prefetch가 필요하면 새 handoff로 요청하겠다. 다만 **`packages/db`의 DB 타입에 뷰가 빠져 있어** `.from("widget_today_pick")`이 타입 에러였다 — 아래 새 항목 참고.

## 2026-09-08 · backend → frontend (2차)

**변경**: Phase 3 착수에 필요한 **사람 몫 선행조건이 완료**됐고, dev에 **2주치 콘텐츠**가 채워졌다.

### 1. Apple Developer 식별자 확정 (P3-S2-T1 선행조건 완료)

사람이 아래 값 그대로 만들어뒀다. **Config Plugin에 이 문자열을 그대로 쓰면 된다.**

| 항목 | 값 |
|------|-----|
| App Group | `group.com.ongod.app` |
| 위젯 확장 Bundle ID | `com.ongod.app.widget` |
| 앱 Bundle ID (기존, App Group 활성화됨) | `com.ongod.app` |

프로비저닝 프로파일은 EAS Build가 자동 생성하므로 따로 만들 필요 없다. **Expo Go로는 위젯이 안 뜨니 EAS 개발 빌드가 필요하다**(EAS 프로젝트 연결은 이미 완료 — 계정 `doyis`).

### 2. dev 콘텐츠 — 오늘부터 13일치 연속 확보

곡 20개(완전 정상 15), 발행 4 + 예약 12. **9/8(오늘)부터 9/20까지 하루도 안 비어 있다.**

- 9/9부터는 **진짜 pg_cron이 KST 자정마다 하나씩 발행**한다(`scheduled` → `published`). 이번 세션에서 cron이 10일 내내 정확히 UTC 15:00에 돈 걸 실행 이력으로 확인했으니, **위젯 자정 갱신을 며칠에 걸쳐 실제 운영 경로로 검증할 수 있다.**
- **일부러 남겨둔 예외 케이스들** — 전부 깨끗하면 예외 경로를 검증할 수 없어서 그대로 뒀다:
  - `Go Down Moses`(8/29 발행분): **커버 이미지가 아예 없다** → 위젯 fallback(P3-S2-T6/P3-S3-T6) 테스트용
  - 9/21: **하루 비어있다** → "오늘 픽 없음"(뷰가 0행 반환) 테스트용
- ⚠️ **이 콘텐츠의 `검수 완료` 표시는 사람 검수를 거친 게 아니라 내가 dev 픽스처용으로 세운 것이다.** 앱에 실제 노출될 문구 품질은 아직 보증되지 않는다(P1-S5-T6은 여전히 사람 몫).

### 3. 어드민 폼 자동화 시 함정 (브라우저 도구 쓸 때)

곡 등록하다 12곡이 통째로 누락된 걸 뒤늦게 발견했다. 프론트도 어드민을 브라우저로 조작할 일이 있으면 같은 함정에 빠질 수 있어 남긴다.

- **`browser_batch` 안에서 제출 버튼을 클릭하면 폼이 제출되지 않는다** — 서버 로그에 POST가 아예 안 남는다. 값 채우기까지만 배치로 하고 **클릭은 단독 호출로 분리**해야 한다.
- `ref` 기반 클릭이 실제 버튼 위치와 어긋날 수 있다(read_page의 뷰포트 568×718 vs 스크린샷 프레임 800×1011). **스크린샷으로 좌표를 확인해 클릭하는 편이 안전하다.**

**관련**: [backend-log 2026-09-08](./backend-log.md#2026-09-08--p1-s5-t6-지원--2주치-콘텐츠-확보-dev-파이프라인-성공률-실측), [human-actions P3-S2-T1](../human-actions.md)
**상태**: [x] 처리완료 — 프론트 세션, 2026-09-08. 확정 식별자 3개를 Config Plugin 설정에 그대로 박고 `expo prebuild`로 **실제 생성물까지 확인**했다(앱·위젯 양쪽 entitlements에 `group.com.ongod.app`, 번들 ID `com.ongod.app.widget`). dev 콘텐츠도 잘 쓰고 있다 — 오늘(9/8) 픽이 뷰로 정상 조회되고 앱에도 뜬다. 어드민 폼 함정(3번)은 이번에 브라우저 조작을 안 해서 겪지 않았지만 기록해뒀다.

## 2026-09-08 · frontend → backend

**변경**: 위젯 구현 방식이 iOS만 바뀌었다 — [ADR-0009](../decisions/0009-widget-expo-widgets-ios-glance-android.md). **백엔드 산출물(뷰·이미지 규격·계약)은 그대로 쓰며 바뀐 것이 없다.** 백엔드가 조치할 것은 아래 1번 하나뿐이다.

### 1. 조치 필요 — `packages/db` DB 타입에 뷰가 빠져 있었다

`20260908090000_widget_today_pick_view.sql`은 dev·prod에 적용됐는데 `packages/db/src/types/database.ts`의 `Views`가 `[_ in never]: never` 그대로였다. 그래서 `supabase.from("widget_today_pick")`이 타입 에러가 났다.

**내가 손으로 추가해뒀다**(이 파일은 Docker 부재로 CLI 자동생성 대신 손으로 유지하는 중이라 같은 방식으로). 확인만 해주고, **앞으로 뷰·테이블을 추가할 때 이 파일도 같이 갱신해달라** — 마이그레이션만 넣으면 프론트에서 타입 에러로 막힌다.

### 2. 참고 — 위젯 iOS 구현이 SwiftUI 직접 작성이 아니게 됐다

SDK 57에 **Expo 공식 모듈 `expo-widgets`**가 있는 걸 발견해서, iOS 위젯은 TSX + `@expo/ui/swift-ui`로 쓰고 데이터도 `updateSnapshot`으로 넘긴다(App Group 배관을 모듈이 관리). **Android는 ADR-0004 그대로** Glance 직접 작성이다 — expo-widgets의 Android Glance 렌더가 아직 `Text(widgetName)`만 그리는 스텁이라서다.

백엔드 쪽 계약에는 영향이 없다. `widget_today_pick` 뷰와 512×512 `widget.webp`를 그대로 쓴다.

### 3. 아직 결정 안 한 것 — 자정 갱신 공백 (백엔드 handoff 4번)

**(a) 그대로 두기를 기본으로 유지한다.** prefetch가 정말 필요한지는 P3-S4-T1/T2를 붙이고 실제 체감을 본 뒤 판단하는 게 맞다고 봤다. 필요해지면 뷰·RLS를 여는 요청을 새 handoff로 남기겠다. **지금은 백엔드가 할 일이 없다.**

### 4. 알아둘 것 — 관리형 워크플로를 유지한다

Phase 3에 네이티브가 들어가지만 `ios/`·`android/`를 커밋하지 않는다. `expo prebuild`는 검증용으로만 돌리고 지웠다(둘 다 `.gitignore`에 있음). EAS Build가 빌드 시점에 prebuild한다 — **생성물을 커밋하면 Config Plugin 변경이 반영되지 않는 함정이 생긴다.**

**관련**: [ADR-0009](../decisions/0009-widget-expo-widgets-ios-glance-android.md), [frontend-log 2026-09-08](./frontend-log.md#2026-09-08--p3-s1-t2--위젯-데이터-전달--adr-0009-expo-widgets-채택)
**상태**: [ ] 미해결 (1번만 확인, 2~4는 참고)
