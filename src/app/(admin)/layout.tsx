import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin, AuthError } from "@/lib/auth/session";

const links = [
  ["", "Overview"],
  ["/users", "Users"],
  ["/reports", "Reports"],
  ["/analytics", "Analytics"],
  ["/verifications", "Verifications"],
  ["/moderation", "Moderation"],
  ["/subscriptions", "Subscriptions"],
  ["/logs", "Logs"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError && e.status === 403) redirect("/discover");
    redirect("/login");
  }

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-7xl gap-6 px-4 py-6 sm:px-6">
      <aside className="hidden w-56 shrink-0 md:block">
        <Link href="/admin" className="font-display text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
          Mithaq Admin
        </Link>
        <nav className="mt-6 flex flex-col gap-1">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={`/admin${href}`}
              className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-950"
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
