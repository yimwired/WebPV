"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { dictionary, type Locale } from "./dictionary";

const STORAGE_KEY = "webpv-locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (typeof dictionary)[Locale];
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

// The locale lives in a module-level store rather than component state because
// its real source (localStorage / navigator) exists only on the client. That
// makes it external state, which is what useSyncExternalStore is for: React
// renders the server snapshot during hydration and swaps to the client value
// itself, with no setState inside an effect and no cascading render.
//
// Safe as module scope because the site is a static export — there is no
// server request whose state could leak into another's.

let clientLocale: Locale | null = null;
const listeners = new Set<() => void>();

function readPreferredLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "th") return saved;
    return navigator.language.toLowerCase().startsWith("th") ? "th" : "en";
  } catch {
    // Private mode or a blocked storage partition — fall back to the default.
    return "en";
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

// Must return a cached value: recomputing on every call would make React see a
// changing snapshot and re-render forever.
function getSnapshot(): Locale {
  if (clientLocale === null) clientLocale = readPreferredLocale();
  return clientLocale;
}

function getServerSnapshot(): Locale {
  return "en";
}

function writeLocale(next: Locale) {
  clientLocale = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Persisting is best-effort; the in-memory value still drives this session.
  }
  for (const onChange of listeners) onChange();
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale: writeLocale, t: dictionary[locale] }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used inside <LocaleProvider>");
  }
  return ctx;
}
