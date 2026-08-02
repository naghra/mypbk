import Link from "next/link";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/locale";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <div className="relative min-h-[100svh] pattern-mesh">
      <div className="mx-auto flex min-h-[100svh] max-w-6xl flex-col px-4 py-8 sm:px-6">
        <Link href="/" className="mb-10 font-display text-3xl font-semibold text-emerald-700 dark:text-emerald-300">
          {dict.brand}
        </Link>
        <div className="flex flex-1 items-center justify-center pb-10">{children}</div>
      </div>
    </div>
  );
}
