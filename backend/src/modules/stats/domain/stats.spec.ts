import { applyGameToStats, emptyStats, toStatsView } from './stats';

describe('stats domain', () => {
  it('starts with empty aggregates', () => {
    expect(emptyStats()).toEqual({
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      currentWinStreak: 0,
      bestWinStreak: 0,
      totalDurationSeconds: 0,
      lastGameAt: null,
    });
  });

  it('tracks wins and the best win streak', () => {
    const finishedAt = new Date('2026-01-01T00:00:00.000Z');
    let stats = emptyStats();

    stats = applyGameToStats(stats, true, 60, finishedAt);
    stats = applyGameToStats(stats, true, 120, finishedAt);

    expect(stats.gamesPlayed).toBe(2);
    expect(stats.wins).toBe(2);
    expect(stats.currentWinStreak).toBe(2);
    expect(stats.bestWinStreak).toBe(2);
    expect(stats.totalDurationSeconds).toBe(180);
  });

  it('resets the current streak after a loss', () => {
    const finishedAt = new Date('2026-01-01T00:00:00.000Z');
    let stats = applyGameToStats(emptyStats(), true, 60, finishedAt);

    stats = applyGameToStats(stats, false, 30, finishedAt);

    expect(stats.currentWinStreak).toBe(0);
    expect(stats.bestWinStreak).toBe(1);
    expect(stats.losses).toBe(1);
  });

  it('computes win rate and average duration', () => {
    const finishedAt = new Date('2026-01-01T00:00:00.000Z');
    let stats = applyGameToStats(emptyStats(), true, 100, finishedAt);
    stats = applyGameToStats(stats, false, 200, finishedAt);

    expect(toStatsView(stats).winRate).toBe(50);
    expect(toStatsView(stats).averageDurationSeconds).toBe(150);
  });

  it('returns zeroed rates for an empty profile', () => {
    expect(toStatsView(emptyStats()).winRate).toBe(0);
    expect(toStatsView(emptyStats()).averageDurationSeconds).toBe(0);
  });
});
