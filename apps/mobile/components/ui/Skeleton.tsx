import { radius } from "@ongod/ui-tokens";
import { useEffect, useRef } from "react";
import { Animated, type DimensionValue } from "react-native";

import { theme } from "../../lib/theme";

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
}

/** 로딩 중 콘텐츠 자리를 표시하는 펄스 애니메이션 박스. 앨범 커버/텍스트 라인 등에 크기만 바꿔 재사용. */
export function Skeleton({ width = "100%", height = 16, borderRadius = radius.sm }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: theme.surfaceElevated,
        opacity,
      }}
    />
  );
}
