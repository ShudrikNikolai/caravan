import { request, requestPaginated } from './http';
import type { GameStateDto, Room, RoomVisibility } from './types';

export const caravanApi = {
  createRoom: (visibility: RoomVisibility = 'private') =>
    request<Room>('/caravan/rooms', {
      method: 'POST',
      body: JSON.stringify({ visibility }),
    }),

  listPublicRooms: (page = 1, limit = 20) =>
    requestPaginated<Room>(`/caravan/rooms/public?page=${page}&limit=${limit}`),

  getRoom: (roomId: string) => request<Room>(`/caravan/rooms/${roomId}`),

  joinRoom: (roomId: string) =>
    request<Room>(`/caravan/rooms/${roomId}/join`, {
      method: 'POST',
    }),

  start: (roomId: string) =>
    request<GameStateDto>(`/caravan/rooms/${roomId}/start`, {
      method: 'POST',
    }),

  me: () => request<GameStateDto>('/caravan/me'),

  leave: () =>
    request<{ message: string; state: GameStateDto | null }>(
      '/caravan/me/leave',
      {
        method: 'POST',
      },
    ),
};
