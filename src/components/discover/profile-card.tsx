"use client";

import Image from "next/image";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { BadgeCheck, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/components/providers/locale-provider";

export type DiscoverProfile = {
  id: string;
  nickname: string;
  age: number;
  city: string;
  country: string;
  occupation?: string | null;
  bio?: string | null;
  interests: string[];
  religiousCommitment: string;
  prayerFrequency: string;
  isVerified: boolean;
  photos: { url: string }[];
  compatibility: { total: number; religious: number; interests: number };
};

export function ProfileCard({
  profile,
  onInterested,
  onSkip,
  disabled,
}: {
  profile: DiscoverProfile;
  onInterested: () => void;
  onSkip: () => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const photo = profile.photos[0]?.url;

  async function fling(dir: "left" | "right") {
    await animate(x, dir === "right" ? 420 : -420, { duration: 0.35 });
    if (dir === "right") onInterested();
    else onSkip();
    x.set(0);
  }

  return (
    <motion.article
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) void fling("right");
        else if (info.offset.x < -120) void fling("left");
      }}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-emerald-100/80 bg-white shadow-xl dark:border-emerald-900 dark:bg-slate-950"
      aria-label={`${profile.nickname}, ${profile.age}`}
    >
      <div className="relative aspect-[4/5] w-full bg-emerald-50 dark:bg-emerald-950">
        {photo ? (
          <Image src={photo} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 420px" priority />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-5xl text-emerald-700/40">
            {profile.nickname.slice(0, 1)}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent p-5 pt-24 text-white">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-3xl font-semibold">
              {profile.nickname}, {profile.age}
            </h2>
            {profile.isVerified && (
              <Badge variant="verified" className="gap-1">
                <BadgeCheck className="h-3.5 w-3.5" />
                {t("discover.verified")}
              </Badge>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-white/85">
            <MapPin className="h-3.5 w-3.5" />
            {profile.city}, {profile.country}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              {t("discover.compatibility")}
            </span>
            <span className="font-semibold">{profile.compatibility.total}%</span>
          </div>
          <Progress value={profile.compatibility.total} />
        </div>

        {profile.bio && <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{profile.bio}</p>}

        <div className="flex flex-wrap gap-2">
          {profile.interests.slice(0, 6).map((interest) => (
            <Badge key={interest} variant="secondary">
              {interest}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={disabled}
            onClick={() => void fling("left")}
            aria-label={t("discover.skip")}
          >
            {t("discover.skip")}
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={disabled}
            onClick={() => void fling("right")}
            aria-label={t("discover.interested")}
          >
            {t("discover.interested")}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
