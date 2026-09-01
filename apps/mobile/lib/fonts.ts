// P2-S2-T4: 무료 Google Fonts 로딩. `@ongod/ui-tokens`의 `fontFamily` 값과 정확히
// 일치해야 한다 — 여기서 굵기를 추가/삭제하면 토큰 쪽도 같이 바꿔라.
import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";

export function useAppFonts() {
  return useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Fraunces_400Regular,
    Fraunces_600SemiBold,
  });
}
