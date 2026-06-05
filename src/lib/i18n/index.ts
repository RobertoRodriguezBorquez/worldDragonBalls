import es from "./es.json";
import en from "./en.json";

export type Locale = "es" | "en";
export const locales: Locale[] = ["es", "en"];
export const defaultLocale: Locale = "es";

const dictionaries = { es, en } as const;

export type Dictionary = typeof es;

export function getDictionary(locale: Locale): Dictionary {
  return (dictionaries[locale] ?? dictionaries[defaultLocale]) as Dictionary;
}

/**
 * Resuelve la locale desde un pathname (/en/... => "en", resto => defaultLocale)
 */
export function getLocaleFromUrl(url: URL): Locale {
  const [, first] = url.pathname.split("/");
  if (first && (locales as string[]).includes(first)) {
    return first as Locale;
  }
  return defaultLocale;
}

/**
 * t() helper con soporte de placeholders {name}
 */
export function t(dict: Dictionary, key: string, vars?: Record<string, string>): string {
  const parts = key.split(".");
  let value: any = dict;
  for (const p of parts) {
    value = value?.[p];
    if (value === undefined) return key;
  }
  if (typeof value !== "string") return key;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}
