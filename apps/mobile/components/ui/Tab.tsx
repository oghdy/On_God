import { radius, spacing } from "@ongod/ui-tokens";
import { Pressable, StyleSheet, View } from "react-native";

import { theme } from "../../lib/theme";
import { Text } from "./Text";

export interface TabOption {
  key: string;
  label: string;
}

interface TabProps {
  options: TabOption[];
  selectedKey: string;
  onChange: (key: string) => void;
}

/** 세그먼트형 탭. P2-S4 가사 원문/해석 전환에서 재사용할 예정. */
export function Tab({ options, selectedKey, onChange }: TabProps) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = option.key === selectedKey;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text variant="bodyMedium" color={selected ? theme.textPrimary : theme.textSecondary}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: theme.surface,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  segmentSelected: {
    backgroundColor: theme.surfaceElevated,
  },
});
