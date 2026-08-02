"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  isBanned: boolean;
  profile?: { nickname?: string | null } | null;
};

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);

  const load = useCallback(async (query = q) => {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (res.ok) setUsers(json.data);
  }, [q]);

  useEffect(() => {
    void load("");
  }, [load]);

  async function ban(userId: string, isBanned: boolean) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isBanned, banReason: isBanned ? "Policy violation" : null }),
    });
    if (!res.ok) toast.error("Failed");
    else {
      toast.success("Updated");
      void load();
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Users</h1>
      <div className="mt-4 flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email or nickname" />
        <Button onClick={() => void load()}>Search</Button>
      </div>
      <div className="mt-6 space-y-3">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-emerald-100/80 bg-white/80 p-4 dark:border-emerald-900 dark:bg-slate-950/70">
            <div>
              <p className="font-semibold">{u.profile?.nickname || u.email}</p>
              <p className="text-sm text-slate-500">{u.email} · {u.role}</p>
            </div>
            <div className="flex items-center gap-2">
              {u.isBanned ? <Badge variant="gold">Banned</Badge> : <Badge>Active</Badge>}
              <Button size="sm" variant={u.isBanned ? "outline" : "destructive"} onClick={() => void ban(u.id, !u.isBanned)}>
                {u.isBanned ? "Unban" : "Ban"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
