import { Pressable, StyleSheet, Text, View } from "react-native";

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

// P2-S1-T5: 최소 에러 상태. 스타일은 P2-S2에서 교체한다.
export function ErrorView({ message = "문제가 발생했어요. 다시 시도해주세요.", onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  message: {
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  retryText: {
    fontWeight: "600",
  },
});
