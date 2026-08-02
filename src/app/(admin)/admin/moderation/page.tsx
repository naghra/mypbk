"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ModerationData = {
  pendingPhotos: { id: string; url: string }[];
  flaggedMessages: {
    id: string;
    content: string;
    moderationStatus: string;
    sender?: { email: string } | null;
  }[];
  suspiciousProfiles: {
    id: string;
    nickname: string;
    fakeScore: number | null;
    user?: { email: string } | null;
  }[];
};

export default function AdminModerationPage() {
  const [data, setData] = useState<ModerationData | null>(null);

  async function load() {
    const res = await fetch("/api/admin/moderation");
    const json = await res.json();
    if (res.ok) setData(json.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function approvePhoto(photoId: string, approved: boolean) {
    const res = await fetch("/api/admin/moderation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId, approved }),
    });
    if (!res.ok) toast.error("Failed");
    else {
      toast.success("Updated");
      void load();
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-semibold">Content moderation</h1>

      <section>
        <h2 className="font-semibold">Pending photos</h2>
        <div className="mt-3 space-y-2">
          {(data?.pendingPhotos || []).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl border border-emerald-100 px-4 py-3 dark:border-emerald-900">
              <span className="truncate text-sm">{p.url}</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void approvePhoto(p.id, true)}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => void approvePhoto(p.id, false)}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Flagged messages</h2>
        <div className="mt-3 space-y-2">
          {(data?.flaggedMessages || []).map((m) => (
            <div key={m.id} className="rounded-2xl border border-emerald-100 px-4 py-3 text-sm dark:border-emerald-900">
              <p className="font-medium">{m.sender?.email} · {m.moderationStatus}</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">{m.content}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Suspicious profiles</h2>
        <div className="mt-3 space-y-2">
          {(data?.suspiciousProfiles || []).map((p) => (
            <div key={p.id} className="rounded-2xl border border-emerald-100 px-4 py-3 text-sm dark:border-emerald-900">
              {p.nickname} · fake score {p.fakeScore} · {p.user?.email}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
