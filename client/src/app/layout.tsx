import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { isRTL } from '@heroui/react';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Caravan',
  description: 'App',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const acceptLanguage = (await headers()).get('accept-language');
  const lang = acceptLanguage?.split(/[,;]/)[0] || 'en-US';

  return (
    <html
      lang={lang}
      dir={isRTL(lang) ? 'rtl' : 'ltr'}
      className="dark"
      style={{ colorScheme: 'dark' }}
      suppressHydrationWarning
    >
      <body>
        <Providers lang={lang}>{children}</Providers>
      </body>
    </html>
  );
}
