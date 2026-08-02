"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartHandshake, MessageCircle, Search, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/locale-provider";

const items = [
  { href: "/discover", icon: Sparkles, key: "discover" },
  { href: "/matches", icon: HeartHandshake, key: "matches" },
  { href: "/messages", icon: MessageCircle, key: "messages" },
  { href: "/search", icon: Search, key: "search" },
  { href: "/profile", icon: UserRound, key: "profile" },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100/80 bg-white/90 backdrop-blur-xl dark:border-emerald-900 dark:bg-slate-950/90 md:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 px-2 pt-2">
        {items.map(({ href, icon: Icon, key }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition",
                  active ? "text-emerald-600" : "text-slate-500 hover:text-emerald-600",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} aria-hidden />
                <span>{t(`nav.${key}`)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
