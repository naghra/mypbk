"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ProfileCard, type DiscoverProfile } from "@/components/discover/profile-card";
import { useI18n } from "@/components/providers/locale-provider";

export default function DiscoverPage() {
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [likesRemaining, setLikesRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/discover");
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error || t("common.error"));
      return;
    }
    setProfiles(json.data.profiles);
    setLikesRemaining(json.data.likesRemaining);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(action: "INTERESTED" | "SKIPPED") {
    const current = profiles[0];
    if (!current || busy) return;
    setBusy(true);
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: current.id, action }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(json.error || t("common.error"));
      return;
    }
    if (json.data.match) toast.success(t("matches.title"));
    setProfiles((prev) => prev.slice(1));
    if (action === "INTERESTED" && likesRemaining != null) {
      setLikesRemaining((v) => (v == null ? v : Math.max(0, v - 1)));
    }
    if (profiles.length <= 2) void load();
  }

  const current = profiles[0];

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
            {t("discover.title")}
          </h1>
          {likesRemaining != null && (
            <p className="mt-1 text-sm text-slate-500">{t("discover.likesLeft", { count: likesRemaining })}</p>
          )}
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">{t("common.loading")}</p>}

      {!loading && !current && (
        <div className="rounded-[2rem] border border-dashed border-emerald-200 p-10 text-center text-slate-500 dark:border-emerald-900">
          {t("discover.empty")}
        </div>
      )}

      <AnimatePresence mode="wait">
        {current && (
          <ProfileCard
            key={current.id}
            profile={current}
            disabled={busy}
            onInterested={() => void act("INTERESTED")}
            onSkip={() => void act("SKIPPED")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
