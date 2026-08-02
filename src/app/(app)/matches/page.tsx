"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useI18n } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type MatchItem = {
  id: string;
  compatibilityScore?: number | null;
  user: {
    id: string;
    nickname?: string | null;
    age?: number | null;
    city?: string | null;
    isVerified?: boolean;
    photo?: string | null;
  };
  lastMessage?: { content: string } | null;
};

export default function MatchesPage() {
  const { t } = useI18n();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/matches");
      const json = await res.json();
      setLoading(false);
      if (res.ok) setMatches(json.data);
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
        {t("matches.title")}
      </h1>

      {loading && <p className="mt-6 text-sm text-slate-500">{t("common.loading")}</p>}
      {!loading && matches.length === 0 && (
        <p className="mt-8 text-slate-500">{t("matches.empty")}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {matches.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="overflow-hidden rounded-3xl border border-emerald-100/80 bg-white/80 dark:border-emerald-900 dark:bg-slate-950/70"
          >
            <div className="relative h-40 bg-emerald-50 dark:bg-emerald-950">
              {m.user.photo ? (
                <Image src={m.user.photo} alt="" fill className="object-cover" sizes="320px" />
              ) : null}
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-semibold">
                    {m.user.nickname}
                    {m.user.age ? `, ${m.user.age}` : ""}
                  </h2>
                  <p className="text-sm text-slate-500">{m.user.city}</p>
                </div>
                {m.compatibilityScore != null && (
                  <Badge variant="gold">{Math.round(m.compatibilityScore)}%</Badge>
                )}
              </div>
              {m.lastMessage && (
                <p className="line-clamp-2 text-sm text-slate-500">{m.lastMessage.content}</p>
              )}
              <Button asChild className="w-full">
                <Link href={`/messages/${m.id}`}>{t("matches.message")}</Link>
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
