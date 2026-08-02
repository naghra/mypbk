"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Report = {
  id: string;
  reason: string;
  status: string;
  description?: string | null;
  reporter?: { email: string } | null;
  reported?: { email: string } | null;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);

  async function load() {
    const res = await fetch("/api/admin/reports");
    const json = await res.json();
    if (res.ok) setReports(json.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function resolve(id: string, status: "RESOLVED" | "DISMISSED") {
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, resolution: status }),
    });
    if (!res.ok) toast.error("Failed");
    else {
      toast.success("Updated");
      void load();
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Reports</h1>
      <div className="mt-6 space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="rounded-3xl border border-emerald-100/80 bg-white/80 p-4 dark:border-emerald-900 dark:bg-slate-950/70">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{r.reason}</p>
              <Badge>{r.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {r.reporter?.email} → {r.reported?.email}
            </p>
            <p className="mt-1 text-sm">{r.description}</p>
            {r.status === "OPEN" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => void resolve(r.id, "RESOLVED")}>Resolve</Button>
                <Button size="sm" variant="outline" onClick={() => void resolve(r.id, "DISMISSED")}>Dismiss</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
