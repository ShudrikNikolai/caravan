'use client';

import { I18nProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function Providers({
  lang,
  children,
}: {
  lang: string;
  children: React.ReactNode;
}) {
  return (
    <I18nProvider locale={lang}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </I18nProvider>
  );
}
