"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/locale-provider";

export default function PremiumPage() {
  const { t } = useI18n();
  const [tier, setTier] = useState<"FREE" | "PREMIUM">("FREE");

  useEffect(() => {
    void fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.data) setTier(j.data.tier);
      });
  }, []);

  async function upgrade() {
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: "PREMIUM" }),
    });
    const json = await res.json();
    if (!res.ok) toast.error(json.error || t("common.error"));
    else {
      setTier("PREMIUM");
      toast.success("Premium activated");
    }
  }

  const features = [
    t("premium.unlimitedLikes"),
    t("premium.seeLikes"),
    t("premium.advancedFilters"),
    t("premium.priority"),
    t("premium.readReceipts"),
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
        {t("premium.title")}
      </h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-[2rem] border border-emerald-100/80 bg-white/80 p-6 dark:border-emerald-900 dark:bg-slate-950/70">
          <h2 className="font-display text-2xl font-semibold">{t("premium.free")}</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>Limited daily interests</li>
            <li>Limited matches</li>
            <li>Basic discovery</li>
          </ul>
          <p className="mt-6 text-sm font-medium">{tier === "FREE" ? "Current plan" : ""}</p>
        </div>
        <div className="rounded-[2rem] border border-amber-300/60 bg-gradient-to-br from-amber-50 to-emerald-50 p-6 dark:from-amber-950/40 dark:to-emerald-950/40">
          <h2 className="font-display text-2xl font-semibold text-amber-800 dark:text-amber-200">
            {t("premium.premium")}
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" /> {f}
              </li>
            ))}
          </ul>
          <Button className="mt-6 w-full" variant="gold" onClick={() => void upgrade()} disabled={tier === "PREMIUM"}>
            {tier === "PREMIUM" ? "Active" : t("premium.cta")}
          </Button>
        </div>
      </div>
    </div>
  );
}
