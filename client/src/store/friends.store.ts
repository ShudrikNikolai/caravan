import { create } from 'zustand';

import type { Room } from '@/lib/api';

interface FriendsState {
  online: Record<string, boolean>;
  challenge: Room | null;
  version: number;
  setOnline: (userId: string, online: boolean) => void;
  setChallenge: (room: Room | null) => void;
  bumpVersion: () => void;
  reset: () => void;
}

export const useFriendsStore = create<FriendsState>((set) => ({
  online: {},
  challenge: null,
  version: 0,

  setOnline: (userId, online) =>
    set((state) => ({
      online: {
        ...state.online,
        [userId]: online,
      },
    })),

  setChallenge: (room) => set({ challenge: room }),

  bumpVersion: () => set((state) => ({ version: state.version + 1 })),

  reset: () => set({ online: {}, challenge: null, version: 0 }),
}));
