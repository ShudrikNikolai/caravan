export interface StatsSnapshot {
  gamesPlayed: number;
  wins: number;
  losses: number;
  currentWinStreak: number;
  bestWinStreak: number;
  totalDurationSeconds: number;
  lastGameAt: Date | null;
}

export interface StatsView extends StatsSnapshot {
  winRate: number;
  averageDurationSeconds: number;
}

export function emptyStats(): StatsSnapshot {
  return {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
    totalDurationSeconds: 0,
    lastGameAt: null,
  };
}

export function applyGameToStats(
  stats: StatsSnapshot,
  won: boolean,
  durationSeconds: number,
  finishedAt: Date,
): StatsSnapshot {
  const next: StatsSnapshot = {
    ...stats,
    gamesPlayed: stats.gamesPlayed + 1,
    totalDurationSeconds: stats.totalDurationSeconds + durationSeconds,
    lastGameAt: finishedAt,
  };

  if (won) {
    next.wins += 1;
    next.currentWinStreak += 1;
    next.bestWinStreak = Math.max(next.bestWinStreak, next.currentWinStreak);
  } else {
    next.losses += 1;
    next.currentWinStreak = 0;
  }

  return next;
}

export function toStatsView(stats: StatsSnapshot): StatsView {
  return {
    ...stats,
    winRate:
      stats.gamesPlayed === 0
        ? 0
        : Math.round((stats.wins / stats.gamesPlayed) * 100),
    averageDurationSeconds:
      stats.gamesPlayed === 0
        ? 0
        : Math.round(stats.totalDurationSeconds / stats.gamesPlayed),
  };
}
