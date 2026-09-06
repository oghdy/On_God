import { describe, expect, it } from "vitest";

import { dark } from "./colors";
import { streaming } from "./streaming";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.x 대비비 공식. https://www.w3.org/TR/WCAG21/#contrast-minimum */
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

describe("dark theme", () => {
  it("모든 값이 6자리 hex 컬러다", () => {
    for (const [key, value] of Object.entries(dark)) {
      expect(value, `dark.${key}`).toMatch(HEX_COLOR);
    }
  });

  it("본문 텍스트로 쓰이는 색상은 배경 대비 WCAG AA(4.5:1) 이상이다 (P2-S7-T5)", () => {
    // textDisabled는 의도적으로 제외 — placeholder/비활성 상태 전용이라
    // WCAG 1.4.3의 inactive UI 컴포넌트 예외에 해당하고, 실제로 읽는 텍스트에는 안 쓴다.
    for (const key of ["textPrimary", "textSecondary", "textTertiary"] as const) {
      const ratio = contrastRatio(dark.background, dark[key]);
      expect(ratio, `${key} vs background = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("streaming brand colors", () => {
  it("appleMusic/spotify/youtube 세 플랫폼을 모두 정의한다", () => {
    expect(Object.keys(streaming).sort()).toEqual(["appleMusic", "spotify", "youtube"]);
  });

  it("background/foreground 모두 6자리 hex 컬러다", () => {
    for (const [platform, brand] of Object.entries(streaming)) {
      expect(brand.background, `${platform}.background`).toMatch(HEX_COLOR);
      expect(brand.foreground, `${platform}.foreground`).toMatch(HEX_COLOR);
    }
  });
});
