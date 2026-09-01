import { ActivityIndicator, StyleSheet, View } from "react-native";

import { theme } from "../../lib/theme";

export function LoadingView() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.background,
  },
});
