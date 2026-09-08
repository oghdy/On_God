# ADR-0009 — 위젯: iOS는 `expo-widgets`, Android는 Glance 직접 작성

- 상태: 채택(Accepted)
- 일자: 2026-09-08
- 보정 대상: [ADR-0004 — 위젯: 네이티브 직접 작성](./0004-widget-native.md) — **iOS에 한해 대체**한다. Android는 ADR-0004 그대로다.
- 관련: [P3-S1-T2](../phase-3-widget.md#s1-위젯-데이터-공급), [handoff 2026-09-08 backend → frontend](../logs/handoff.md)

## 배경

ADR-0004(2026-06-28)는 위젯을 **양 플랫폼 모두 네이티브로 직접 작성**하기로 했다. 근거는
"RN 생태계의 위젯 서드파티는 유지보수 불안정 사례가 많아 장기 운영 앱엔 부채"였다.

P3-S1-T2를 시작하면서(= 앱이 위젯에 데이터를 넘기는 부분) 공유 스토리지 접근 수단을 조사하다
**`expo-widgets`가 Expo SDK 57의 공식 모듈로 존재한다**는 것을 발견했다(`bundledNativeModules`에
포함, SDK 55부터 배포, 문서는 `docs.expo.dev/versions/latest/sdk/widgets/`).

**서드파티 라이브러리와 Expo 공식 모듈은 다른 것이다.** ADR-0004가 기각한 대상은 전자였고,
후자는 그 당시 존재하지 않았다. 전제가 바뀌었으므로 다시 판단했다.

## 조사 결과

패키지를 실제로 받아 내용물을 확인했다(추측이 아니라 소스 기준).

### iOS — 완성돼 있다

| 확인한 것 | 결과 |
|-----------|------|
| 네이티브 구현 | Swift 464줄. `WidgetsModule`·`WidgetObject`·`WidgetsStorage`·`LiveActivity` 전부 실구현 |
| 데이터 전달 | `updateSnapshot(props)` / `updateTimeline(entries)` — **JS에서 위젯에 직접 밀어넣는다** |
| 공유 저장소 | `WidgetsStorage.swift`가 **App Group UserDefaults**를 감싼다 — ADR-0004가 예상한 그 메커니즘을 대신 관리해준다 |
| 이미지 공유 | `widgetsDirectory` (App Group 공유 디렉터리) |
| UI 작성 | TSX. 레이아웃 함수의 소스를 추출해 위젯 익스텐션 안의 별도 JS 컨텍스트에서 실행하고, `@expo/ui/swift-ui` 컴포넌트를 전역으로 주입한다 |
| 디자인 자유도 | `ZStack`·`Image`·`Text`·`VStack`·`Overlay`·`Mask` + `frame`/`padding`/`font`/`aspectRatio` 등 modifier 다수. **앨범아트 몰입형(풀블리드 이미지 + 텍스트 오버레이)에 충분** |
| 딥링크 | `widgetURL` modifier — P3-S2-T5가 이걸로 해결된다 |
| 2×2 | `systemSmall` 지원 |

### Android — 스텁이다

| 확인한 것 | 결과 |
|-----------|------|
| `WidgetsModule.kt` | **10줄. `Name("ExpoWidgets")`만 있고 아무것도 안 한다** |
| `ExpoWidgetsGlanceWidget.kt` | `provideContent { Text(widgetName) }` — 위젯 이름만 그린다. TSX 레이아웃을 렌더하지 않는다 |
| 플러그인 | CHANGELOG: *"Temporarily make the Android config plugin opt-in with `enableAndroid`"*, *"[android] Add stub methods"* |

즉 **Android 홈 화면 위젯은 지금 expo-widgets로 만들 수 없다.** 개발이 진행 중인 것은
분명하지만(최근 커밋들이 Android 관련), MVP 일정에 걸 수 있는 상태가 아니다.

## 결정

**iOS는 `expo-widgets`, Android는 ADR-0004대로 Glance 직접 작성한다.**

| | iOS | Android |
|---|---|---|
| UI | TSX + `@expo/ui/swift-ui` (`widgets/OnGodToday.tsx`) | Kotlin Glance 직접 작성 (P3-S3) |
| 데이터 전달 | `updateSnapshot` (expo-widgets가 App Group 관리) | SharedPreferences/DataStore 직접 |
| 이미지 | `widgetsDirectory`에 앱이 미리 다운로드 | 별도 설계 (P3-S3-T2) |

### 왜 이 조합인가

- **MVP가 양 플랫폼 2×2 위젯이다**(OVERVIEW 마일스톤). expo-widgets 전면 채택은 Android를
  포기해야 하므로 출시 정의를 바꿔야 한다 — 그건 이 ADR이 정할 문제가 아니다.
- **iOS를 직접 작성으로 남길 이유가 없어졌다.** SwiftUI + WidgetKit `TimelineProvider` +
  App Group 배관 + 그걸 JS에서 쓰기 위한 네이티브 모듈까지 우리가 써야 했던 것이, 공식
  모듈을 쓰면 TSX 한 파일로 줄어든다. ADR-0004가 우려한 "디자인 자유도"도 조사 결과
  제약이 아니었다.
- **어차피 UI는 두 벌이다.** ADR-0004를 유지해도 SwiftUI와 Glance를 각각 써야 했다. 이
  결정이 새로 만드는 분기는 UI가 아니라 **데이터 전달 경로 하나**뿐이고, 그건 이미
  `lib/widget/syncWidget.ts`의 `deliverWidgetPayload` 한 함수 안에 갇혀 있다.

### 검토했지만 채택하지 않은 것

| 대안 | 기각 이유 |
|------|-----------|
| ADR-0004 그대로 (양쪽 직접) | iOS에서 버릴 코드(Swift 위젯 + App Group 네이티브 모듈)를 새로 쓰게 된다. 유지보수 대상만 늘어난다. |
| expo-widgets 전면 채택, Android 보류 | MVP 정의(양 플랫폼 위젯)를 바꿔야 한다. 출시 범위 축소는 제품 결정이라 기술 ADR로 정할 것이 아니다. |
| Android도 `enableAndroid: true`로 켜기 | Glance 렌더가 `Text(widgetName)` 스텁이라 실제로 아무것도 못 그린다. |

## 되돌리는 조건

**expo-widgets가 Android Glance 렌더를 구현하면 재검토한다.** 그때는 `enableAndroid: true`로
켜고 우리 Glance 코드를 지우면 양 플랫폼이 TSX 한 벌로 통일된다 — 이 ADR이 만든 분기가
없어지는 방향이다. 그래서 P3-S3의 Glance 코드는 **버려질 수 있다는 전제로** 쓰는 게 맞고,
`deliverWidgetPayload`의 플랫폼 분기를 다른 곳으로 새어나가지 않게 유지해야 한다.

## 영향

- `apps/mobile`에 `expo-widgets`·`expo-file-system` 의존성이 추가됐다.
- `app.json`의 플러그인 설정에 **사람이 Apple Developer에 등록한 식별자를 그대로 박았다** —
  App Group `group.com.ongod.app`, 위젯 번들 ID `com.ongod.app.widget`. 기본값
  (`<앱번들ID>.ExpoWidgetsTarget`)과 다르므로 명시가 필수다.
- `enableAndroid: false`로 두었다. Android 위젯은 P3-S3에서 별도로 만든다.
- 위젯 레이아웃(`widgets/OnGodToday.tsx`)은 **앱 코드를 import할 수 없다.** 별도 JS
  컨텍스트에서 돌기 때문에 `@ongod/ui-tokens`조차 못 쓴다 — 색이 중복되는 것은 의도된 것이다.
- **관리형 워크플로를 유지한다.** `expo prebuild`로 생성물을 확인만 하고 지웠다. `ios/`·
  `android/`는 `.gitignore`에 있고, EAS Build가 빌드 시점에 prebuild한다.

## 검증

- `expo prebuild --platform ios`로 Config Plugin이 실제로 만드는 것을 확인했다:
  - 위젯 익스텐션 타깃 `ExpoWidgetsTarget` 생성
  - **앱과 위젯 양쪽 entitlements에 `group.com.ongod.app`** — 사람이 등록한 값과 일치
  - `PRODUCT_BUNDLE_IDENTIFIER = "com.ongod.app.widget"` — 일치
  - `OnGodToday.swift`에 `.configurationDisplayName("오늘의 곡")`, `.supportedFamilies([.systemSmall])`
  - 확인 후 `ios/` 삭제(관리형 유지)
- Expo Go에서 앱이 정상 동작하고 **에러 로그가 없다**. 위젯 네이티브가 없는 런타임은
  `requireOptionalNativeModule("ExpoWidgets")`로 판별해 건너뛴다 — 환경 플래그
  (`Constants.executionEnvironment`)로는 Expo Go와 dev client가 둘 다 `storeClient`라
  구분이 안 되므로 **능력을 직접 확인하는 방식**을 썼다.
- `pnpm turbo run typecheck lint test` 19/19.

## 아직 검증 못 한 것

**위젯이 실제로 그려지는 것은 확인하지 못했다.** Expo Go로는 위젯이 뜨지 않아 EAS 개발
빌드가 필요하고, 홈 화면 위젯 추가·자정 갱신·탭 동작은 실기기에서만 확인된다
(P3-S2-T7, 🧑 사람 몫). 지금 확인된 것은 "Config Plugin이 올바른 네이티브 구성을 만든다"와
"앱이 깨지지 않는다"까지다.
