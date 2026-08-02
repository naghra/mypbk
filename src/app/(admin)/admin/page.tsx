"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminHomePage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    void fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setStats(j.data);
      });
  }, []);

  const cards = [
    ["users", "Users", "/admin/users"],
    ["matches", "Matches", "/admin/analytics"],
    ["openReports", "Open reports", "/admin/reports"],
    ["pendingVerifications", "Pending verifications", "/admin/verifications"],
    ["premium", "Premium", "/admin/subscriptions"],
    ["interestsToday", "Interests today", "/admin/analytics"],
  ] as const;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200">Admin</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([key, label, href]) => (
          <Link
            key={key}
            href={href}
            className="rounded-3xl border border-emerald-100/80 bg-white/80 p-5 dark:border-emerald-900 dark:bg-slate-950/70"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{stats?.[key] ?? "—"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
