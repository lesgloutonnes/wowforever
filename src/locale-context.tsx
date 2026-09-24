import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, persistLocale, readStoredLocale, type ContentLocale } from "./locale";

const LocaleContext = createContext<ContentLocale>(DEFAULT_LOCALE);
const SetLocaleContext = createContext<(locale: ContentLocale) => void>(() => {});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<ContentLocale>(() =>
    typeof window === "undefined" ? DEFAULT_LOCALE : readStoredLocale(window.localStorage),
  );

  useEffect(() => {
    persistLocale(window.localStorage, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LocaleContext.Provider value={locale}>
      <SetLocaleContext.Provider value={setLocale}>{children}</SetLocaleContext.Provider>
    </LocaleContext.Provider>
  );
}

export function useLocale(): ContentLocale {
  return useContext(LocaleContext);
}

export function useSetLocale(): (locale: ContentLocale) => void {
  return useContext(SetLocaleContext);
}
