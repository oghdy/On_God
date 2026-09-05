// P2-S1-T3: 쿼리 키를 한곳에 모아 오타/불일치를 막는다.
export const queryKeys = {
  dailyPick: {
    today: () => ["dailyPick", "today"] as const,
    recent: (limit: number) => ["dailyPick", "recent", limit] as const,
  },
  lyrics: {
    bySong: (songId: string) => ["lyrics", "bySong", songId] as const,
  },
};
