// P3-S1-T2: 앱이 오늘 곡을 받아 위젯이 읽을 수 있는 곳에 넘긴다.
//
// 전달 방식은 플랫폼마다 다르다(ADR-0009):
//   - iOS: expo-widgets가 App Group UserDefaults와 공유 디렉터리를 관리해준다. 우리는
//     `updateSnapshot`으로 값을 밀어넣기만 하면 된다.
//   - Android: expo-widgets의 Glance 렌더가 아직 스텁이라 P3-S3에서 직접 구현한다.
//     그때 이 파일의 `deliverWidgetPayload`에 Android 분기를 추가하면 된다.
//
// 가져오기(fetch)와 넘기기(deliver)를 나눠둔 덕분에 플랫폼 분기가 이 파일 한 곳에만 생긴다.

import type { WidgetPayload } from "@ongod/core";
import { Directory, File } from "expo-file-system";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

import { fetchWidgetPayload } from "./fetchWidgetPayload";

/**
 * 위젯 네이티브가 이 런타임에 있는지. **환경을 추측하지 않고 능력을 직접 확인한다** —
 * Expo Go와 dev client는 `Constants.executionEnvironment`가 둘 다 `storeClient`라
 * 구분이 안 되고, dev client에는 위젯 네이티브가 실제로 들어있기 때문이다.
 *
 * `requireOptionalNativeModule`은 없으면 던지지 않고 null을 준다. 그냥 `import`하면
 * 모듈 평가 단계에서 터져 Expo Go 콘솔에 ERROR가 찍힌다(실제로 그랬다).
 */
const hasWidgetNative = requireOptionalNativeModule("ExpoWidgets") !== null;

/**
 * 위젯 이미지를 App Group 공유 디렉터리에 받아두고 로컬 경로를 돌려준다.
 *
 * 왜 다운로드가 필요한가: 위젯의 `Image`는 `uiImage`에 **로컬 파일 경로만** 받는다(동기
 * 읽기라 원격 URL을 못 쓴다). 게다가 위젯 익스텐션은 메모리·실행시간 예산이 빡빡해서
 * 네트워크를 타면 안 된다 — 받아두는 건 앱의 몫이다.
 *
 * 곡마다 다른 파일명을 쓴다. 같은 파일명에 덮어쓰면 iOS가 이전 이미지를 캐시해 곡이
 * 바뀌어도 어제 커버가 남는 사고가 난다(백엔드가 `thumbnail.webp` → `widget.webp`로
 * 파일명을 바꿔 CDN 캐시 충돌을 피한 것과 같은 이유다).
 *
 * 실패하면 `undefined` — 커버 없이 곡명만 그린다. 이미지 하나 때문에 위젯 전체가
 * 비어버리는 게 더 나쁘다.
 */
async function cacheWidgetImage(payload: WidgetPayload): Promise<string | undefined> {
  if (!payload.imageUrl) return undefined;

  try {
    const { widgetsDirectory } = await import("expo-widgets");
    const dir = new Directory(widgetsDirectory);
    if (!dir.exists) dir.create({ intermediates: true });

    const target = new File(dir, `cover-${payload.songId}.webp`);
    if (target.exists) return target.uri;

    // 곡이 바뀌면 이전 곡 파일은 쓸모없다. 공유 컨테이너가 무한정 커지지 않도록 정리한다.
    for (const entry of dir.list()) {
      if (entry.name.startsWith("cover-") && entry.name !== target.name) entry.delete();
    }

    const downloaded = await File.downloadFileAsync(payload.imageUrl, target);
    return downloaded.uri;
  } catch (error) {
    console.warn("[widget] 이미지 캐시 실패 — 커버 없이 그린다", error);
    return undefined;
  }
}

/** 위젯 표면에 페이로드를 전달한다. `null`은 "오늘 픽 없음". */
async function deliverWidgetPayload(payload: WidgetPayload | null): Promise<void> {
  // Android는 P3-S3에서 직접 구현한다(ADR-0009). 그전까지는 조용히 건너뛴다 —
  // 여기서 던지면 Android 앱이 시작할 때마다 경고가 뜬다.
  if (Platform.OS !== "ios") return;

  const { OnGodTodayWidget } = await import("../../widgets/OnGodToday");

  if (!payload) {
    // 오늘 픽이 없으면 빈 값으로 갱신한다. 어제 곡을 그대로 두면 사용자는 그게 오늘
    // 곡인 줄 안다 — 틀린 정보를 보여주느니 비어 있는 게 낫다.
    OnGodTodayWidget.updateSnapshot({ title: "오늘의 곡을 준비 중이에요", artist: "" });
    return;
  }

  const imagePath = await cacheWidgetImage(payload);
  OnGodTodayWidget.updateSnapshot({
    title: payload.title,
    artist: payload.artist,
    imagePath,
  });
}

/**
 * 오늘 픽을 읽어 위젯에 전달한다. 실패해도 절대 던지지 않는다 — 위젯 동기화가 안 되는 것이
 * 앱 자체를 깨뜨려서는 안 된다(네트워크 없음은 흔한 상황이고, 위젯은 마지막 값을 계속 그리면
 * 된다).
 */
export async function syncWidget(): Promise<void> {
  // 위젯 네이티브가 없는 런타임(Expo Go)에서는 아무것도 하지 않는다. 여기서 막지 않으면
  // expo-widgets를 import하는 순간 모듈 평가가 실패해 콘솔에 ERROR가 찍힌다.
  if (!hasWidgetNative) {
    console.log("[widget] 네이티브 모듈 없음 — 동기화 건너뜀 (Expo Go에서는 정상)");
    return;
  }

  try {
    const payload = await fetchWidgetPayload();
    await deliverWidgetPayload(payload);
    console.log(
      "[widget] 동기화",
      payload ? { pickDate: payload.pickDate, title: payload.title } : "오늘 픽 없음",
    );
  } catch (error) {
    console.warn("[widget] 동기화 실패 — 위젯은 마지막 값을 유지한다", error);
  }
}
