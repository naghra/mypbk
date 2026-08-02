import type { Locale } from "./config";

const dictionaries = {
  en: () => import("@/messages/en.json").then((m) => m.default),
  ar: () => import("@/messages/ar.json").then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["en"]>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}

export function t(
  dict: Dictionary,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in cur) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  if (typeof cur !== "string") return path;
  if (!vars) return cur;
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    cur,
  );
}
