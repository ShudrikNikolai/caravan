'use client';

import { useFriendsSocket } from '@/lib/caravan-socket';
import { useAuthStore } from '@/store/auth.store';
import { ChallengeNotification } from './challenge-notification';

export function FriendsSocketProvider() {
  const user = useAuthStore((state) => state.user);
  useFriendsSocket(!!user);

  return <ChallengeNotification />;
}
