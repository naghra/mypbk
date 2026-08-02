import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.emailVerified && !user.phoneVerified) redirect("/verify");

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-7xl">
      <AppSidebar />
      <div className="flex min-h-[100svh] flex-1 flex-col">
        <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-8">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
