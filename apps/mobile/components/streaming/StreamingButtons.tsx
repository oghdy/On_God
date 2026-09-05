import type { Song } from "@ongod/core";
import { spacing, type StreamingPlatform } from "@ongod/ui-tokens";
import { View, StyleSheet } from "react-native";

import { hasStreamingLink } from "../../lib/streaming/deepLink";
import { StreamingButton } from "./StreamingButton";

const ALL_PLATFORMS: StreamingPlatform[] = ["appleMusic", "spotify", "youtube"];

interface StreamingButtonsProps {
  song: Song;
}

/**
 * P2-S5-T2/T4: SRS 8장 미결사항("세 플랫폼 동시 표시 vs 기기 설치 앱 기반 자동 정렬")은
 * MVP 범위에서 "3개 동시 표시"로 단순화하기로 결정됐다(phase-2-core-app.md 참고).
 * P2-S5-T3: 링크가 아예 없는 플랫폼은 버튼 자체를 렌더링하지 않는다(비활성 상태로
 * 보여주지 않음 — 눌러도 아무 일도 안 일어나는 죽은 버튼보다 낫다).
 */
export function StreamingButtons({ song }: StreamingButtonsProps) {
  const platforms = ALL_PLATFORMS.filter((platform) => hasStreamingLink(platform, song));

  if (platforms.length === 0) return null;

  return (
    <View style={styles.row}>
      {platforms.map((platform) => (
        <StreamingButton key={platform} platform={platform} song={song} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
});
