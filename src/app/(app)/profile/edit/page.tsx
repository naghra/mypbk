"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/providers/locale-provider";

export default function EditProfilePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const form = useForm<ProfileInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      fullName: "",
      nickname: "",
      gender: "MALE",
      dateOfBirth: "1995-01-01",
      country: "",
      city: "",
      nationality: "",
      maritalStatus: "SINGLE",
      hasChildren: false,
      childrenCount: 0,
      languages: ["en"],
      religiousCommitment: "PRACTICING",
      prayerFrequency: "FIVE_TIMES",
      smoking: "NEVER",
      interests: [],
      personalityTraits: [],
      lifestyleTags: [],
    },
  });

  useEffect(() => {
    void fetch("/api/profiles")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.data) {
          form.reset({
            ...j.data,
            dateOfBirth: j.data.dateOfBirth?.slice?.(0, 10) ?? j.data.dateOfBirth,
          });
        }
      });
  }, [form]);

  async function onSubmit(values: ProfileInput) {
    const res = await fetch("/api/profiles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        interests:
          typeof values.interests === "string"
            ? String(values.interests)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : values.interests,
        languages:
          typeof values.languages === "string"
            ? String(values.languages)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : values.languages,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || t("common.error"));
      return;
    }
    toast.success(t("common.success"));
    router.push("/profile");
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/photos", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);
    if (!res.ok) toast.error(json.error || t("common.error"));
    else toast.success("Photo uploaded");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-4 pb-10">
      <h1 className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
        {t("profile.edit")}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["fullName", "Full name"],
            ["nickname", "Nickname"],
            ["country", "Country"],
            ["city", "City"],
            ["nationality", "Nationality"],
            ["occupation", "Occupation"],
            ["income", "Income (optional)"],
            ["heightCm", "Height (cm)"],
            ["weightKg", "Weight (kg)"],
          ] as const
        ).map(([name, label]) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} {...form.register(name)} />
          </div>
        ))}
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <select id="gender" className="h-11 w-full rounded-2xl border border-emerald-100 bg-white px-4 dark:border-emerald-900 dark:bg-slate-950" {...form.register("gender")}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="maritalStatus">Marital status</Label>
          <select id="maritalStatus" className="h-11 w-full rounded-2xl border border-emerald-100 bg-white px-4 dark:border-emerald-900 dark:bg-slate-950" {...form.register("maritalStatus")}>
            <option value="SINGLE">Single</option>
            <option value="DIVORCED">Divorced</option>
            <option value="WIDOWED">Widowed</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="education">Education</Label>
          <select id="education" className="h-11 w-full rounded-2xl border border-emerald-100 bg-white px-4 dark:border-emerald-900 dark:bg-slate-950" {...form.register("education")}>
            <option value="HIGH_SCHOOL">High school</option>
            <option value="DIPLOMA">Diploma</option>
            <option value="BACHELOR">Bachelor</option>
            <option value="MASTER">Master</option>
            <option value="DOCTORATE">Doctorate</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="religiousCommitment">Religious commitment</Label>
          <select id="religiousCommitment" className="h-11 w-full rounded-2xl border border-emerald-100 bg-white px-4 dark:border-emerald-900 dark:bg-slate-950" {...form.register("religiousCommitment")}>
            <option value="PRACTICING">Practicing</option>
            <option value="MODERATELY_PRACTICING">Moderately practicing</option>
            <option value="SEEKING_TO_IMPROVE">Seeking to improve</option>
            <option value="CULTURAL">Cultural</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prayerFrequency">Prayer frequency</Label>
          <select id="prayerFrequency" className="h-11 w-full rounded-2xl border border-emerald-100 bg-white px-4 dark:border-emerald-900 dark:bg-slate-950" {...form.register("prayerFrequency")}>
            <option value="FIVE_TIMES">Five times</option>
            <option value="MOST_PRAYERS">Most prayers</option>
            <option value="FRIDAY_ONLY">Friday only</option>
            <option value="OCCASIONALLY">Occasionally</option>
            <option value="RARELY">Rarely</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="smoking">Smoking</Label>
          <select id="smoking" className="h-11 w-full rounded-2xl border border-emerald-100 bg-white px-4 dark:border-emerald-900 dark:bg-slate-950" {...form.register("smoking")}>
            <option value="NEVER">Never</option>
            <option value="OCCASIONALLY">Occasionally</option>
            <option value="REGULARLY">Regularly</option>
            <option value="QUIT">Quit</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="languages">Languages (comma separated)</Label>
        <Input
          id="languages"
          defaultValue={(form.getValues("languages") || []).join(", ")}
          onChange={(e) =>
            form.setValue(
              "languages",
              e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            )
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="interests">Interests (comma separated)</Label>
        <Input
          id="interests"
          defaultValue={(form.getValues("interests") || []).join(", ")}
          onChange={(e) =>
            form.setValue(
              "interests",
              e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            )
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">{t("profile.bio")}</Label>
        <Textarea id="bio" {...form.register("bio")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lookingFor">{t("profile.lookingFor")}</Label>
        <Textarea id="lookingFor" {...form.register("lookingFor")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo">Photos</Label>
        <Input
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadPhoto(file);
          }}
        />
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        {t("common.save")}
      </Button>
    </form>
  );
}
