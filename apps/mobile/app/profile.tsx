import { Ionicons } from "@expo/vector-icons";
import { spacing } from "@ongod/ui-tokens";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "../components/ui/Button";
import { Text } from "../components/ui/Text";
import { useAuth } from "../lib/auth/AuthProvider";
import { signInWithApple, signInWithGoogle, signOut } from "../lib/auth/signIn";
import { theme } from "../lib/theme";

const APPLE_CANCELED_ERROR_CODE = "ERR_REQUEST_CANCELED";

// P2-S6: 로그인 화면. 게스트로 계속 쓸 수 있다는 걸 분명히 안내한다(SRS: "가입 강요 X").
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useAuth();
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code !== APPLE_CANCELED_ERROR_CODE) {
        Alert.alert("로그인에 실패했어요", error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xxl }]}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={16}
        style={styles.closeButton}
        accessibilityRole="button"
        accessibilityLabel="닫기"
      >
        <Ionicons name="close" size={24} color={theme.textPrimary} />
      </Pressable>

      <View style={styles.body}>
        {isLoading ? (
          <Text variant="body" color={theme.textSecondary}>
            불러오는 중...
          </Text>
        ) : user ? (
          <View style={styles.section}>
            <Text variant="title">
              {(user.user_metadata?.full_name as string | undefined) ?? user.email ?? "로그인됨"}
            </Text>
            <Text variant="caption" color={theme.textTertiary}>
              {user.app_metadata?.provider === "apple" ? "Apple 계정으로 로그인" : "Google 계정으로 로그인"}
            </Text>
            <Button label="로그아웃" variant="secondary" onPress={() => run(signOut)} disabled={busy} />
          </View>
        ) : (
          <View style={styles.section}>
            <Text variant="body" color={theme.textSecondary}>
              로그인하지 않아도 오늘의 곡과 가사는 계속 볼 수 있어요. 즐겨찾기 등 일부 기능만 로그인이 필요해요.
            </Text>
            {Platform.OS === "ios" ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={() => run(signInWithApple)}
              />
            ) : null}
            <Button label="Google로 계속하기" variant="secondary" onPress={() => run(signInWithGoogle)} disabled={busy} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: spacing.lg,
  },
  body: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  section: {
    gap: spacing.lg,
  },
  appleButton: {
    height: 48,
    width: "100%",
  },
});
