import { radius, spacing } from "@ongod/ui-tokens";
import { View, type ViewProps } from "react-native";

import { theme } from "../../lib/theme";

/** surface 위 1단계 표면 컨테이너. 앨범 커버 카드(P2-S3) 등 여러 화면에서 재사용. */
export function Card({ style, ...rest }: ViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: theme.border,
        },
        style,
      ]}
      {...rest}
    />
  );
}
