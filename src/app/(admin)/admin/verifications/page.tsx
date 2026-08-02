"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type VerificationItem = {
  id: string;
  type: string;
  status: string;
  aiFakeScore?: number | null;
  user?: {
    email: string;
    profile?: { fullName?: string | null } | null;
  } | null;
};

export default function AdminVerificationsPage() {
  const [items, setItems] = useState<VerificationItem[]>([]);

  async function load() {
    const res = await fetch("/api/admin/verifications");
    const json = await res.json();
    if (res.ok) setItems(json.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    const res = await fetch("/api/admin/verifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, notes: status }),
    });
    if (!res.ok) toast.error("Failed");
    else {
      toast.success("Updated");
      void load();
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Verifications</h1>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl border border-emerald-100/80 bg-white/80 p-4 dark:border-emerald-900 dark:bg-slate-950/70">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{item.user?.profile?.fullName || item.user?.email}</p>
                <p className="text-sm text-slate-500">{item.type} · AI score {item.aiFakeScore ?? "—"}</p>
              </div>
              <Badge>{item.status}</Badge>
            </div>
            {item.status === "PENDING" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => void review(item.id, "APPROVED")}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => void review(item.id, "REJECTED")}>Reject</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
