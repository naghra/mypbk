"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/providers/locale-provider";

type Item = {
  id: string;
  type: string;
  status: string;
  aiFakeScore?: number | null;
};

export default function VerificationPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Item[]>([]);

  async function load() {
    const res = await fetch("/api/verification");
    const json = await res.json();
    if (res.ok) setItems(json.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function upload(type: "GOVERNMENT_ID" | "SELFIE", file: File) {
    const fd = new FormData();
    fd.append("type", type);
    fd.append("file", file);
    const res = await fetch("/api/verification", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) toast.error(json.error || t("common.error"));
    else {
      toast.success(t("common.success"));
      void load();
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
        {t("nav.verification")}
      </h1>
      <p className="text-sm text-slate-500">
        Submit a government ID and a selfie for a verified badge. AI fake detection screens uploads automatically.
      </p>

      {(["GOVERNMENT_ID", "SELFIE"] as const).map((type) => (
        <div key={type} className="space-y-2 rounded-3xl border border-emerald-100/80 bg-white/80 p-5 dark:border-emerald-900 dark:bg-slate-950/70">
          <Label>{type === "GOVERNMENT_ID" ? "Government ID" : "Selfie verification"}</Label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(type, file);
            }}
          />
        </div>
      ))}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-2xl border border-emerald-100 px-4 py-3 dark:border-emerald-900">
            <span className="text-sm font-medium">{item.type}</span>
            <Badge variant={item.status === "APPROVED" ? "default" : item.status === "REJECTED" ? "gold" : "secondary"}>
              {item.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
