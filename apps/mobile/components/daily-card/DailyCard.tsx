import { Ionicons } from "@expo/vector-icons";
import { radius, spacing } from "@ongod/ui-tokens";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "../../lib/theme";
import type { PickWithSong } from "../../lib/supabase/mapPick";
import { StreamingButtons } from "../streaming/StreamingButtons";
import { Text } from "../ui/Text";

interface DailyCardProps {
  pick: PickWithSong;
}

/**
 * 풀스크린 앨범 커버 카드(P2-S3-T1/T2/T3, SRS 3.1+4.1 "Spotify Now Playing 참고 몰입형 레이아웃").
 * `useRecentPicks`가 반환한 픽 하나를 그린다 — 여러 개를 스와이프로 넘기는 건 상위(app/index.tsx)의 몫.
 */
export function DailyCard({ pick }: DailyCardProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { song, songInfo } = pick;

  return (
    <View style={[styles.container, { width }]}>
      {song.albumCoverUrl ? (
        <Image
          source={{ uri: song.albumCoverUrl }}
          placeholder={song.albumCoverThumbnailUrl ? { uri: song.albumCoverThumbnailUrl } : undefined}
          placeholderContentFit="cover"
          contentFit="cover"
          transition={300}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        // Apple Music 키 미발급 등으로 앨범커버가 아직 없는 곡(handoff 참고) — 무음 placeholder.
        <View style={[StyleSheet.absoluteFillObject, styles.noCover]}>
          <Ionicons name="musical-notes" size={64} color={theme.textDisabled} />
        </View>
      )}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.92)"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }]}>
        <View style={styles.meta}>
          <Text variant="display" numberOfLines={2}>
            {song.title}
          </Text>
          <Text variant="title" color={theme.textSecondary}>
            {song.artist}
            {song.releaseYear ? ` · ${song.releaseYear}` : ""}
          </Text>
        </View>
        {songInfo?.descriptionKo ? (
          <Text variant="body" color={theme.textSecondary} style={styles.description} numberOfLines={8}>
            {songInfo.descriptionKo}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <StreamingButtons song={song} />
        </View>
        <Pressable style={styles.lyricsButton} hitSlop={16} onPress={() => router.push(`/lyrics/${song.id}`)}>
          <Ionicons name="reader-outline" size={18} color={theme.textPrimary} />
          <Text variant="bodyMedium">가사 보기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  noCover: {
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  meta: {
    gap: spacing.xs,
  },
  description: {
    marginTop: spacing.sm,
  },
  actions: {
    marginTop: spacing.md,
  },
  lyricsButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
});
