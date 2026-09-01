// P2-S2-T1 / P2-S2-T4: 폰트 패밀리 이름은 `apps/mobile`이 `expo-font`로 실제 로드하는
// 이름과 정확히 일치해야 한다(RN 커스텀 폰트는 굵기별로 별도 family). 무료 Google Fonts —
// 본문/UI는 Inter(가독성), 곡명 등 디스플레이는 Fraunces(가스펠 특유의 따뜻함·개성) — 를
// 쓴다. 유료 폰트로 바꾸고 싶다면 이 값들과 로딩 설정(`apps/mobile/lib/fonts.ts`)만
// 같이 바꾸면 된다.
export const fontFamily = {
  sansRegular: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemiBold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
  displayRegular: "Fraunces_400Regular",
  displaySemiBold: "Fraunces_600SemiBold",
};

/** 폰트 로딩 전(시스템 폰트 폴백) 굵기 근사치로도 쓴다. */
export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};
