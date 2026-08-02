"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Apple } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/providers/locale-provider";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [phoneMode, setPhoneMode] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      locale,
    },
  });

  async function onLogin(values: LoginInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Login failed");
      if (!json.data.emailVerified) {
        router.push("/verify");
        return;
      }
      router.push("/discover");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  async function onRegister(values: RegisterInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Registration failed");
      toast.success(t("auth.verifyEmail"));
      router.push("/verify");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  async function oauth(provider: "google" | "apple") {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error(error.message);
  }

  async function sendOtp() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setOtpSent(true);
      toast.success("OTP sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, token: otp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.push("/discover");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-md rounded-[2rem] border border-emerald-100/80 bg-white/90 p-6 shadow-xl backdrop-blur dark:border-emerald-900 dark:bg-slate-950/80 sm:p-8"
    >
      <h1 className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
        {mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {mode === "login" ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
      </p>

      {!phoneMode ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={
            mode === "login"
              ? loginForm.handleSubmit(onLogin)
              : registerForm.handleSubmit(onRegister)
          }
        >
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("auth.fullName")}</Label>
              <Input id="fullName" {...registerForm.register("fullName")} autoComplete="name" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...(mode === "login" ? loginForm.register("email") : registerForm.register("email"))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              {...(mode === "login"
                ? loginForm.register("password")
                : registerForm.register("password"))}
            />
          </div>
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...registerForm.register("confirmPassword")}
              />
            </div>
          )}
          {mode === "login" && (
            <div className="text-end">
              <Link href="/forgot-password" className="text-sm text-emerald-700 hover:underline dark:text-emerald-300">
                {t("auth.forgot")}
              </Link>
            </div>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? t("common.loading") : t("common.continue")}
          </Button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">{t("auth.phone")}</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+9665..." />
          </div>
          {otpSent && (
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
            </div>
          )}
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={loading}
            onClick={() => (otpSent ? void verifyOtp() : void sendOtp())}
          >
            {otpSent ? t("common.continue") : t("auth.continuePhone")}
          </Button>
        </div>
      )}

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-emerald-100 dark:bg-emerald-900" />
        OR
        <div className="h-px flex-1 bg-emerald-100 dark:bg-emerald-900" />
      </div>

      <div className="grid gap-2">
        <Button type="button" variant="outline" onClick={() => void oauth("google")}>
          {t("auth.continueGoogle")}
        </Button>
        <Button type="button" variant="outline" onClick={() => void oauth("apple")}>
          <Apple className="h-4 w-4" />
          {t("auth.continueApple")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setPhoneMode((v) => !v)}>
          {t("auth.continuePhone")}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
        <Link
          href={mode === "login" ? "/register" : "/login"}
          className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
        >
          {mode === "login" ? t("nav.register") : t("nav.login")}
        </Link>
      </p>
    </motion.div>
  );
}
