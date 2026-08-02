"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocaleToggle } from "@/components/layout/locale-toggle";
import { useI18n } from "@/components/providers/locale-provider";

export default function SettingsPage() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    void fetch("/api/profiles")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.data) setVisible(j.data.isVisible);
      });
  }, []);

  async function saveVisibility(next: boolean) {
    setVisible(next);
    const res = await fetch("/api/profiles/visibility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: next }),
    });
    if (!res.ok) toast.error(t("common.error"));
    else toast.success(t("common.success"));
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
        {t("nav.settings")}
      </h1>

      <div className="space-y-4 rounded-[2rem] border border-emerald-100/80 bg-white/80 p-5 dark:border-emerald-900 dark:bg-slate-950/70">
        <div className="flex items-center justify-between">
          <Label>Theme</Label>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between">
          <Label>Language</Label>
          <LocaleToggle />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Profile visibility</Label>
            <p className="text-xs text-slate-500">Hide your profile from discovery</p>
          </div>
          <Switch checked={visible} onCheckedChange={(v) => void saveVisibility(v)} />
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/";
          }}
        >
          {t("nav.logout")}
        </Button>
      </div>
    </div>
  );
}
