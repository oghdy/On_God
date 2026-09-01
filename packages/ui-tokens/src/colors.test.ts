import { describe, expect, it } from "vitest";

import { dark } from "./colors";
import { streaming } from "./streaming";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

describe("dark theme", () => {
  it("모든 값이 6자리 hex 컬러다", () => {
    for (const [key, value] of Object.entries(dark)) {
      expect(value, `dark.${key}`).toMatch(HEX_COLOR);
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
