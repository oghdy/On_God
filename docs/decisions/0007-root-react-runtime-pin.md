# ADR-0007 — 루트 `react`/`react-dom` 런타임 사본도 18로 고정 (ADR-0006 보정)

- 상태: 채택(Accepted)
- 일자: 2026-09-07
- 보정 대상: [ADR-0006 — pnpm 링커: isolated + `shamefully-hoist`](./0006-pnpm-isolated-public-hoist.md) (대체가 아니라 **누락분 보강**)
- 관련: [handoff 2026-09-07 backend → frontend](../logs/handoff.md), [frontend-log 2026-09-07](../logs/frontend-log.md)

## 배경

ADR-0006이 링커를 `node-linker=hoisted` → isolated + `shamefully-hoist=true`로 바꾼 뒤,
프론트 세션이 지시받은 대로 `node_modules`를 지우고 재설치한 다음 `expo start`를 돌렸더니
**앱이 화면을 아예 못 그리고 에러 오버레이만 떴다.**

```
(NOBRIDGE) ERROR  Warning: Error: Objects are not valid as a React child
  (found: object with keys {$$typeof, type, key, props, _owner, _store}).
    in ErrorOverlay (created by withDevTools(ErrorOverlay))
```

"React 엘리먼트가 React 엘리먼트로 인식되지 않는다"는 것은 **한 번들 안에 React 인스턴스가
두 개**일 때 나오는 전형적인 증상이다. ADR-0006이 admin에서 고쳤던 증상 2(`Cannot read
properties of null (reading 'useRef')`)와 뿌리가 같고, 이번엔 그게 mobile 쪽에서 터진 것이다.

### 왜 번들·타입체크로는 안 잡혔나

backend 세션은 `pnpm turbo run typecheck lint test build` 20/20 통과와
`npx expo export --platform ios` 번들 생성 성공까지 확인하고 넘겼는데, 둘 다 이 문제를
못 잡는다. **React 사본이 두 개여도 번들링은 정상적으로 성공한다** — 그냥 모듈이 두 개
들어갈 뿐이고, 깨지는 건 런타임에 렌더러가 남의 엘리먼트를 만나는 순간이다. 타입체크는
루트 `@types/react`가 18로 고정돼 있어(ADR-0006) 통과한다.

즉 **이 클래스의 회귀는 앱을 실제로 띄워봐야만 드러난다.**

### 근본 원인

ADR-0006은 루트로 호이스팅되는 `@types/react`만 18로 고정했고, **런타임 `react`는
고정하지 않았다.** 그래서 재설치 후 루트가 이렇게 됐다:

```
node_modules/react              → .pnpm/react@19.2.8/         ← admin(next)용 19가 차지
apps/mobile/node_modules/react  → .pnpm/react@18.3.1/         ← mobile용 18
```

`shamefully-hoist`는 모든 패키지를 루트에 올리지만, 같은 이름은 **한 버전만** 올릴 수 있다.
pnpm이 그 자리에 19를 올렸다.

문제는 react를 peerDependency로 선언하지 않은 패키지들이다. 이들은 `.pnpm/<pkg>/node_modules/`
안에 자기 몫의 react 심볼릭 링크가 없어서, 위로 걸어 올라가 **루트의 19**를 잡는다.
실제 번들(`entry.bundle`)을 받아 확인한 결과 아래가 전부 React 19.2.8을 물고 있었다:

| 패키지 | 무엇이 깨지는가 |
|--------|-----------------|
| `expo-router` (거의 전 모듈) | 네비게이션·레이아웃 전체 |
| `expo-modules-core` | 네이티브 모듈 어댑터 |
| `@expo/metro-runtime` | 에러 오버레이 자신 — 그래서 에러를 못 보여주고 자기가 또 죽었다 |
| `@expo/vector-icons` | 아이콘 |
| `expo-apple-authentication` | Apple 로그인 버튼 |

반면 `react-native` 본체와 앱 코드는 18.3.1을 쓴다. 화면을 그리는 렌더러(18)와 엘리먼트를
만드는 쪽(19)이 갈라져 있으니 아무것도 못 그린다.

**ADR-0005의 hoisted 레이아웃에서는 이 문제가 없었다** — 루트에 React가 18 하나뿐이라
전부 18을 잡았기 때문이다. 그래서 이건 링커 전환이 새로 만든 회귀다.

## 결정

ADR-0006의 "루트에 호이스팅될 버전을 mobile용으로 못 박는다"는 방법을 **런타임 사본에도
똑같이 적용한다.** 루트 `package.json`의 `devDependencies`에 두 줄을 추가한다.

```json
"@types/react": "18.3.31",
"react": "18.3.1",
"react-dom": "18.3.1",
```

루트 워크스페이스의 직접 의존성은 항상 루트 `node_modules`를 차지하므로, 이게 버전을 못
박는 방법이다(ADR-0006이 `@types/react`에 쓴 것과 동일한 장치).

`react-dom`까지 넣는 이유: `react` 하나만 고정하면 루트 `react-dom`이 19로 남아
`react-dom@19 ↔ react@18` peer 불일치 경고가 매 설치마다 뜬다. 지금은 mobile 번들에
`react-dom`이 아예 안 들어가서 실질 피해가 없지만, 루트를 "mobile의 React 18 세계"로
일관되게 유지해두는 편이 나중에 `react-dom`을 건드리는 의존성이 들어왔을 때 같은 사고를
막는다.

admin은 영향받지 않는다. admin과 next는 각자 선언한 의존성을 통해
`.pnpm/react@19.2.8/`·`.pnpm/react-dom@19.2.8_react@19.2.8/`를 **공유해서** 잡으므로
(isolated 링커의 효과, ADR-0006 참고) 루트에 뭐가 올라오든 무관하다.

## 검증

- 번들 실측: 수정 전 `entry.bundle`에 `react@19.2.8` 모듈 4개(`index.js`,
  `react.development.js`, `jsx-dev-runtime.js`, `react-jsx-dev-runtime.development.js`)가
  React 18과 함께 들어있었다. 수정 후 **`react@18.3.1` 하나만 남았고 `react-dom`은 0개**다.
- iOS 시뮬레이터(Expo Go, iPhone 16 Pro): 에러 오버레이 사라짐. 오늘의 카드 · 최근 픽
  스와이프 · 가사(원문/해석 탭 전환) · 로그인 모달(Apple 네이티브 버튼 + Google) 전부 정상.
- `[perf] today-screen-first-content: 372ms` — P2-S7-T1이 기록한 297~384ms 범위로 복귀
  (SRS 4.2 목표 2000ms).
- `pnpm turbo run typecheck lint test build --force --concurrency=1` **20/20 통과**
  (admin `next build` 포함).

## 영향

**`react` 계열 버전을 올릴 때 봐야 할 곳이 세 곳에서 다섯 곳이 됐다.**

| 파일 | 항목 | 버전 | 누구를 위한 것 |
|------|------|------|----------------|
| `apps/admin/package.json` | `react`, `react-dom`, `@types/react`, `@types/react-dom` | 19 | admin |
| `pnpm-workspace.yaml` | `packageExtensions.next.dependencies` | 19 | next의 `.d.ts` |
| `package.json` (루트) | `@types/react` | 18 | mobile 타입 |
| `package.json` (루트) | `react` | 18 | **mobile 런타임** ← 이번에 추가 |
| `package.json` (루트) | `react-dom` | 18 | 루트 일관성 ← 이번에 추가 |

한 곳만 올리면 타입 에러(증상 1) 또는 런타임 이중 React(증상 2/이번 건)가 재발한다.

## 남은 부채

ADR-0006과 동일하다 — Expo SDK 53+로 올려 저장소 전체를 React 19로 통일하면 위 다섯 줄을
한꺼번에 걷어낼 수 있다. 이 ADR은 그 부채를 **두 줄 늘렸고**, 그만큼 업그레이드의 가치도
커졌다.

## 프로세스 교훈

`node_modules` 레이아웃을 바꾸는 변경은 **타입체크·번들 생성 성공을 통과 기준으로 삼으면
안 된다.** 이중 React는 둘 다 통과시키고 런타임에만 터진다. 최소한 다음 둘 중 하나를 해야
한다.

1. 앱을 실제로 띄워서 첫 화면 렌더까지 확인한다(시뮬레이터면 충분 — 이번에 그렇게 잡았다).
2. 레이아웃 불변식을 기계적으로 검사한다. 루트에 호이스팅된 React와 mobile이 보는 React가
   같은 버전이어야 한다는 게 이 ADR이 세운 불변식이고, 그건 한 줄로 검사된다:

```bash
[ "$(node -p "require('./node_modules/react/package.json').version")" \
  = "$(node -p "require('./apps/mobile/node_modules/react/package.json').version")" ] \
  || { echo "루트/mobile React 사본 불일치 — 이중 React 위험"; exit 1; }
```

> **번들 산출물을 grep하는 방법은 쓰지 말 것.** 처음에 그걸 이 자리에 적었다가 실제로
> 돌려보고 폐기했다. `expo export`는 기본적으로 Hermes 바이트코드(`.hbc`)를 뱉어서 grep이
> 아예 안 되고, `--no-bytecode`로 JS를 뽑아도 프로덕션 번들은 minify되면서 모듈 경로
> 주석이 사라져 **이중 React가 있어도 조용히 통과한다**(가장 나쁜 형태의 검사). 경로가
>남아있는 건 Metro dev 서버가 주는 `?dev=true&minify=false` 번들뿐이고, 이번 진단도 그걸
> 직접 받아서 했다 — 정확하지만 CI에 넣기엔 서버를 띄워야 해서 무겁다.
