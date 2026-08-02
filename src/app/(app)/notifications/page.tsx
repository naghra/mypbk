"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/locale-provider";

type Notification = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  type: string;
};

export default function NotificationsPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Notification[]>([]);

  async function load() {
    const res = await fetch("/api/notifications");
    const json = await res.json();
    if (res.ok) setItems(json.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    void load();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
          {t("nav.notifications")}
        </h1>
        <Button variant="outline" onClick={() => void markAll()}>
          Mark all read
        </Button>
      </div>
      <ul className="mt-6 space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className={`rounded-3xl border px-4 py-4 ${
              n.isRead
                ? "border-emerald-100/60 bg-white/50 dark:border-emerald-950 dark:bg-slate-950/40"
                : "border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/40"
            }`}
          >
            <p className="font-semibold">{n.title}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{n.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
