"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/locale-provider";

export default function VerifyPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-md rounded-[2rem] border border-emerald-100/80 bg-white/90 p-8 text-center shadow-xl dark:border-emerald-900 dark:bg-slate-950/80">
      <h1 className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
        {t("auth.verifyEmail")}
      </h1>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{t("auth.verifyEmailBody")}</p>
      <Button asChild className="mt-6">
        <Link href="/login">{t("nav.login")}</Link>
      </Button>
    </div>
  );
}
