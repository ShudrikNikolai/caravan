'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Card, Spinner } from '@heroui/react';
import { useAuthStore } from '@/store/auth.store';

export default function HomePage() {
  const router = useRouter();
  const { user, status, fetchMe, logout } = useAuthStore();

  useEffect(() => {
    if (status === 'idle') fetchMe();
  }, [status, fetchMe]);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner aria-label="Загрузка" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <Card.Content className="flex flex-col items-center gap-3 py-8">
          <Avatar size="lg">
            <Avatar.Fallback>
              {user.username.slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar>
          <h1 className="text-xl font-semibold">Привет, {user.username}!</h1>
          {user.city && (
            <p className="text-default-500 text-sm">
              {user.city}
              {user.country ? `, ${user.country}` : ''}
            </p>
          )}
          <Button
            variant="danger"
            onPress={async () => {
              await logout();
              router.push('/login');
            }}
          >
            Выйти
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}
