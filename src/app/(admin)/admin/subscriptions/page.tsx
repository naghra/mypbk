"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Sub = {
  id: string;
  userId: string;
  tier: "FREE" | "PREMIUM";
  likesRemaining: number;
  user?: { email: string } | null;
};

export default function AdminSubscriptionsPage() {
  const [items, setItems] = useState<Sub[]>([]);

  async function load() {
    const res = await fetch("/api/admin/subscriptions");
    const json = await res.json();
    if (res.ok) setItems(json.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function setTier(userId: string, tier: "FREE" | "PREMIUM") {
    const res = await fetch("/api/admin/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, tier, status: "ACTIVE" }),
    });
    if (!res.ok) toast.error("Failed");
    else {
      toast.success("Updated");
      void load();
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Subscriptions</h1>
      <div className="mt-6 space-y-3">
        {items.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-emerald-100/80 bg-white/80 p-4 dark:border-emerald-900 dark:bg-slate-950/70">
            <div>
              <p className="font-semibold">{s.user?.email}</p>
              <p className="text-sm text-slate-500">Likes left: {s.likesRemaining}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={s.tier === "PREMIUM" ? "gold" : "secondary"}>{s.tier}</Badge>
              <Button size="sm" variant="outline" onClick={() => void setTier(s.userId, s.tier === "PREMIUM" ? "FREE" : "PREMIUM")}>
                Toggle
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
