# ADR-0006 — pnpm 링커: isolated + `shamefully-hoist` (React 18/19 공존)

- 상태: 채택(Accepted)
- 일자: 2026-09-07
- 대체 대상: [ADR-0005 — pnpm `node-linker=hoisted`](./0005-pnpm-hoisted-linker.md) (superseded by this ADR)
- 관련: [handoff 2026-09-01 frontend → backend](../logs/handoff.md), [backend-log 2026-09-07](../logs/backend-log.md)

## 배경

ADR-0005로 `node-linker=hoisted`를 켠 뒤 `apps/admin`(Next.js 15 / React 19)이 깨졌다.
프론트 세션이 타입체크 실패를 발견해 handoff로 넘겼고, 이번 세션에서 원인을 추적한 결과
**증상이 하나가 아니라 두 개**였다.

### 증상 1 — 타입체크 실패 (프론트 세션이 발견한 것)

```
app/layout.tsx(11,13): error TS2322: Type '.../apps/admin/node_modules/@types/react/index").ReactNode'
  is not assignable to type 'React.ReactNode'.
```

`tsc --explainFiles`로 확인한 실제 경로:

```
../../node_modules/@types/react/index.d.ts        ← 18.3.31 (mobile용, 루트에 호이스팅)
  Imported via 'react' from '../../node_modules/next/dist/styled-jsx/types/global.d.ts'
  Imported via 'react' from '../../node_modules/next/dist/types.d.ts'
node_modules/@types/react/index.d.ts              ← 19.1.17 (apps/admin/node_modules/, admin 코드용)
  Imported via "react" from 'app/layout.tsx'
```

`@types/react` 18과 19가 **둘 다 `declare global { namespace JSX }`를 선언**해서 한 컴파일 안에서
병합된다. `<body>{children}</body>`의 children은 18의 `ReactNode`로 검사되는데 실제 값은 19의
`ReactNode`라 서로 다른 타입이 되고, 두 버전 사이에 `ReactPortal`/`bigint` 정의가 달라져 에러가 난다.

### 증상 2 — `next build` 실패 (이번 세션에서 새로 발견)

```
[TypeError: Cannot read properties of null (reading 'useRef')]
Error occurred prerendering page "/404".
```

런타임 쪽에도 같은 뿌리의 문제가 있었다. hoisted 레이아웃에서 루트 `node_modules/react`는
mobile의 18.3.1이 차지하고, next와 admin은 **각자 다른 물리적 사본**의 React 19를 잡았다:

```
node_modules/next/node_modules/react  → 19.2.8   (next가 쓰는 인스턴스)
apps/admin/node_modules/react         → 19.2.8   (admin 코드가 쓰는 인스턴스)
```

React 인스턴스가 둘이면 훅 디스패처가 공유되지 않아 `useRef`가 null에서 읽히며 죽는다.
**타입만 고쳐서는 빌드가 여전히 깨진 상태였다** — handoff에 적힌 "타입체크 실패"보다 범위가 넓었다.

### 근본 원인

hoisted(flat) 레이아웃에서 루트 `node_modules/<pkg>`는 **버전 하나만** 가질 수 있다. 그런데
`next`(admin 전용)도 루트로 호이스팅되므로, next가 `react`/`@types/react`를 찾을 때 자기 위쪽,
즉 mobile이 차지한 루트를 잡는다. React 메이저가 두 개(18: Expo 52 / RN 0.76, 19: Next 15 App
Router) 공존하는 이 저장소에서는 **flat 레이아웃이 구조적으로 양쪽을 동시에 만족시킬 수 없다.**
실제로 루트를 19로 뒤집어보니 admin은 통과하고 mobile이 같은 방식으로 깨졌다(대칭).

## 결정

`.npmrc`를 `node-linker=hoisted` → **기본(isolated) 링커 + `shamefully-hoist=true`** 로 바꾼다.
그리고 두 가지를 함께 고정한다.

| 파일 | 설정 | 목적 |
|------|------|------|
| `.npmrc` | `shamefully-hoist=true` (node-linker는 기본 isolated) | 패키지별 올바른 의존성 해석 + Expo 딥 require 대응 |
| `pnpm-workspace.yaml` | `packageExtensions.next.dependencies["@types/react"]` = 19.1.17 | next의 `.d.ts`가 항상 React 19 타입만 보게 |
| `package.json` (루트) | `devDependencies["@types/react"]` = 18.3.31 | 루트로 호이스팅되는 `@types/react`를 mobile용 18로 고정 |

### 왜 이 조합인가

- **isolated 링커**: pnpm이 각 패키지를 `node_modules/.pnpm/<name>@<ver>_<peer해시>/`에 두고 peer
  조합별로 분리해준다. 그 결과 `next`와 `apps/admin`이 **같은 하나의** `react@19.2.8` 인스턴스를
  공유하고(`.pnpm/react@19.2.8/`), mobile은 `.pnpm/react@18.3.1/`을 본다. 증상 2가 사라지는 지점.
- **`shamefully-hoist=true`**: ADR-0005의 원래 동기(Expo/Metro가 `metro/src/lib/TerminalReporter`,
  `@babel/runtime/helpers/interopRequireDefault` 같은 깊은 경로를 `apps/mobile` 기준으로 직접
  `require()`)를 루트 호이스팅으로 그대로 해결한다. ADR-0005가 hoisted 링커로 얻으려던 효과가
  사실은 이것 하나였고, `node-linker`까지 바꿀 필요는 없었다.
- **`packageExtensions`로 next에 `@types/react` 주입**: 타입 참조는 런타임 의존성 그래프를 타지
  않는다. next는 `@types/react`를 dependencies로도 peerDependencies로도 선언하지 않아서, next의
  `.d.ts`가 하는 `import ... from "react"`는 결국 호이스팅된 아무 `@types/react`나 잡는다. 여기에
  직접 의존성을 주입하면 `.pnpm/next@.../node_modules/@types/react`가 생겨 next가 자기 옆의 19를
  먼저 잡는다. 증상 1이 사라지는 지점.
- **루트 `@types/react` 18 고정**: `shamefully-hoist`가 루트로 올리는 `@types/react`는 여전히 한
  버전뿐이고, `react-native`·`@expo/vector-icons`의 `.d.ts`가 이걸 잡는다. 고정하지 않으면 pnpm이
  19를 올려서 mobile이 `TS2786: 'Ionicons' cannot be used as a JSX component`로 깨진다(실제로 겪음).
  루트 워크스페이스의 직접 의존성은 항상 루트 `node_modules`를 차지하므로, 이게 버전을 못 박는 방법.

### 검토했지만 채택하지 않은 것

| 대안 | 기각 이유 |
|------|-----------|
| `apps/admin/tsconfig.json`의 `paths`로 `react`를 admin 로컬 사본에 매핑 | 타입체크는 통과하지만 **Next.js가 tsconfig `paths`를 webpack alias로 그대로 옮긴다** — `react`가 `@types/react` 디렉터리로 alias되어 `next build`가 prerender 단계에서 죽는다. 실제로 시도해서 확인함. |
| `typeRoots` 제한 | 프론트 세션이 이미 시도해 실패. `paths`와 달리 `/// <reference types>` 지시자만 바꿔서, 오히려 에러가 늘어난다(9개). 단독으로는 무의미. |
| admin을 React 18로 다운그레이드 | Next 15 App Router의 `<form action={serverAction}>`·`useActionState`가 React 19 전용. 검수/등록 폼 전체를 다시 써야 함. |
| mobile을 React 19로 업그레이드 | Expo SDK 53+ 동반 업그레이드. 범위가 크고 프론트 트랙 전체를 멈춤. **다만 이게 진짜 근본 해결이다** — 아래 "남은 부채" 참고. |
| hoisted 유지 + `packageExtensions`만 | 타입은 고쳐지지만 증상 2(React 인스턴스 2개)가 남아 `next build`가 계속 깨진다. |

## 영향

- `pnpm install` 후 `node_modules` 레이아웃이 다시 바뀐다. 링커 전환 시에는 **기존
  `node_modules`를 먼저 지우고 설치할 것** — hoisted → isolated 전환을 그냥 `pnpm install`로
  하면 pnpm이 기존 flat 트리를 정리하다 사실상 멈춘다(27분 무진전 후 강제 종료, 이후
  `rm -rf node_modules apps/*/node_modules packages/*/node_modules` 후 재설치하니 8초에 끝남).
  CI는 매번 새 체크아웃이라 해당 없음.
- phantom dependency 방지 이점은 `shamefully-hoist` 때문에 ADR-0005와 마찬가지로 포기한 상태다
  (루트에 전부 올라오므로 선언 안 한 패키지도 import 가능). 이 부분은 나아지지 않았다.
- `@types/react` 버전을 올릴 때는 **세 곳을 같이** 봐야 한다: `apps/admin/package.json`,
  `pnpm-workspace.yaml`의 `packageExtensions`, 루트 `package.json`(mobile용 18 라인).

## 남은 부채

이 ADR은 React 메이저 두 개가 공존한다는 사실 자체를 없애지 못하고 **격리해서 공존시킨다.**
Expo SDK를 53+로 올려 저장소 전체를 React 19로 통일하면 `packageExtensions`와 루트
`@types/react` 고정 두 줄은 그때 걷어내면 된다. 지금 하지 않는 이유는 순전히 범위(프론트 트랙
전체 재검증)이며, 기술적으로 막힌 것은 없다.
