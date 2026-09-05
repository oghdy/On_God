import type { Song } from "@ongod/core";
import type { StreamingPlatform } from "@ongod/ui-tokens";
import { Linking } from "react-native";

interface StreamingLinkSet {
  /** 네이티브 앱을 직접 여는 커스텀 스킴 URL. 앱 미설치 시 `canOpenURL`이 false를 반환한다. */
  appScheme: string | null;
  /** 앱이 없거나 스킴 오픈이 실패했을 때 쓰는 웹 URL. */
  webUrl: string | null;
}

function buildLinkSet(platform: StreamingPlatform, song: Song): StreamingLinkSet {
  switch (platform) {
    case "appleMusic":
      // Apple Music 앱은 https://music.apple.com/... 과 동일한 경로를 music:// 스킴으로도 연다.
      return {
        appScheme: song.appleMusicUrl ? song.appleMusicUrl.replace(/^https:\/\//, "music://") : null,
        webUrl: song.appleMusicUrl,
      };
    case "spotify":
      return {
        appScheme: song.spotifyId ? `spotify:track:${song.spotifyId}` : null,
        webUrl: song.spotifyUrl,
      };
    case "youtube":
      return {
        appScheme: song.youtubeId ? `youtube://watch?v=${song.youtubeId}` : null,
        webUrl: song.youtubeUrl,
      };
  }
}

/** P2-S5-T3: 이 곡에 해당 플랫폼 링크가(앱 스킴이든 웹이든) 하나라도 있는지. 버튼을 렌더링할지 판단할 때 쓴다. */
export function hasStreamingLink(platform: StreamingPlatform, song: Song): boolean {
  const { appScheme, webUrl } = buildLinkSet(platform, song);
  return Boolean(appScheme || webUrl);
}

/**
 * P2-S5-T1: 앱 스킴으로 먼저 열어보고, 앱이 없거나(스킴 오픈 실패) 스킴 자체가 없으면
 * 웹 URL로 폴백한다. 둘 다 없으면 아무 것도 하지 않는다(호출 전에 `hasStreamingLink`로
 * 걸러지는 게 정상 — 이 함수는 방어적으로만 처리).
 */
export async function openStreamingLink(platform: StreamingPlatform, song: Song): Promise<void> {
  const { appScheme, webUrl } = buildLinkSet(platform, song);

  if (appScheme) {
    try {
      const canOpen = await Linking.canOpenURL(appScheme);
      if (canOpen) {
        await Linking.openURL(appScheme);
        return;
      }
    } catch {
      // canOpenURL/openURL 자체가 던져도 웹 폴백으로 넘어간다.
    }
  }

  if (webUrl) {
    await Linking.openURL(webUrl);
  }
}
