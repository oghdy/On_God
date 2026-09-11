// P3-S3-T2: Android 홈 화면 위젯(Glance) 네이티브 모듈의 JS 입구. 근거는 ADR-0010.
//
// iOS는 expo-widgets가 위젯을 맡고, Android는 이 로컬 모듈이 맡는다. 두 쪽 모두 "타임라인을
// 넘기면 그 시각에 맞춰 그린다"는 같은 모양이라 `lib/widget/syncWidget.ts`가 한 흐름으로 쓴다.

import { requireOptionalNativeModule } from "expo-modules-core";

/** 네이티브와 주고받는 타임라인 한 칸. 브리지를 건너기 쉽게 평평한 모양으로 둔다. */
export interface OnGodWidgetEntry {
  /** 이 순간(epoch ms)부터 이 내용을 그린다. */
  date: number;
  title: string;
  artist: string;
  /** `getCoversDirectory()` 안의 `file://` URI. 없으면 커버 없이 그린다. */
  imagePath: string | null;
}

interface OnGodWidgetNativeModule {
  /** 커버 파일을 받아둘 디렉터리(`file://`). 위젯이 앱과 같은 프로세스라 앱 내부 저장소다. */
  getCoversDirectory(): string;
  getTimeline(): Promise<OnGodWidgetEntry[]>;
  /** 타임라인을 저장하고 위젯을 다시 그린 뒤, 다음 전환 시각에 깨어나도록 예약한다. */
  updateTimeline(entries: OnGodWidgetEntry[], deepLink: string): Promise<void>;
}

/**
 * Android 개발·정식 빌드에만 있다. iOS·Expo Go에서는 `null` — 그냥 `requireNativeModule`을 쓰면
 * 모듈 평가 단계에서 터져 콘솔에 ERROR가 찍힌다(P3-S1-T2에서 expo-widgets로 겪은 것과 같다).
 */
export const OnGodWidgetNative = requireOptionalNativeModule<OnGodWidgetNativeModule>("OnGodWidget");
