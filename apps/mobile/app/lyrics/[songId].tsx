import { Ionicons } from "@expo/vector-icons";
import { radius, spacing } from "@ongod/ui-tokens";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyView } from "../../components/state/EmptyView";
import { ErrorView } from "../../components/state/ErrorView";
import { LoadingView } from "../../components/state/LoadingView";
import { Tab, type TabOption } from "../../components/ui/Tab";
import { Text } from "../../components/ui/Text";
import { useSong } from "../../hooks/useSong";
import { useSongLyrics } from "../../hooks/useSongLyrics";
import { theme } from "../../lib/theme";

const TAB_OPTIONS: TabOption[] = [
  { key: "original", label: "원문" },
  { key: "translation", label: "해석" },
];

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// P2-S4: 가사 원문/해석 탭 전환 + sticky 헤더(P2-S4-T1/T2). 곡명·앨범 커버는
// `useSong`으로, 가사 본문은 `useSongLyrics`(P2-S1-T4에서 이미 만든 훅)로 각각 받는다 —
// DailyCard 화면(P2-S3)에서 곡 상세를 이미 한 번 가져오지만, 별도 화면(라우트)으로
// 넘어오면서 파라미터로 전체 객체를 실어 나르는 대신 훅으로 다시 가져오는 쪽을 택했다
// (쿼리 파라미터에 한글 제목·긴 URL을 인코딩해 넘기는 것보다 훨씬 안전하고, 캐시가
// 있으면 어차피 즉시 반환된다).
export default function LyricsScreen() {
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<string>("original");

  const songQuery = useSong(songId);
  const lyricsQuery = useSongLyrics(songId);

  const isPending = songQuery.isPending || lyricsQuery.isPending;
  const isError = songQuery.isError || lyricsQuery.isError;

  if (isPending) return <LoadingView />;
  if (isError) {
    const error = songQuery.error ?? lyricsQuery.error;
    return (
      <ErrorView
        message={error instanceof Error ? error.message : undefined}
        onRetry={() => {
          void songQuery.refetch();
          void lyricsQuery.refetch();
        }}
      />
    );
  }

  const song = songQuery.data;
  const lyrics = lyricsQuery.data;

  if (!song) return <EmptyView message="곡 정보를 찾을 수 없어요." />;

  const bodyText = activeTab === "original" ? lyrics?.originalText : lyrics?.koreanTranslation;
  const emptyBodyMessage = activeTab === "original" ? "원문 가사가 아직 없어요." : "한국어 해석이 아직 없어요.";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </Pressable>
        {song.albumCoverThumbnailUrl ? (
          <Image source={{ uri: song.albumCoverThumbnailUrl }} contentFit="cover" style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailFallback]}>
            <Ionicons name="musical-notes" size={16} color={theme.textDisabled} />
          </View>
        )}
        <Text variant="bodyMedium" numberOfLines={1} style={styles.headerTitle}>
          {song.title}
        </Text>
      </View>

      <View style={styles.tabWrapper}>
        <Tab options={TAB_OPTIONS} selectedKey={activeTab} onChange={setActiveTab} />
      </View>

      {!lyrics ? (
        <EmptyView message="가사가 아직 준비되지 않았어요." />
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}>
          {bodyText ? (
            <Text variant="body" style={styles.lyricsText}>
              {bodyText}
            </Text>
          ) : (
            <Text variant="body" color={theme.textSecondary}>
              {emptyBodyMessage}
            </Text>
          )}

          {activeTab === "translation" && lyrics.translationNotes ? (
            <View style={styles.notesBlock}>
              <Text variant="caption" color={theme.textTertiary}>
                번역 노트
              </Text>
              <Text variant="caption" color={theme.textSecondary} style={styles.notesText}>
                {lyrics.translationNotes}
              </Text>
            </View>
          ) : null}

          {lyrics.sourceUrl ? (
            <Pressable onPress={() => Linking.openURL(lyrics.sourceUrl!)} style={styles.source}>
              <Text variant="caption" color={theme.textTertiary}>
                가사 출처: {hostnameOf(lyrics.sourceUrl)}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  thumbnail: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
  },
  thumbnailFallback: {
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
  },
  tabWrapper: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  lyricsText: {
    lineHeight: 26,
  },
  notesBlock: {
    marginTop: spacing.xxl,
    gap: spacing.xs,
  },
  notesText: {
    fontStyle: "italic",
  },
  source: {
    marginTop: spacing.xxl,
    paddingVertical: spacing.sm,
  },
});
