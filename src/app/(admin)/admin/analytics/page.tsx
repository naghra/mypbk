"use client";

import { useEffect, useState } from "react";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    void fetch("/api/admin/analytics").then((r) => r.json()).then((j) => j.ok && setStats(j.data));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Analytics</h1>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        {stats &&
          Object.entries(stats).map(([k, v]) => (
            <div key={k} className="rounded-3xl border border-emerald-100/80 bg-white/80 p-5 dark:border-emerald-900 dark:bg-slate-950/70">
              <dt className="text-sm text-slate-500">{k}</dt>
              <dd className="mt-2 font-display text-3xl font-semibold">{v}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
