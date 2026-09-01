// P2-S2: MVP는 다크 테마만 지원한다(SRS 4.1). 라이트 테마가 필요해지면 여기서
// 시스템 설정(`useColorScheme`)에 따라 `colors.light`/`colors.dark`를 고르는 걸로
// 바꾸면 되고, `components/ui/*`는 전부 이 `theme` 값 하나만 참조하므로 변경 지점이 여기 하나로 끝난다.
import { colors } from "@ongod/ui-tokens";

export const theme = colors.dark;
