# ADR-0008 — Expo SDK 57 / React 19 통일, React 고정 장치를 `overrides` 한 곳으로

- 상태: 채택(Accepted)
- 일자: 2026-09-08
- 대체 대상: [ADR-0006](./0006-pnpm-isolated-public-hoist.md), [ADR-0007](./0007-root-react-runtime-pin.md) — 두 ADR이 도입한 장치를 **전부 제거**한다(문제 자체가 사라졌으므로).
- 관련: [P0-S7](../phase-0-foundation.md#s7-런타임-업그레이드-expo-sdk-57--react-19-통일), [frontend-log 2026-09-08](../logs/frontend-log.md)

## 배경

ADR-0005 → 0006 → 0007로 이어진 세 개의 ADR은 전부 같은 뿌리를 다뤘다: **이 저장소에 React
메이저가 두 개(18: Expo 52/RN 0.76, 19: Next 15) 공존한다**는 사실. 매번 "어느 React가 어디로
호이스팅되는가"를 손으로 못 박는 방식으로 막았고, 그 결과 `react` 버전을 올릴 때 **다섯 곳을
동시에 봐야 하는** 상태가 됐다. 한 곳만 빠뜨리면 앱이 화면을 아예 못 그리는 사고가 났고,
실제로 ADR-0007이 그 사고를 수습한 기록이다.

ADR-0006·0007 모두 "진짜 해결은 Expo SDK를 올려 저장소 전체를 React 19로 통일하는 것"이라고
적어두었다. 이 ADR이 그 부채를 청산한다.

## 조사 결과 — 왜 지금이 적기인가

SDK 52는 최신(57)보다 **5개 메이저** 뒤처져 있었다. 그런데 조사해보니 업그레이드에 유리한
조건이 거의 다 갖춰져 있었다.

| 확인한 것 | 결과 |
|-----------|------|
| 신 아키텍처 | **이미 켜져 있음** (`newArchEnabled: true`, 런타임 `Bridgeless mode is enabled`). RN 0.82의 구 아키텍처 제거가 해당 없음 |
| 네이티브 폴더 | **없음** (`apps/mobile/ios`·`android` 부재, 관리형 워크플로) → 조정할 네이티브 코드 0줄 |
| 공유 패키지의 React 의존 | **0개** (`core`/`db`/`ui-tokens`/`config`/`integrations` 전부) → React 18→19가 백엔드 트랙에 파급되지 않음 |
| 앱 규모·API 표면 | 34개 파일. expo-router 사용 API가 `useRouter`/`router.push`/`back`/`useLocalSearchParams`/`Stack.Screen`/`presentation`뿐 — 전부 4~57 내내 유지된 것 |
| SDK 57 의존성 조합 | 스크래치에 실제로 설치해 **충돌 0** 확인 |

여기에 두 가지 시한성 요인이 있었다.

1. **Phase 3(위젯)이 `expo prebuild`를 요구한다**(ADR-0004). Phase 3 이후로 미루면 생성된
   네이티브 프로젝트와 위젯 SwiftUI/Kotlin 코드를 RN 5개 메이저 변화에 맞춰 재조정해야 한다.
2. **Expo Go 클라이언트가 SDK별로 분리돼 있다**(54.0.7 / 55.0.34 / 56.0.4 / 57.0.9처럼 SDK
   번호와 정렬). App Store에는 최신 하나만 올라오므로 **SDK 52로는 실기기 Expo Go 테스트가
   불가능**했다 — 🧑 사람 몫 항목의 선행 조건이 막혀 있었던 것.

## 결정

### 1. `apps/mobile`을 Expo SDK 57로 올린다 (52 → 57 직행)

Expo 공식 권장은 한 SDK씩이지만, 위 조건을 근거로 직행했다. 이 규모 앱에서 다섯 번의
재설치·검증 사이클은 이득보다 비용이 크다. 브랜치에서 진행하고 실패 시 SDK 54 경유로 후퇴할
계획이었으나, 후퇴 없이 완료됐다.

| | 이전 | 이후 |
|---|---|---|
| Expo SDK | 52.0.0 | **57.0.20** |
| React Native | 0.76.9 | **0.86.3** |
| React | 18.3.1 | **19.2.3** |
| expo-router | 4.0.22 | **57.0.19** |

expo-router 57이 요구하는 `react-native-reanimated`(4.5.1) · `react-native-worklets`(0.10.1) ·
`react-native-gesture-handler`(~2.32.0) · `react-dom`(19.2.3)을 새로 추가했다. `react-dom`은
expo-router가 내부적으로 쓰는 `@radix-ui/*`의 peer 요구이며 SDK 57 템플릿에도 포함돼 있다.
`@expo/metro-runtime`은 peer라 락파일에 SDK 52 시절 버전(4.0.1)이 굳어 있어 명시적으로 올렸다.

### 2. React 고정을 `pnpm-workspace.yaml`의 `overrides` 한 곳으로 모은다

**메이저가 하나로 통일됐다고 해서 사고 가능성이 사라지지는 않는다.** mobile은 Expo가 정한
정확한 버전(`19.2.3`)을 쓰고 admin은 `^19.0.0`을 쓰므로, 그대로 두면 pnpm이 19.2.3과 19.2.8
**두 사본**을 만든다. 메이저가 같아도 인스턴스가 둘이면 ADR-0007과 똑같이 깨진다. 실제로
업그레이드 직후 두 사본이 공존하는 상태를 관측했다.

그래서 버전을 한 곳에서 강제한다.

```yaml
# pnpm-workspace.yaml
overrides:
  react: 19.2.3
  react-dom: 19.2.3
  "@types/react": 19.2.18
  "@types/react-dom": 19.2.7
```

**제거한 것** (ADR-0006·0007이 도입했던 것 전부):

| 파일 | 제거한 내용 | 이유 |
|------|-------------|------|
| 루트 `package.json` | `react`·`react-dom`·`@types/react` 18 고정 | 루트에 뭐가 호이스팅되든 무관해짐 |
| `pnpm-workspace.yaml` | `packageExtensions.next` (@types/react 19 주입) | 저장소에 `@types/react`가 하나뿐이라 next가 잘못 잡을 대상이 없음 |

`.npmrc`의 `shamefully-hoist=true`는 **유지한다** — Expo/Metro의 깊은 require 대응이라는
원래 목적(ADR-0005)은 여전히 유효하다.

**관리 지점이 다섯 곳 → 한 곳이 됐다.** React 버전을 올릴 땐 `overrides`만 고치면 되고,
회귀는 `scripts/check-single-react.mjs`가 CI에서 잡는다(ADR-0007에서 만든 검사, 그대로 유효).

## 마이그레이션에서 실제로 깨진 것 두 가지

5개 메이저를 건너뛰었는데 코드 수정은 두 곳뿐이었다.

### ① `StyleSheet.absoluteFillObject` 제거 (RN 0.86)

타입체크가 잡아줬다. `DailyCard.tsx` 3곳을 `StyleSheet.absoluteFill`로 교체.

### ② expo-router 57: `<Stack>`의 자식 선언이 라우트 목록이 된다 ← **타입체크·빌드가 못 잡음**

기존 코드는 모달 옵션만 주려고 자식을 하나만 뒀다.

```jsx
<Stack screenOptions={...}>
  <Stack.Screen name="profile" options={{ presentation: "modal" }} />
</Stack>
```

expo-router 57에서는 이렇게 쓰면 **선언한 것이 라우트 목록**이 되어 `profile`이 첫 화면이 됐다.
**Android에서 `index.tsx`가 한 번도 렌더되지 않았고**, 앱을 열면 곧장 로그인 화면이 떴다.
iOS에서는 증상이 나타나지 않아 iOS만 봤다면 놓쳤을 회귀다.

진단은 로그로 확정했다 — `app/index.tsx`가 남기는 `[perf] today-screen-first-content` 줄이
SDK 52 Android와 SDK 57 iOS에는 있는데 **SDK 57 Android에만 없었다.** Expo Go 데이터를 완전히
지우고 재실행해도 동일해 네비게이션 상태 복원이 아님을 확인했고, 자식 선언을 빼자 바로
렌더되는 것으로 원인을 격리했다.

수정: 라우트를 전부 명시하고 `index`를 맨 앞에 둔다. 딥링크로 하위 라우트에 바로 진입해도
뒤로가기 스택이 index부터 쌓이도록 `unstable_settings.initialRouteName`도 함께 선언한다.

```jsx
export const unstable_settings = { initialRouteName: "index" };
...
<Stack screenOptions={...}>
  <Stack.Screen name="index" />
  <Stack.Screen name="lyrics/[songId]" />
  <Stack.Screen name="profile" options={{ presentation: "modal" }} />
</Stack>
```

## 검증

- **React 사본**: 저장소 전체에 `react@19.2.3` **하나만** 존재(`.pnpm` 실측). `check-single-react.mjs` 통과.
- `pnpm turbo run typecheck lint test build --force --concurrency=1` **20/20**(admin `next build` 포함).
- **iOS**(Expo Go 57.0.9, iPhone 16 Pro): 오늘 카드 · 스와이프 · 가사(원문/해석) · 로그인 모달 정상. 첫 렌더 531~884ms.
- **Android**(Expo Go 57.0.9, Pixel 2 / API 35): 위와 동일 + `/profile` 딥링크 모달 정상. 첫 렌더 921~936ms.
- 두 플랫폼 모두 콘솔 에러 0건(남은 것은 DSN 미설정 시 나오는 기존 Sentry 경고뿐).

## 남은 것

- **TypeScript**: `expo install --check`가 `~6.0.3`을 권장하지만 5.9.3을 유지했다. TS는 admin·
  packages가 함께 쓰는 저장소 전체 의존성이라 SDK 업그레이드에 끼워 넣으면 범위가 흐려진다.
  별건으로 다룬다(타입체크는 5.9.3에서 20/20 통과).
- **`react-native-web`**: SDK 57 템플릿에는 있지만 넣지 않았다. 웹을 타깃하지 않으므로 필요할 때 추가한다.
- **부채 청산 완료**: ADR-0005/0006/0007이 남긴 "React 두 메이저 공존" 부채는 이 ADR로 해소됐다.
  남은 장치는 `overrides` 네 줄과 `shamefully-hoist` 한 줄뿐이다.

## 교훈

**플랫폼 하나만 검증하면 안 된다.** 이번 회귀(②)는 타입체크·lint·테스트·`next build`를 전부
통과하고 iOS에서도 정상 동작했으며 **Android에서만** 나타났다. ADR-0007이 "타입체크와 번들
생성 성공을 통과 기준으로 삼지 말 것"이라고 적었는데, 여기에 "한 플랫폼만 보지 말 것"이
추가된다. 앱이 남기는 관측 로그(`[perf]`, `[analytics]`)가 화면 스크린샷보다 빠르고 정확한
판정 근거였다는 점도 기록해둔다.
