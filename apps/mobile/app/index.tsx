import { spacing } from "@ongod/ui-tokens";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyView } from "../components/state/EmptyView";
import { ErrorView } from "../components/state/ErrorView";
import { LoadingView } from "../components/state/LoadingView";
import { Text } from "../components/ui/Text";
import { useTodayPick } from "../hooks/useTodayPick";
import { theme } from "../lib/theme";

// P2-S1: 실제 Daily Card UI는 P2-S3에서 만든다. 지금은 오늘의 곡이 화면까지 나오는지
// (Supabase 연결 → TanStack Query → 도메인 훅 → 디자인 토큰) 검증하는 최소 화면.
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { data, isPending, isError, error, refetch } = useTodayPick();

  if (isPending) return <LoadingView />;
  if (isError) {
    return <ErrorView message={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />;
  }
  if (!data) return <EmptyView />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text variant="display" style={styles.title}>
        {data.song.title}
      </Text>
      <Text variant="body" color={theme.textSecondary}>
        {data.song.artist}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: theme.background,
    paddingHorizontal: spacing.xxl,
  },
  title: {
    textAlign: "center",
  },
});
