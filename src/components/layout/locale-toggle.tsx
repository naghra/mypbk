"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/locale-provider";

export function LocaleToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label="Switch language"
      onClick={() => setLocale(locale === "en" ? "ar" : "en")}
    >
      {locale === "en" ? "العربية" : "English"}
    </Button>
  );
}
