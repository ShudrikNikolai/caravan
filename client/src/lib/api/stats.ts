import { request, requestPaginated } from './http';
import type { RecentGameDto, UserStatsDto } from './types';

export const statsApi = {
  me: () => request<UserStatsDto>('/stats/me'),

  forUser: (userId: string) => request<UserStatsDto>(`/stats/${userId}`),

  myGames: (page = 1, limit = 10) =>
    requestPaginated<RecentGameDto>(
      `/stats/me/games?page=${page}&limit=${limit}`,
    ),
};
