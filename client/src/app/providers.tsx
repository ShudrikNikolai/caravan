'use client';

import { useEffect } from 'react';
import { I18nProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { FriendsSocketProvider } from '@/components/friends-socket-provider';
import { stripSensitiveQuery } from '@/lib/security';

export function Providers({
  lang,
  children,
}: {
  lang: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    stripSensitiveQuery();
  }, []);

  return (
    <I18nProvider locale={lang}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <FriendsSocketProvider />
        {children}
      </NextThemesProvider>
    </I18nProvider>
  );
}
