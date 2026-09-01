import { ActivityIndicator, StyleSheet, View } from "react-native";

// P2-S1-T5: 최소 로딩 상태. 실제 톤/컬러는 P2-S2(디자인 시스템)에서 packages/ui-tokens로
// 교체한다 — 지금은 화면이 "로딩 중임을 보여줄 수 있다"는 것만 보장한다.
export function LoadingView() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
