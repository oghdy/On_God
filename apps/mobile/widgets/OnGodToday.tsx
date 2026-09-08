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
  background,
  clipped,
  containerBackground,
  font,
  foregroundColor,
  frame,
  lineLimit,
  padding,
  resizable,
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

  // 위젯을 가득 채우는 크기. SwiftUI의 .infinity를 넘길 방법이 없어 충분히 큰 수를 쓴다.
  const FILL = 9999;

  return (
    <ZStack
      modifiers={[
        frame({ maxWidth: FILL, maxHeight: FILL }),
        // iOS 17+ 위젯은 배경을 containerBackground로 선언해야 시스템이 제대로 그린다.
        // 커버가 있을 땐 이미지가 덮어 안 보이지만, 커버가 없는 곡(dev의 "Go Down Moses")
        // 에서는 이게 배경이 된다 — 없으면 흰 배경이 나와 다크 테마인 앱과 따로 논다.
        // 값은 @ongod/ui-tokens의 colors.dark.background와 같다(위젯 컨텍스트에선 토큰을
        // import할 수 없어 리터럴로 중복해둔 것).
        containerBackground("#0B0B0D", "widget"),
        // 위젯 전체를 탭하면 앱의 오늘 카드로 간다(P3-S2-T5). 목적지가 항상 같아서 상수다.
        widgetURL("ongod://"),
      ]}
    >
      {props.imagePath ? (
        <Image
          uiImage={props.imagePath}
          modifiers={[
            // **resizable()이 없으면 이미지가 원본 크기(512pt)로 그려진다.** 위젯은 158pt
            // 남짓이라 이미지가 위젯 밖으로 한참 넘치면서 위에 겹칠 텍스트까지 통째로
            // 덮어버린다 — 실제로 겪었다. frame만으로는 축소되지 않는다.
            resizable(),
            aspectRatio({ contentMode: "fill" }),
            frame({ maxWidth: FILL, maxHeight: FILL }),
            // 커버도 위젯도 정사각이라 보통 넘치지 않지만, 비정사각 커버가 들어와도
            // 위젯 밖으로 새지 않도록 잘라둔다.
            clipped(),
          ]}
        />
      ) : (
        // 커버가 아예 없는 곡이 실제로 있다(dev의 "Go Down Moses"). 이때도 곡명은 읽혀야
        // 하므로 빈 화면 대신 음표 심볼로 대체한다(P3-S2-T6).
        <Image
          systemName="music.note"
          size={44}
          color="#4A4A50"
          modifiers={[frame({ maxWidth: FILL, maxHeight: FILL })]}
        />
      )}

      <VStack
        alignment="leading"
        spacing={2}
        // **순서가 의미를 바꾼다.** SwiftUI 그대로 padding → frame → background 순이어야
        // 한다: 글자를 12pt 들여쓰고(padding), 그 뷰를 위젯 전체로 늘린 뒤 내용을 좌하단에
        // 붙이고(frame), 마지막으로 늘어난 프레임 전체에 그라디언트를 칠한다(background).
        // background를 frame보다 앞에 두면 늘어나기 전 크기에만 칠해져 가장자리가 뜬다.
        modifiers={[
          padding({ all: 12 }),
          frame({ maxWidth: FILL, maxHeight: FILL, alignment: "bottomLeading" }),
          // 앨범아트가 어떤 색일지 모른다 — 밝은 커버 위에서는 흰 글씨가 그냥 사라진다.
          // 글자마다 그림자를 주는 것보다 아래쪽을 어둡게 깔아주는 편이 확실하고, 앱의
          // DailyCard가 쓰는 그라디언트 스크림과 같은 방식이라 위젯과 앱의 인상이 같아진다.
          background({
            type: "linearGradient",
            colors: ["#00000000", "#00000059", "#000000D9"],
            startPoint: { x: 0.5, y: 0.35 },
            endPoint: { x: 0.5, y: 1 },
          }),
        ]}
      >
        <Text
          modifiers={[
            font({ size: 15, weight: "bold" }),
            foregroundColor("#FFFFFF"),
            lineLimit(2),
          ]}
        >
          {props.title}
        </Text>
        <Text
          modifiers={[
            font({ size: 12 }),
            foregroundColor("#E4E4E9"),
            lineLimit(1),
          ]}
        >
          {props.artist}
        </Text>
      </VStack>
    </ZStack>
  );
});
