"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/providers/locale-provider";

type Result = {
  id: string;
  nickname: string;
  age: number;
  city: string;
  country: string;
  occupation?: string | null;
  isVerified: boolean;
  compatibility: { total: number };
};

export default function SearchPage() {
  const { t } = useI18n();
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState<[number, number]>([21, 40]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        minAge: age[0],
        maxAge: age[1],
        countries: country ? [country] : [],
        cities: city ? [city] : [],
        educationLevels: [],
        maritalStatuses: [],
        religiousCommitments: [],
        languages: [],
        professions: [],
        page: 1,
        limit: 20,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error || t("common.error"));
      return;
    }
    setResults(json.data.results);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
        {t("search.title")}
      </h1>

      <div className="mt-6 space-y-4 rounded-[2rem] border border-emerald-100/80 bg-white/80 p-5 dark:border-emerald-900 dark:bg-slate-950/70">
        <h2 className="font-semibold">{t("search.filters")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>
        <div className="space-y-3">
          <Label>
            Age: {age[0]} – {age[1]}
          </Label>
          <Slider
            min={18}
            max={70}
            step={1}
            value={age}
            onValueChange={(v) => setAge([v[0] ?? 21, v[1] ?? 40])}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void search()} disabled={loading}>
            {t("search.apply")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCountry("");
              setCity("");
              setAge([21, 40]);
              setResults([]);
            }}
          >
            {t("search.reset")}
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {results.map((r) => (
          <Link
            key={r.id}
            href={`/discover`}
            className="flex items-center justify-between rounded-3xl border border-emerald-100/80 bg-white/80 px-4 py-4 dark:border-emerald-900 dark:bg-slate-950/70"
          >
            <div>
              <p className="font-semibold">
                {r.nickname}, {r.age} {r.isVerified && <Badge variant="verified">✓</Badge>}
              </p>
              <p className="text-sm text-slate-500">
                {r.city}, {r.country} · {r.occupation || "—"}
              </p>
            </div>
            <Badge variant="gold">{r.compatibility.total}%</Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
