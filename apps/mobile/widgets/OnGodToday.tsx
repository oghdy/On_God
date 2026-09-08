// P3-S2-T3/T5/T6: 홈 화면 2×2(systemSmall) 위젯 레이아웃. 근거는 ADR-0009.
//
// **이 파일은 앱 번들과 다른 곳에서 실행된다.** expo-widgets가 아래 레이아웃 함수의 소스를
// 추출해 위젯 익스텐션 안의 별도 JS 컨텍스트에서 돌리고, 거기엔 `@expo/ui/swift-ui`
// 컴포넌트·modifier가 전역으로 주입돼 있다. 그래서 지켜야 할 제약이 있다:
//
//   - 함수 첫 줄의 `'widget'` 지시자를 지우면 안 된다(추출 표시).
//   - 레이아웃 함수 밖의 값을 클로저로 잡으면 안 된다 — 앱의 theme·상수도 못 쓴다.
//     그래서 색을 리터럴로 박아뒀다. `@ongod/ui-tokens`와 값이 겹치는 건 의도된 중복이다
//     (토큰을 import하면 위젯 컨텍스트에서 터진다).
//   - 이미지는 **로컬 파일만** 된다(`uiImage`가 동기 읽기라 원격 URL 불가). 앱이 미리
//     App Group 공유 디렉터리에 받아두고 그 경로를 넘긴다 — `lib/widget/syncWidget.ts` 참고.

import { Image, Text, VStack, ZStack } from "@expo/ui/swift-ui";
import {
  aspectRatio,
  font,
  foregroundColor,
  frame,
  lineLimit,
  padding,
  widgetURL,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget } from "expo-widgets";

/** 위젯이 그리는 값. `@ongod/core`의 `WidgetPayload`에서 위젯이 쓰는 것만 추린 모양이다. */
export interface OnGodTodayProps {
  title: string;
  artist: string;
  /** App Group 공유 디렉터리의 `file://` 경로. 없으면 커버 없이 그린다. */
  imagePath?: string;
}

export const OnGodTodayWidget = createWidget<OnGodTodayProps>("OnGodToday", (props) => {
  "widget";

  // 위젯 전체를 탭하면 앱의 오늘 카드로 간다(P3-S2-T5). 목적지가 항상 같아서 상수다.
  const container = [frame({ maxWidth: 9999, maxHeight: 9999 }), widgetURL("ongod://")];

  return (
    <ZStack modifiers={container}>
      {props.imagePath ? (
        <Image
          uiImage={props.imagePath}
          modifiers={[
            aspectRatio({ contentMode: "fill" }),
            frame({ maxWidth: 9999, maxHeight: 9999 }),
          ]}
        />
      ) : (
        // 커버가 아예 없는 곡이 실제로 있다(dev의 "Go Down Moses"). 이때도 곡명은 읽혀야
        // 하므로 빈 화면 대신 음표 심볼로 대체한다(P3-S2-T6).
        <Image
          systemName="music.note"
          size={44}
          color="#4A4A4F"
          modifiers={[frame({ maxWidth: 9999, maxHeight: 9999 })]}
        />
      )}

      <VStack
        alignment="leading"
        spacing={2}
        modifiers={[
          frame({ maxWidth: 9999, maxHeight: 9999, alignment: "bottomLeading" }),
          padding({ all: 12 }),
        ]}
      >
        <Text
          modifiers={[font({ size: 15, weight: "bold" }), foregroundColor("#FFFFFF"), lineLimit(2)]}
        >
          {props.title}
        </Text>
        <Text modifiers={[font({ size: 12 }), foregroundColor("#D5D5DA"), lineLimit(1)]}>
          {props.artist}
        </Text>
      </VStack>
    </ZStack>
  );
});
