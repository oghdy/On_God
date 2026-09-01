// P2-S1-T2: anon 세션 클라이언트. RN에는 브라우저 localStorage가 없으므로 세션 영속을
// AsyncStorage로 대체하고, RN JS 엔진에 없는 URL/crypto polyfill을 먼저 로드한다
// (supabase-js가 내부적으로 fetch/URL을 쓴다 — 순서상 이 import가 가장 위에 와야 함).
import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAnonClient } from "@ongod/db";

import { clientEnv } from "../env";

export const supabase = createAnonClient(clientEnv.EXPO_PUBLIC_SUPABASE_URL, clientEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY, {
  storage: AsyncStorage,
});
