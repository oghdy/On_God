import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Song } from "@ongod/core";
import { radius, streaming, type StreamingPlatform } from "@ongod/ui-tokens";
import { Pressable, StyleSheet } from "react-native";

import { openStreamingLink } from "../../lib/streaming/deepLink";

const PLATFORM_ICON: Record<StreamingPlatform, keyof typeof MaterialCommunityIcons.glyphMap> = {
  appleMusic: "apple",
  spotify: "spotify",
  youtube: "youtube",
};

interface StreamingButtonProps {
  platform: StreamingPlatform;
  song: Song;
}

/** 브랜드 컬러 유지 원형 버튼 하나(SRS 4.1). 탭하면 앱 스킴 우선 → 웹 폴백으로 연다. */
export function StreamingButton({ platform, song }: StreamingButtonProps) {
  const brand = streaming[platform];

  return (
    <Pressable
      onPress={() => void openStreamingLink(platform, song)}
      style={[styles.button, { backgroundColor: brand.background }]}
      hitSlop={8}
    >
      <MaterialCommunityIcons name={PLATFORM_ICON[platform]} size={24} color={brand.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
