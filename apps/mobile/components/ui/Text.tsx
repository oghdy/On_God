import { fontFamily, fontSize, lineHeight } from "@ongod/ui-tokens";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { theme } from "../../lib/theme";

export type TextVariant = "display" | "title" | "body" | "bodyMedium" | "caption";

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
}

const VARIANT_STYLE: Record<TextVariant, { fontFamily: string; fontSize: number; lineHeight: number }> = {
  display: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: fontSize.display,
    lineHeight: fontSize.display * lineHeight.tight,
  },
  title: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.tight,
  },
  body: {
    fontFamily: fontFamily.sansRegular,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  bodyMedium: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  caption: {
    fontFamily: fontFamily.sansRegular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
};

/** `@ongod/ui-tokens` 타이포그래피를 적용한 기본 Text. 폰트 미로딩 시에도 시스템 폰트로 정상 표시된다. */
export function Text({ variant = "body", color = theme.textPrimary, style, ...rest }: TextProps) {
  return <RNText style={[VARIANT_STYLE[variant], { color }, style]} {...rest} />;
}
