"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { dirFor, type Locale } from "@/lib/i18n/config";
import { t as translate } from "@/lib/i18n/get-dictionary";

type LocaleContextValue = {
  locale: Locale;
  dict: Dictionary;
  dir: "rtl" | "ltr";
  t: (path: string, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  const [, startTransition] = useTransition();

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `mithaq-locale=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    document.documentElement.lang = next;
    document.documentElement.dir = dirFor(next);
    startTransition(() => {
      window.location.reload();
    });
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dict,
      dir: dirFor(locale),
      t: (path, vars) => translate(dict, path, vars),
      setLocale,
    }),
    [locale, dict, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
