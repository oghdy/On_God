// P2-S6-T1/T2: Apple/Google 로그인.
//
// 왜 둘이 방식이 다른가 — Google은 브라우저 기반 OAuth(`signInWithOAuth` +
// `expo-web-browser`)를 쓰고, Apple은 네이티브 SDK(`expo-apple-authentication`)를 쓴다.
// 네이티브 SDK는 둘 다(Apple/Google) 사실 네이티브 모듈이라 Expo Go에서 아예 실행이 안
// 되는데, Google 쪽은 Supabase가 지원하는 브라우저 기반 흐름으로 대체하면 Expo Go에서도
// 그대로 되고(EAS 빌드 전인 지금 바로 검증 가능), Apple은 네이티브 Sign in with Apple
// 버튼 자체가 필수라 이 방식으로는 대체가 안 된다 — 그래서 Apple은 EAS 빌드 이후에나
// 실기기/시뮬레이터 종단 검증이 가능하다(frontend-log 참고).
import * as AppleAuthentication from "expo-apple-authentication";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { track } from "../analytics/track";
import { supabase } from "../supabase/client";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = Linking.createURL("/");

async function completeSessionFromRedirectUrl(url: string): Promise<void> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const { code } = params;
  if (!code) return; // 콜백 URL에 code가 없음 — 정상적으로는 안 일어나지만 방어적으로 무시

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
}

/** 시스템 브라우저(ASWebAuthenticationSession 등)로 Google OAuth 동의 화면을 띄운다. */
export async function signInWithGoogle(): Promise<void> {
  track({ name: "login_attempted", properties: { provider: "google" } });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Supabase가 Google OAuth URL을 반환하지 않음");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === "success") {
    await completeSessionFromRedirectUrl(result.url);
    track({ name: "login_succeeded", properties: { provider: "google" } });
  }
  // result.type이 "cancel"/"dismiss"면 사용자가 취소한 것 — 에러 아님, 조용히 반환.
}

/** 네이티브 Sign in with Apple 버튼 → identityToken을 Supabase에 넘겨 세션 발급. */
export async function signInWithApple(): Promise<void> {
  track({ name: "login_attempted", properties: { provider: "apple" } });

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error("Apple이 identityToken을 반환하지 않음");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw error;
  track({ name: "login_succeeded", properties: { provider: "apple" } });
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  track({ name: "logout", properties: {} });
}
