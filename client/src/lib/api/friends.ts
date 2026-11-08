import { request } from './http';
import type { FriendView, PublicUser, Room } from './types';

export const friendsApi = {
  searchUsers: (query: string) =>
    request<PublicUser[]>(`/users/search?q=${encodeURIComponent(query)}`),

  list: () => request<FriendView[]>('/friends'),

  incoming: () => request<FriendView[]>('/friends/requests/incoming'),

  outgoing: () => request<FriendView[]>('/friends/requests/outgoing'),

  sendRequest: (addresseeId: string) =>
    request<{ id: string }>('/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ addresseeId }),
    }),

  acceptRequest: (friendshipId: string) =>
    request<{ id: string }>(`/friends/requests/${friendshipId}/accept`, {
      method: 'POST',
    }),

  declineRequest: (friendshipId: string) =>
    request<{ message: string }>(`/friends/requests/${friendshipId}/decline`, {
      method: 'POST',
    }),

  remove: (userId: string) =>
    request<{ message: string }>(`/friends/${userId}`, {
      method: 'DELETE',
    }),

  challenge: (userId: string) =>
    request<Room>(`/friends/${userId}/challenge`, {
      method: 'POST',
    }),

  acceptChallenge: (roomId: string) =>
    request<Room>(`/friends/challenges/${roomId}/accept`, {
      method: 'POST',
    }),

  declineChallenge: (roomId: string) =>
    request<{ message: string }>(`/friends/challenges/${roomId}/decline`, {
      method: 'POST',
    }),
};
