import { toKstDateString } from "@ongod/core";
import { FlatList, View, useWindowDimensions } from "react-native";

import { DailyCard } from "../components/daily-card/DailyCard";
import { EmptyView } from "../components/state/EmptyView";
import { ErrorView } from "../components/state/ErrorView";
import { LoadingView } from "../components/state/LoadingView";
import { useRecentPicks } from "../hooks/useRecentPicks";
import type { PickWithSong } from "../lib/supabase/mapPick";

interface Page {
  key: string;
  pick: PickWithSong | null;
}

// P2-S3: 메인 피드. `useRecentPicks`로 최신순 픽 목록을 받아 가로 스와이프 페이저로 그린다
// (P2-S3-T4, MVP 범위: 최근 곡까지 — 날짜 아카이브 달력 뷰는 P1). index 0이 오늘 픽이면
// 그대로 첫 페이지, 아니면(P2-S3-T5) 안내 카드를 맨 앞에 끼워 넣어 오늘 픽이 없어도
// 스와이프로 최근 곡은 계속 볼 수 있게 한다.
export default function TodayScreen() {
  const { width } = useWindowDimensions();
  const { data, isPending, isError, error, refetch } = useRecentPicks();

  if (isPending) return <LoadingView />;
  if (isError) {
    return <ErrorView message={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />;
  }

  const picks = data ?? [];
  if (picks.length === 0) return <EmptyView />;

  const today = toKstDateString();
  const hasTodayPick = picks[0]?.dailyPick.pickDate === today;

  const pages: Page[] = hasTodayPick
    ? picks.map((pick) => ({ key: pick.dailyPick.id, pick }))
    : [{ key: "no-today-pick", pick: null }, ...picks.map((pick) => ({ key: pick.dailyPick.id, pick }))];

  return (
    <FlatList
      data={pages}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      keyExtractor={(page) => page.key}
      renderItem={({ item }) => <View style={{ width }}>{item.pick ? <DailyCard pick={item.pick} /> : <EmptyView />}</View>}
    />
  );
}
