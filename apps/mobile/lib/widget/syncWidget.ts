// P3-S1-T2 / P3-S2-T4 / P3-S3-T2: 앱이 오늘 곡을 받아 위젯이 읽을 수 있는 곳에 넘긴다.
//
// 전달 방식은 플랫폼마다 다르다:
//   - iOS: expo-widgets가 App Group UserDefaults와 공유 디렉터리를 관리해준다(ADR-0009).
//   - Android: 로컬 네이티브 모듈 `modules/ongod-widget`(Glance)이 SharedPreferences와 앱 내부
//     저장소를 쓴다. expo-widgets의 Android Glance 렌더가 아직 스텁이라 직접 만들었다(ADR-0010).
//
// 두 플랫폼 모두 "타임라인(언제 무엇을 그릴지)을 넘기면 위젯이 그 시각에 맞춰 그린다"는 같은
// 모양이다. 그래서 차이는 `loadWidgetSurface` 한 함수에 갇혀 있고, 07:00 판단·커버 캐시·중복
// 건너뛰기는 두 플랫폼이 이 파일의 같은 코드를 탄다.

import { WIDGET_DEEP_LINK, buildWidgetTimeline, type WidgetPayload } from "@ongod/core";
import { Directory, File } from "expo-file-system";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

import { OnGodWidgetNative } from "../../modules/ongod-widget";
import type { OnGodTodayProps } from "../../widgets/OnGodToday";
import { fetchWidgetPayload } from "./fetchWidgetPayload";

type Slot = { date: Date; props: OnGodTodayProps };

/**
 * 위젯 표면 — 플랫폼마다 다른 부분을 이 모양 하나로 감춘다. 새 방식이 생기면(예: expo-widgets가
 * Android를 구현하면) `loadWidgetSurface`의 구현 하나만 바꾸면 된다.
 */
interface WidgetSurface {
  /** 커버 파일을 받아둘 디렉터리(`file://`). 위젯이 직접 읽을 수 있는 곳이어야 한다. */
  coversDirectory: string;
  /** 지금 잡혀 있는 타임라인. 아직 한 번도 안 그렸으면 빈 배열. */
  getTimeline(): Promise<Slot[]>;
  updateTimeline(entries: Slot[]): Promise<void>;
}

/**
 * iOS 위젯 네이티브가 이 런타임에 있는지. **환경을 추측하지 않고 능력을 직접 확인한다** —
 * Expo Go와 dev client는 `Constants.executionEnvironment`가 둘 다 `storeClient`라
 * 구분이 안 되고, dev client에는 위젯 네이티브가 실제로 들어있기 때문이다.
 *
 * `requireOptionalNativeModule`은 없으면 던지지 않고 null을 준다. 그냥 `import`하면
 * 모듈 평가 단계에서 터져 Expo Go 콘솔에 ERROR가 찍힌다(실제로 그랬다).
 *
 * **Android에서는 이 모듈을 쓰면 안 된다** — expo-widgets의 Android 모듈은 존재하지만 Glance
 * 렌더가 스텁이라(ADR-0009) 넘겨도 아무것도 안 그려진다. 그래서 플랫폼을 함께 확인한다.
 */
const hasIosWidgetNative = Platform.OS === "ios" && requireOptionalNativeModule("ExpoWidgets") !== null;

/** 이 런타임의 위젯 표면. 없으면 null — 위젯 네이티브가 없는 Expo Go가 그렇다. */
async function loadWidgetSurface(): Promise<WidgetSurface | null> {
  if (hasIosWidgetNative) {
    // 동적 import: 위젯 네이티브가 없는 런타임에서 이 모듈들을 평가하면 콘솔 ERROR가 난다.
    const [{ widgetsDirectory }, { OnGodTodayWidget }] = await Promise.all([
      import("expo-widgets"),
      import("../../widgets/OnGodToday"),
    ]);
    return {
      coversDirectory: widgetsDirectory,
      getTimeline: () => OnGodTodayWidget.getTimeline(),
      updateTimeline: async (entries) => OnGodTodayWidget.updateTimeline(entries),
    };
  }

  if (Platform.OS === "android" && OnGodWidgetNative) {
    const native = OnGodWidgetNative;
    return {
      coversDirectory: native.getCoversDirectory(),
      getTimeline: async () =>
        (await native.getTimeline()).map((entry) => ({
          date: new Date(entry.date),
          props: { title: entry.title, artist: entry.artist, imagePath: entry.imagePath ?? undefined },
        })),
      updateTimeline: (entries) =>
        native.updateTimeline(
          entries.map(({ date, props }) => ({
            date: date.getTime(),
            title: props.title,
            artist: props.artist,
            imagePath: props.imagePath ?? null,
          })),
          // 딥링크는 JS 상수를 넘긴다 — 네이티브에 같은 문자열을 또 박지 않으려고.
          WIDGET_DEEP_LINK,
        ),
    };
  }

  return null;
}

/** 오늘 픽이 없는 날(dev의 9/21이 그렇다) 위젯에 그릴 내용. */
const EMPTY_PROPS: OnGodTodayProps = { title: "오늘의 곡을 준비 중이에요", artist: "" };

/** 공유 디렉터리에 저장하는 커버 파일 이름 규칙. 곡마다 다른 이름을 쓴다. */
function coverFileName(songId: string): string {
  return `cover-${songId}.webp`;
}

/**
 * 위젯 이미지를 위젯이 읽을 수 있는 디렉터리에 받아두고 로컬 경로를 돌려준다. **정리는 하지
 * 않는다** — 무엇을 지워도 되는지는 타임라인을 다 만들어봐야 알 수 있어서 `pruneCovers`로
 * 분리했다.
 *
 * 왜 다운로드가 필요한가: iOS 위젯의 `Image`는 `uiImage`에 **로컬 파일 경로만** 받고(동기 읽기라
 * 원격 URL을 못 쓴다), Android 위젯도 비트맵으로 넘겨야 한다. 게다가 위젯은 메모리·실행시간
 * 예산이 빡빡해서 네트워크를 타면 안 된다 — 받아두는 건 앱의 몫이다.
 *
 * 실패하면 `undefined` — 커버 없이 곡명만 그린다. 이미지 하나 때문에 위젯 전체가
 * 비어버리는 게 더 나쁘다.
 */
async function cacheCover(payload: WidgetPayload, directory: string): Promise<string | undefined> {
  if (!payload.imageUrl) return undefined;

  try {
    const dir = new Directory(directory);
    if (!dir.exists) dir.create({ intermediates: true });

    const target = new File(dir, coverFileName(payload.songId));
    if (target.exists) return target.uri;

    const downloaded = await File.downloadFileAsync(payload.imageUrl, target);
    return downloaded.uri;
  } catch (error) {
    console.warn("[widget] 이미지 캐시 실패 — 커버 없이 그린다", error);
    return undefined;
  }
}

/**
 * 타임라인이 실제로 참조하는 커버만 남기고 나머지를 지운다.
 *
 * **"오늘 것만 남기고 다 지운다"로 하면 안 된다.** 07:00 이전에는 타임라인이 어제 곡
 * 엔트리를 그대로 유지하는데(아래 `deliverWidgetPayload` 참고), 그 파일을 지워버리면
 * 위젯이 07:00까지 커버 없는 상태로 보인다. 그래서 지울 대상을 "참조되지 않는 파일"로
 * 정의하고, 타임라인을 다 만든 뒤에 호출한다.
 */
async function pruneCovers(keepUris: (string | undefined)[], directory: string): Promise<void> {
  try {
    const dir = new Directory(directory);
    if (!dir.exists) return;

    const keep = new Set(keepUris.filter((uri): uri is string => Boolean(uri)));
    for (const entry of dir.list()) {
      if (entry.name.startsWith("cover-") && !keep.has(entry.uri)) entry.delete();
    }
  } catch (error) {
    // 정리는 실패해도 위젯 동작에 지장이 없다. 다음 기회에 다시 지우면 된다.
    console.warn("[widget] 커버 정리 실패 — 다음 동기화에서 재시도", error);
  }
}

/** 위젯에 현재 잡혀 있는 타임라인. 아직 한 번도 안 그려졌으면 빈 배열이다. */
async function readTimeline(surface: WidgetSurface): Promise<Slot[]> {
  try {
    const entries = await surface.getTimeline();
    return entries
      // 네이티브를 왕복하면서 date가 숫자로 올 수도 있어 한 번 정규화한다.
      .map((entry) => ({ ...entry, date: new Date(entry.date) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch {
    // 위젯이 아직 한 번도 안 그려졌으면 타임라인이 없다 — 그것도 정상이다.
    return [];
  }
}

/** 지금 화면에 그려지고 있는 항목(= `date <= now` 중 가장 최근 것). */
function displayedAt(timeline: Slot[], now: Date): Slot | undefined {
  return timeline.filter((slot) => slot.date.getTime() <= now.getTime()).pop();
}

function sameProps(a: OnGodTodayProps, b: OnGodTodayProps): boolean {
  return a.title === b.title && a.artist === b.artist && a.imagePath === b.imagePath;
}

/**
 * 이미 원하는 상태인가 — 지금 그려지는 내용이 같고, 예약해야 할 미래 항목도 같은 내용으로
 * 이미 잡혀 있는가(P3-S4-T5).
 *
 * 백그라운드 작업이 몇 시간마다 도는데 곡은 하루에 한 번만 바뀐다. 매번 새로 쓰면 바뀐 게
 * 없는데도 위젯이 계속 다시 그려지고(WidgetKit 리로드 예산 소모), 멀쩡한 상태를 건드릴
 * 기회만 늘어난다. 바뀔 게 없으면 손대지 않는 편이 안전하다.
 */
function isAlreadyScheduled(existing: Slot[], next: Slot[], now: Date): boolean {
  const [first, second] = next;
  const displayed = displayedAt(existing, now);

  if (!displayed || !first || !sameProps(displayed.props, first.props)) return false;
  if (!second) return true;

  return existing.some(
    (slot) => slot.date.getTime() === second.date.getTime() && sameProps(slot.props, second.props),
  );
}

/**
 * 위젯 표면에 페이로드를 전달한다. `null`은 "오늘 픽 없음".
 *
 * **핵심은 "언제 바꿔 그릴지"다**(P3-S2-T4). 곡은 KST 자정에 발행되지만 위젯은 아침
 * 07:00에 바뀐다(`WIDGET_SWITCH_HOUR_KST`). 그래서 자정~07:00 사이에 앱이 열리면
 * 오늘 곡을 **지금 그리면 안 되고** 07:00에 그리도록 예약해야 한다.
 */
async function deliverWidgetPayload(surface: WidgetSurface, payload: WidgetPayload | null): Promise<void> {
  const now = new Date();

  // 커버를 지우기 전에 지금 잡혀 있는 타임라인을 먼저 읽어둔다 — 유지할 엔트리가 참조하는
  // 파일을 살려둬야 하기 때문이다(`pruneCovers` 주석 참고).
  const existing = await readTimeline(surface);
  const current = displayedAt(existing, now);

  const props: OnGodTodayProps = payload
    ? { title: payload.title, artist: payload.artist, imagePath: await cacheCover(payload, surface.coversDirectory) }
    : EMPTY_PROPS;

  // "언제 바꿔 그릴지"는 `@ongod/core`의 순수 함수가 정한다 — iOS·Android가 같은 규칙으로
  // 예약을 잡도록 공유하고, 시각 판단은 테스트로 고정해뒀다.
  // `pickDate`를 넘겨 전환 시각을 **서버가 정한 곡의 날짜**로 계산하게 한다(P3-S4-T2) —
  // 기기 시계로 계산하면 시계가 늦은 폰에서 새 곡이 07:00이 아니라 자정에 바로 뜬다.
  const entries = buildWidgetTimeline({ now, next: props, pickDate: payload?.pickDate, current });

  if (isAlreadyScheduled(existing, entries, now)) {
    console.log("[widget] 이미 최신 — 갱신 건너뜀");
    return;
  }

  await pruneCovers(
    entries.map((entry) => entry.props.imagePath),
    surface.coversDirectory,
  );
  await surface.updateTimeline(entries);

  console.log(
    "[widget] 타임라인",
    entries.map((entry) => ({ at: entry.date.toISOString(), title: entry.props.title })),
  );
}

/**
 * 오늘 픽을 읽어 위젯에 전달한다. 실패해도 절대 던지지 않는다 — 위젯 동기화가 안 되는 것이
 * 앱 자체를 깨뜨려서는 안 된다(네트워크 없음은 흔한 상황이고, 위젯은 마지막 값을 계속 그리면
 * 된다).
 */
export async function syncWidget(): Promise<void> {
  try {
    // 전달할 곳이 없으면 네트워크 요청부터 하지 않는다 — 백그라운드 작업이 쓰이지도 않을 요청을
    // 반복하지 않게.
    const surface = await loadWidgetSurface();
    if (!surface) {
      console.log("[widget] 전달 대상 없음 — 동기화 건너뜀 (Expo Go에서는 정상)");
      return;
    }

    const payload = await fetchWidgetPayload();
    await deliverWidgetPayload(surface, payload);
  } catch (error) {
    console.warn("[widget] 동기화 실패 — 위젯은 마지막 값을 유지한다", error);
  }
}
