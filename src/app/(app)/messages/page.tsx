"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/providers/locale-provider";

type MatchItem = {
  id: string;
  user: { nickname?: string | null; photo?: string | null };
  lastMessage?: { content: string; createdAt: string } | null;
};

export default function MessagesIndexPage() {
  const { t } = useI18n();
  const [matches, setMatches] = useState<MatchItem[]>([]);

  useEffect(() => {
    void fetch("/api/matches")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setMatches(j.data);
      });
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
        {t("messages.title")}
      </h1>
      {matches.length === 0 ? (
        <p className="mt-8 text-slate-500">{t("messages.empty")}</p>
      ) : (
        <ul className="mt-6 divide-y divide-emerald-100 overflow-hidden rounded-3xl border border-emerald-100/80 bg-white/80 dark:divide-emerald-900 dark:border-emerald-900 dark:bg-slate-950/70">
          {matches.map((m) => (
            <li key={m.id}>
              <Link href={`/messages/${m.id}`} className="flex items-center gap-3 px-4 py-4 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 font-display text-lg text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  {(m.user.nickname ?? "?").slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{m.user.nickname}</p>
                  <p className="truncate text-sm text-slate-500">
                    {m.lastMessage?.content ?? t("messages.placeholder")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
