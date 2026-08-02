"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useI18n } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { LocaleToggle } from "./locale-toggle";

export function SiteHeader() {
  const { t } = useI18n();
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="font-display text-3xl font-semibold text-white drop-shadow-sm sm:text-4xl">
            {t("brand")}
          </Link>
        </motion.div>
        <div className="flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex">
            <Link href="/login">{t("nav.login")}</Link>
          </Button>
          <Button asChild variant="soft">
            <Link href="/register">{t("nav.register")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
