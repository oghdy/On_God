import { radius, spacing } from "@ongod/ui-tokens";
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { theme } from "../../lib/theme";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: ButtonVariant;
  /** 스트리밍 브랜드 버튼(P2-S5)처럼 variant 기본값 대신 특정 색을 쓰고 싶을 때. */
  backgroundColor?: string;
  foregroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

const VARIANT_COLORS: Record<ButtonVariant, { background: string; foreground: string; borderColor?: string }> = {
  primary: { background: theme.accent, foreground: theme.accentText },
  secondary: { background: theme.surfaceElevated, foreground: theme.textPrimary, borderColor: theme.border },
  ghost: { background: "transparent", foreground: theme.accent },
};

export function Button({
  label,
  variant = "primary",
  backgroundColor,
  foregroundColor,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const variantColors = VARIANT_COLORS[variant];
  const background = backgroundColor ?? variantColors.background;
  const foreground = foregroundColor ?? variantColors.foreground;

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderColor: variantColors.borderColor,
          borderWidth: variantColors.borderColor ? StyleSheet.hairlineWidth : 0,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
      {...rest}
    >
      <Text variant="bodyMedium" color={foreground}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
});
