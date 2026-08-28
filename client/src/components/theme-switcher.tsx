'use client';

import { Button } from '@heroui/react';
import { useTheme } from 'next-themes';

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme, theme } = useTheme();

  const activeTheme = theme === 'system' ? resolvedTheme : theme;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={activeTheme === 'light' ? 'primary' : 'secondary'}
        onPress={() => setTheme('light')}
      >
        Light
      </Button>
      <Button
        variant={activeTheme === 'dark' ? 'primary' : 'secondary'}
        onPress={() => setTheme('dark')}
      >
        Dark
      </Button>
      <Button
        variant={theme === 'system' ? 'primary' : 'secondary'}
        onPress={() => setTheme('system')}
      >
        System
      </Button>
    </div>
  );
}
