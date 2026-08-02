export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isRtl(locale: Locale) {
  return locale === "ar";
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr";
}
