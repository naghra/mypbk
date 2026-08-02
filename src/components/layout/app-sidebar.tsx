"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  Crown,
  HeartHandshake,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/locale-provider";
import { ThemeToggle } from "./theme-toggle";
import { LocaleToggle } from "./locale-toggle";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/discover", icon: Sparkles, key: "discover" },
  { href: "/matches", icon: HeartHandshake, key: "matches" },
  { href: "/messages", icon: MessageCircle, key: "messages" },
  { href: "/search", icon: Search, key: "search" },
  { href: "/likes", icon: HeartHandshake, key: "likes" },
  { href: "/notifications", icon: Bell, key: "notifications" },
  { href: "/verification", icon: BadgeCheck, key: "verification" },
  { href: "/premium", icon: Crown, key: "premium" },
  { href: "/profile", icon: UserRound, key: "profile" },
  { href: "/settings", icon: Settings, key: "settings" },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-emerald-100/80 bg-white/70 p-5 backdrop-blur dark:border-emerald-900 dark:bg-slate-950/60 md:flex">
      <Link href="/discover" className="mb-8">
        <div className="font-display text-3xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
          {t("brand")}
        </div>
        <p className="mt-1 text-xs text-slate-500">{t("tagline")}</p>
      </Link>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Sidebar">
        {links.map(({ href, icon: Icon, key }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-600 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-950",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {t(`nav.${key}`)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex items-center gap-2">
        <ThemeToggle />
        <LocaleToggle />
      </div>
      <Button variant="ghost" className="mt-2 justify-start" onClick={logout}>
        <LogOut className="h-4 w-4" />
        {t("nav.logout")}
      </Button>
    </aside>
  );
}
