import { spacing } from "@ongod/ui-tokens";
import { StyleSheet, View } from "react-native";

import { theme } from "../../lib/theme";
import { Text } from "../ui/Text";

interface EmptyViewProps {
  message?: string;
}

/** P2-S3-T5: "오늘의 곡 없음"처럼 에러는 아니지만 보여줄 데이터가 없는 상태. */
export function EmptyView({ message = "오늘의 곡이 아직 준비되지 않았어요." }: EmptyViewProps) {
  return (
    <View style={styles.container}>
      <Text variant="body" color={theme.textSecondary} style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
    backgroundColor: theme.background,
  },
  message: {
    textAlign: "center",
  },
});
