import { cookies, headers } from "next/headers";
import { defaultLocale, type Locale, locales } from "./config";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("mithaq-locale")?.value;
  if (fromCookie && locales.includes(fromCookie as Locale)) {
    return fromCookie as Locale;
  }
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.startsWith("ar") ? "ar" : defaultLocale;
}
