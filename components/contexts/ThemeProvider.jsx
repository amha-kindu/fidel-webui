"use client";

import { useMemo } from "react";
import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from "next-themes";

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
      storageKey="theme"
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const { resolvedTheme, setTheme, theme } = useNextTheme();

  return useMemo(
    () => ({
      resolvedTheme: resolvedTheme ?? "light",
      setTheme,
      theme: theme ?? "system",
    }),
    [resolvedTheme, setTheme, theme]
  );
}
