import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

// P2-S1-T6: 쿼리 캐시 전체를 AsyncStorage에 영속화한다. 오프라인으로 앱을 열어도
// 마지막으로 성공했던 오늘의 곡/가사 응답이 그대로 렌더링된다 (query.gcTime이 지나면
// 자동으로 버려짐 — lib/query/client.ts 참고).
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "ongod-query-cache",
});
