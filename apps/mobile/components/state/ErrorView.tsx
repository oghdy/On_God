import { spacing } from "@ongod/ui-tokens";
import { StyleSheet, View } from "react-native";

import { theme } from "../../lib/theme";
import { Button } from "../ui/Button";
import { Text } from "../ui/Text";

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({ message = "문제가 발생했어요. 다시 시도해주세요.", onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Text variant="body" color={theme.textSecondary} style={styles.message}>
        {message}
      </Text>
      {onRetry ? <Button label="다시 시도" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xxl,
    backgroundColor: theme.background,
  },
  message: {
    textAlign: "center",
  },
});
