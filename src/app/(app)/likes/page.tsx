"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/locale-provider";

export default function LikesPage() {
  const { t } = useI18n();
  const [likes, setLikes] = useState<{
    id: string;
    nickname?: string | null;
    age?: number | null;
    city?: string | null;
  }[]>([]);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    void fetch("/api/likes")
      .then(async (r) => {
        const j = await r.json();
        if (r.status === 402) setLocked(true);
        else if (j.ok) setLikes(j.data);
        else toast.error(j.error);
      });
  }, []);

  if (locked) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-3xl font-semibold">{t("nav.likes")}</h1>
        <p className="mt-4 text-slate-500">{t("premium.seeLikes")}</p>
        <Button asChild className="mt-6">
          <Link href="/premium">{t("premium.cta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
        {t("nav.likes")}
      </h1>
      <ul className="mt-6 space-y-3">
        {likes.map((l) => (
          <li key={l.id} className="flex items-center justify-between rounded-3xl border border-emerald-100/80 bg-white/80 px-4 py-4 dark:border-emerald-900 dark:bg-slate-950/70">
            <div>
              <p className="font-semibold">
                {l.nickname}{l.age ? `, ${l.age}` : ""}
              </p>
              <p className="text-sm text-slate-500">{l.city}</p>
            </div>
            <Button asChild size="sm">
              <Link href="/discover">{t("discover.interested")}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
