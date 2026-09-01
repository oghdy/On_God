// P2-S2-T3 / SRS 4.1: "스트리밍 버튼은 각 플랫폼 브랜드 컬러 유지 (Apple 흑백, Spotify 녹색,
// YouTube 적색)". P2-S5(딥링크 버튼)에서 그대로 쓴다.
export type StreamingPlatform = "appleMusic" | "spotify" | "youtube";

export interface StreamingBrand {
  /** 버튼 배경색. */
  background: string;
  /** 배경 위 텍스트/아이콘 색. */
  foreground: string;
}

// Apple은 공식 배지가 흑/백 모노톤이다. 앱이 다크 테마 기본이므로 배경 위에서 도드라지는
// 흰 배경 + 검정 전경을 기본값으로 쓴다.
const appleMusic: StreamingBrand = { background: "#FFFFFF", foreground: "#000000" };
const spotify: StreamingBrand = { background: "#1DB954", foreground: "#000000" };
const youtube: StreamingBrand = { background: "#FF0000", foreground: "#FFFFFF" };

export const streaming: Record<StreamingPlatform, StreamingBrand> = {
  appleMusic,
  spotify,
  youtube,
};
