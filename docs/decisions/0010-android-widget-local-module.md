# ADR-0010 — Android 위젯: 로컬 Expo 모듈 + JS 타임라인 + WorkManager 전환

- 상태: 채택(Accepted)
- 일자: 2026-09-11
- 이어받는 결정: [ADR-0009 — iOS는 `expo-widgets`, Android는 Glance 직접 작성](./0009-widget-expo-widgets-ios-glance-android.md)
- 관련: [P3-S3](../phase-3-widget.md#s3-android-위젯-glance), [P3-S2-T4](../phase-3-widget.md#s2-ios-위젯-widgetkit), [P3-S4-T2](../phase-3-widget.md#s4-갱신딥링크안정화-srs-42)

## 배경

ADR-0009가 "Android 위젯은 Glance로 직접 작성"까지 정했다. 실제로 만들려면 세 가지를 더 정해야 했다.

1. **관리형 워크플로(`android/` 미커밋)에서 Kotlin 코드를 어디에 두고 어떻게 빌드에 넣는가.**
2. **"언제 무엇을 그릴지"를 어디서 판단하는가.** iOS는 JS(`@ongod/core`의 `buildWidgetTimeline`)가 타임라인을 만들고 WidgetKit이 그 시각에 맞춰 그린다.
3. **앱이 꺼져 있을 때 KST 07:00 전환을 누가 일으키는가.** Glance에는 WidgetKit 같은 타임라인 기능이 없다.

## 결정

### 1. 로컬 Expo 모듈 `apps/mobile/modules/ongod-widget` — Config Plugin 없이

- expo 오토링킹이 기본으로 `./modules`를 찾으므로 **설정 없이 빌드에 포함**된다. EAS Build의 prebuild에서도 같다.
- 위젯 등록에 필요한 것(`<receiver>`, `appwidget-provider` XML, 문자열, drawable)을 **모듈의 라이브러리 매니페스트·리소스**에 둔다. Android 빌드가 앱 매니페스트에 자동 병합하므로 **Config Plugin이 필요 없다.**

| 대안 | 기각 이유 |
|------|-----------|
| Config Plugin(`withDangerousMod`)이 `android/app/`에 Kotlin 파일을 써넣기 — expo-widgets 방식 | Kotlin 코드가 JS 문자열 템플릿 안에 들어가 컴파일러·IDE 도움을 못 받는다. 앱 패키지 안에 있어야 할 이유(예: `MainActivity` 직접 참조)도 없었다. |
| `android/` 폴더 커밋(bare 워크플로) | 관리형을 포기하게 되고, Expo SDK 업그레이드마다 네이티브 프로젝트를 손으로 병합해야 한다. |

### 2. 판단은 JS가 한다 — 네이티브는 "지금 시각의 칸"만 고른다

- JS가 iOS와 **똑같이** `buildWidgetTimeline`으로 타임라인을 만들고 `updateTimeline(entries, deepLink)`로 넘긴다. 네이티브는 `at <= now` 중 가장 늦은 칸을 그릴 뿐이다.
- 모듈 API를 expo-widgets iOS(`getTimeline`/`updateTimeline`)와 **같은 모양**으로 맞췄다. 그래서 `lib/widget/syncWidget.ts`의 플랫폼 분기는 `loadWidgetSurface` 한 함수로 끝나고, 07:00 판단·커버 캐시·중복 건너뛰기(P3-S4-T5)는 두 플랫폼이 같은 코드를 탄다.
- 저장소는 **SharedPreferences**(JSON, `version` 필드 포함)다.

| 대안 | 기각 이유 |
|------|-----------|
| Kotlin에 07:00 규칙을 다시 구현 | 두 플랫폼 판단이 갈라질 수 있다 — 같은 날 iOS와 Android가 다른 곡을 그리는 원인이 된다. P3-S4-T2에서 고친 "서버 날짜 기준 전환" 같은 보정도 두 번 해야 한다. |
| Glance `GlanceStateDefinition`(DataStore) | 위젯 **인스턴스별** 상태라 추가된 모든 위젯에 따로 써야 한다. 앱 전체에 한 벌인 데이터에는 과하다. |

### 3. 전환은 WorkManager 1회성 예약

- 타임라인에 미래 시각이 있으면 그 시각에 `OneTimeWorkRequest`(고유 이름, REPLACE)를 건다. 워커는 **네트워크 없이** 위젯만 다시 그린다 — 보여줄 내용은 이미 타임라인에 있다.
- 위젯 추가·재부팅·앱 업데이트 때(`onUpdate`)도 저장된 타임라인으로 예약을 다시 건다.

| 대안 | 기각 이유 |
|------|-----------|
| `updatePeriodMillis` 주기 갱신(최소 30분) | 하루 48번 기기를 깨우는데도 정각 전환은 보장되지 않는다. |
| AlarmManager 정확 알람 | Android 12+에서 `SCHEDULE_EXACT_ALARM` 권한과 스토어 심사 사유가 필요하다. 위젯 전환에는 과하다. |

### 부수 결정

- **커버 이미지**: 앱 내부 저장소 `files/ongod-widget/`. Glance 위젯은 앱과 같은 프로세스에서 돌아 그대로 읽는다(iOS의 App Group 공유 디렉터리에 해당). 위젯은 이 디렉터리 안의 파일만 읽는다.
- **의존성 버전**을 이미 빌드에 들어와 있는 것과 맞췄다 — Glance는 expo-widgets(Android 스텁 모듈)와, WorkManager는 expo-background-task와 같은 버전. 다르면 Gradle이 높은 쪽으로 올려 그 모듈들이 검증되지 않은 버전으로 돈다.
- **`.gitignore`의 `ios/`·`android/`를 `/apps/mobile/ios/`·`/apps/mobile/android/`로 고정했다.** 그냥 `android/`면 모듈 소스(`modules/ongod-widget/android/`)까지 무시돼 **커밋에서 조용히 빠진다** — 작성 직후 `git check-ignore`로 실제로 걸리는 것을 확인했다.

## 되돌리는 조건

**expo-widgets가 Android Glance 렌더를 구현하면**(ADR-0009와 같은 조건) `loadWidgetSurface`의 Android 구현을 expo-widgets로 바꾸고 이 모듈을 지운다. 타임라인 모양이 같으므로 JS의 나머지는 그대로 둔다.

## 알려진 한계

- **WorkManager는 늦게 돌 수 있다.** 기기가 절전(Doze) 중이면 07:00 정각이 아니라 다음 유지보수 창에 바뀐다. 먼저 돌지는 않으므로 "7시 전에 새 곡이 뜨는" 일은 없다.
- **CI는 Kotlin을 컴파일하지 않는다.** 모듈의 네이티브 코드를 바꾸면 로컬 빌드나 EAS 빌드로 확인해야 한다.
- ~~**EAS Android 빌드는 아직 안 했다.** 첫 EAS Android 빌드는 앱 서명 키를 새로 만드는데, 그 키는 Play Store 신원이라 사람 승인을 받기로 했다([human-actions P3-S3-T1b](../human-actions.md)). 대신 EAS가 하는 것과 같은 경로(`expo prebuild` → Gradle)를 로컬에서 돌려 검증했다.~~
  → **2026-09-12 해소.** 사람 승인 후 첫 EAS Android 빌드를 돌려 서명 키를 생성했고(EAS 서버 보관), 그 APK로 관리형 빌드 경로까지 확인했다([P3-S4-T3 로그](../logs/frontend-log.md#2026-09-12--p3-s4-t3--딥링크-라우팅-통합--불일치-방지-검사)).

## 검증

Android 에뮬레이터(Medium Phone, API 36), 로컬 `expo prebuild --platform android` + Gradle debug 빌드. 확인 후 생성된 `android/`는 지운다(관리형 유지).

| 확인한 것 | 결과 |
|-----------|------|
| 오토링킹 | `ongod-widget` / `com.ongod.widget.OnGodWidgetModule` 자동 포함 — 설정 추가 없음 |
| 매니페스트 병합 | 앱 병합 매니페스트에 `OnGodWidgetReceiver` + `appwidget-provider` 메타데이터 존재, `dumpsys appwidget`에 provider 등록 |
| 위젯 선택기 | "OnGod · 오늘의 곡 · 2×2" + 설명문 노출, 홈 화면 추가 성공 |
| 렌더 | 실제 dev 데이터("Break Every Chain") 커버 풀블리드 + 스크림 + 곡명/아티스트. RemoteViews 비트맵 1MB(512×512 디코드와 일치) |
| 전환 예약 | 전환 시각을 90초 뒤로 둔 임시 타임라인 → **앱 프로세스를 죽인 상태에서** 예약 약 10초 뒤 워커가 위젯을 다음 칸으로 바꿈 |
| 폴백 | 커버 없는 칸 → 어두운 배경 + 음표 |
| 탭 | `VIEW ongod://`가 `com.ongod.app/.MainActivity`로만 전달(`setPackage`), 앱 전면 |
| 백그라운드 동기화 | expo-background-task가 `ongod-widget-sync` 실행 → JS가 새 타임라인을 넘기고 앱을 열지 않은 채 위젯 갱신 |
