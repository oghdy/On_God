// P2-S2-T1: SRS 4.1 — "다크모드 기본 지원, 가스펠 앨범 아트의 색감을 살리는 어두운 배경".
// MVP는 다크 테마 단일 지원이 목표라 `dark`만 채운다. 라이트 테마가 필요해지면 같은
// 키 구조로 `light` 객체를 추가하면 된다(컴포넌트 쪽 코드 변경 없이 확장 가능하도록
// 키 이름을 색상 값이 아니라 역할(semantic)로 지었다).
export interface ColorTheme {
  /** 화면 최상위 배경. 앨범 아트가 화면을 지배하는 레이아웃이라 순수 검정에 가깝게. */
  background: string;
  /** 카드 등 배경 위에 얹히는 1단계 표면. */
  surface: string;
  /** surface 위에 한 번 더 얹히는 표면(모달, 바텀시트 등). */
  surfaceElevated: string;
  /** 구분선 등 아주 옅은 경계. */
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  /** placeholder, disabled 등. */
  textDisabled: string;
  /** 링크·포커스·선택 상태 등에 쓰는 포인트 컬러. 스트리밍 브랜드 컬러(streaming.ts)와는 별개. */
  accent: string;
  accentText: string;
  error: string;
  success: string;
}

export const dark: ColorTheme = {
  background: "#0B0B0D",
  surface: "#151517",
  surfaceElevated: "#1E1E21",
  border: "#2A2A2E",
  textPrimary: "#F5F5F0",
  textSecondary: "#A3A3A8",
  textTertiary: "#6E6E73",
  textDisabled: "#4B4B4F",
  accent: "#E3B341",
  accentText: "#1A1400",
  error: "#E5484D",
  success: "#3DD68C",
};

export const colors = { dark };
