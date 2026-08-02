"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/locale-provider";

export default function ProfilePage() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<{
    nickname: string;
    isVerified: boolean;
    isComplete: boolean;
    city: string;
    country: string;
    occupation?: string | null;
    bio?: string | null;
    lookingFor?: string | null;
    interests: string[];
    religiousCommitment: string;
    prayerFrequency: string;
  } | null>(null);

  useEffect(() => {
    void fetch("/api/profiles")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setProfile(j.data);
      });
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
          {t("profile.title")}
        </h1>
        <Button asChild>
          <Link href="/profile/edit">{t("profile.edit")}</Link>
        </Button>
      </div>

      {!profile && (
        <p className="mt-8 text-slate-500">{t("profile.completePrompt")}</p>
      )}

      {profile && (
        <div className="mt-6 space-y-5 rounded-[2rem] border border-emerald-100/80 bg-white/80 p-6 dark:border-emerald-900 dark:bg-slate-950/70">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-semibold">{profile.nickname}</h2>
            {profile.isVerified && <Badge variant="verified">{t("discover.verified")}</Badge>}
            {!profile.isComplete && <Badge variant="gold">Incomplete</Badge>}
          </div>
          <p className="text-sm text-slate-500">
            {profile.city}, {profile.country} · {profile.occupation || "—"}
          </p>
          <div>
            <h3 className="font-semibold">{t("profile.bio")}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{profile.bio || "—"}</p>
          </div>
          <div>
            <h3 className="font-semibold">{t("profile.lookingFor")}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{profile.lookingFor || "—"}</p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">{t("profile.interests")}</h3>
            <div className="flex flex-wrap gap-2">
              {(profile.interests || []).map((i: string) => (
                <Badge key={i} variant="secondary">{i}</Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">{t("profile.religious")}</p>
              <p className="font-medium">{profile.religiousCommitment}</p>
            </div>
            <div>
              <p className="text-slate-500">{t("profile.prayer")}</p>
              <p className="font-medium">{profile.prayerFrequency}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
