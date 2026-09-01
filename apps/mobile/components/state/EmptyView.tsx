import { StyleSheet, Text, View } from "react-native";

interface EmptyViewProps {
  message?: string;
}

// P2-S1-T5 / P2-S3-T5: "오늘의 곡 없음"처럼 에러는 아니지만 보여줄 데이터가 없는 상태.
// 스타일은 P2-S2에서 교체한다.
export function EmptyView({ message = "오늘의 곡이 아직 준비되지 않았어요." }: EmptyViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  message: {
    textAlign: "center",
  },
});
